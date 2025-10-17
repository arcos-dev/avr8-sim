#!/usr/bin/env python3
"""
Refactored Arduino Build Server (Flask) for arduino-cli
- Organized structure (settings, helpers, endpoints)
- Safer file handling and better diagnostics
- Extra endpoints: versions, boards, cores, libs, ports
- Upload support (optional) and flexible FQBN handling
- Optional defines/flags and warnings level
"""

from __future__ import annotations

import json
import logging
import os
import re
import shlex
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from flask import Flask, jsonify, request
from flask_cors import CORS

# --------------------------------------------------------------------------------------
# Settings / Configuration
# --------------------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ARDUINO_CLI = (SCRIPT_DIR / "arduino-cli")
if os.name == "nt":
    DEFAULT_ARDUINO_CLI = DEFAULT_ARDUINO_CLI.with_suffix(".exe")
DEFAULT_ARDUINO_CLI = str(DEFAULT_ARDUINO_CLI)


def env_bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return v.strip().lower() in {"1", "true", "t", "yes", "y", "on"}


@dataclass
class Settings:
    # Path to arduino-cli (env ARDUINO_CLI or local file or PATH fallback)
    arduino_cli: str = os.getenv("ARDUINO_CLI", DEFAULT_ARDUINO_CLI if Path(DEFAULT_ARDUINO_CLI).exists() else "arduino-cli")

    # Server
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "9090"))
    debug: bool = env_bool("DEBUG", False)

    # Limits
    compile_timeout_s: int = int(os.getenv("COMPILE_TIMEOUT_S", "120"))
    max_files: int = int(os.getenv("MAX_FILES", "64"))
    max_file_size: int = int(os.getenv("MAX_FILE_BYTES", str(2 * 1024 * 1024)))  # 2 MiB

    # FQBN handling (allow any if empty, or restrict to these if set)
    # Example: "arduino:avr:uno,arduino:avr:nano,arduino:avr:mega,arduino:megaavr:uno2018"
    allowed_fqbns_raw: str = os.getenv("ALLOWED_FQBNS", "")
    allowed_fqbns: List[str] = field(default_factory=list)

    # Simple board aliases mapping to FQBNs (expand as needed)
    board_aliases: Dict[str, str] = field(default_factory=lambda: {
        "uno": "arduino:avr:uno",
        "nano": "arduino:avr:nano",
        "mega": "arduino:avr:mega",
        "leonardo": "arduino:avr:leonardo",
        "uno-wifi-rev2": "arduino:megaavr:uno2018",
    })

    def __post_init__(self):
        if self.allowed_fqbns_raw.strip():
            self.allowed_fqbns = [x.strip() for x in self.allowed_fqbns_raw.split(",") if x.strip()]


SET = Settings()


# --------------------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------------------

LOG_FMT = "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
logging.basicConfig(level=logging.DEBUG if SET.debug else logging.INFO, format=LOG_FMT)
log = logging.getLogger("arduino-server")


# --------------------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------------------

def which(cmd: str) -> Optional[str]:
    """Return full path if command is found in PATH, else None."""
    from shutil import which as _which
    return _which(cmd)


def run_cmd(args: List[str], *, cwd: Optional[Path] = None, timeout: Optional[int] = None) -> Tuple[int, str, str]:
    """Run a subprocess and capture stdout/stderr as text."""
    log.debug("Run: %s", " ".join(shlex.quote(a) for a in args))
    try:
        cp = subprocess.run(
            args,
            cwd=str(cwd) if cwd else None,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout or SET.compile_timeout_s,
            text=True,
            check=False,
        )
        return cp.returncode, cp.stdout, cp.stderr
    except subprocess.TimeoutExpired as ex:
        return 124, "", f"Timeout after {ex.timeout}s while running: {' '.join(args)}"


def get_versions() -> Dict[str, str]:
    """Return versions for arduino-cli and AVR toolchain if available."""
    versions: Dict[str, str] = {}

    # arduino-cli
    code, out, err = run_cmd([SET.arduino_cli, "version", "--format", "json"], timeout=20)
    if code == 0:
        try:
            data = json.loads(out or "{}")
            versions["arduino_cli"] = data.get("VersionString") or data.get("Version") or "unknown"
        except Exception:
            versions["arduino_cli"] = (out or err).strip().splitlines()[0] if out or err else "unknown"
    else:
        versions["arduino_cli"] = "not found or error"

    # avr-gcc
    gcc = which("avr-gcc")
    if gcc:
        code, out, _ = run_cmd([gcc, "--version"], timeout=10)
        versions["avr_gcc"] = out.splitlines()[0] if out else "unknown"

    # avr-ld
    ld = which("avr-ld")
    if ld:
        code, out, _ = run_cmd([ld, "--version"], timeout=10)
        versions["avr_ld"] = out.splitlines()[0] if out else "unknown"

    # avr-libc (parse version.h if available in include paths)
    versions["avr_libc"] = detect_avr_libc_version()

    return versions


def detect_avr_libc_version() -> str:
    """Try to detect avr-libc version by scanning GCC include paths for avr/version.h."""
    gcc = which("avr-gcc")
    if not gcc:
        return "avr-libc unknown"
    code, _out, err = run_cmd([gcc, "-E", "-Wp,-v", "-"], timeout=10)
    if code != 0:
        return "avr-libc unknown"
    includes: List[str] = []
    in_block = False
    for line in err.splitlines():
        if not in_block:
            if re.match(r'^\s*#include (\"|\')\.\.\.(\"|\') search starts here:\s*$', line):
                in_block = True
            continue
        if line.strip() == "End of search list.":
            break
        m = re.match(r"^\s+(.*)$", line)
        if m:
            includes.append(m.group(1).strip())
    for inc in includes:
        v = Path(inc) / "avr" / "version.h"
        if v.exists():
            try:
                text = v.read_text(encoding="utf-8", errors="ignore")
                m = re.search(r'__AVR_LIBC_VERSION_STRING__\s+"(.+)"', text)
                if m:
                    return f"avr-libc {m.group(1)}"
            except Exception:
                pass
    return "avr-libc unknown"


def resolve_fqbn(payload: dict) -> str:
    """Resolve FQBN from payload ('fqbn' or 'board' alias)."""
    if "fqbn" in payload and isinstance(payload["fqbn"], str):
        fqbn = payload["fqbn"].strip()
    else:
        board = payload.get("board", "uno")
        fqbn = SET.board_aliases.get(board, board)  # allow direct fqbn or alias

    if SET.allowed_fqbns and fqbn not in SET.allowed_fqbns:
        raise ValueError(f"FQBN '{fqbn}' not allowed")
    return fqbn


SAFE_NAME_RE = re.compile(r"^[A-Za-z0-9_.\-/]+$")
ALLOWED_EXTS = {".ino", ".pde", ".c", ".cpp", ".h", ".hpp", ".S", ".s", ".txt", ".ld"}


def validate_files(files: List[dict]) -> None:
    if not isinstance(files, list) or not files:
        raise ValueError("'files' must be a non-empty list of {name, content}")
    if len(files) > SET.max_files:
        raise ValueError(f"Too many files (>{SET.max_files})")
    for f in files:
        name = f.get("name", "")
        content = f.get("content", "")
        if not isinstance(name, str) or not isinstance(content, str):
            raise ValueError("Each file must have 'name' (str) and 'content' (str)")
        if not SAFE_NAME_RE.match(name) or any(x in name for x in ("..", "~", "|", "\\", "%", "$", "{", "[", "`", "\"", "'", "?", ">", "<", "&")):
            raise ValueError(f"Unsafe filename: {name}")
        if len(content.encode("utf-8")) > SET.max_file_size:
            raise ValueError(f"File too large: {name}")
        ext = Path(name).suffix.lower()
        if ext and ext not in ALLOWED_EXTS:
            raise ValueError(f"Extension not allowed: {name}")


def parse_diagnostics(text: str) -> List[dict]:
    """Parse GCC-like diagnostics into structured items."""
    diags: List[dict] = []
    # Example: /path/file.ino:12:5: error: something bad
    pat = re.compile(r"^(?P<file>[^:\n]+):(?P<line>\d+):(?P<col>\d+):\s*(?P<level>error|warning|note):\s*(?P<msg>.+)$")
    for line in (text or "").splitlines():
        m = pat.match(line.strip())
        if m:
            diags.append({
                "file": m.group("file"),
                "line": int(m.group("line")),
                "column": int(m.group("col")),
                "level": m.group("level"),
                "message": m.group("msg"),
                "raw": line.strip(),
            })
    return diags


def build_properties_from_payload(payload: dict) -> List[str]:
    """
    Build extra --build-property flags from payload.
    - 'defines': {"NAME": "VAL", "FLAG": 1} -> -DNAME=VAL
    - 'extra_flags': list[str] (passed to both C and C++)
    """
    props: List[str] = []

    defines = payload.get("defines", {})
    flags: List[str] = payload.get("extra_flags", [])

    def_flags: List[str] = []
    for k, v in (defines or {}).items():
        if v is True or v == 1:
            def_flags.append(f"-D{k}")
        else:
            def_flags.append(f"-D{k}={v}")
    if def_flags:
        flags = def_flags + (flags or [])

    if flags:
        joined = " ".join(flags)
        props.extend([
            f"compiler.c.extra_flags={joined}",
            f"compiler.cpp.extra_flags={joined}",
        ])
    return [val for p in props for val in ("--build-property", p)]


def compile_sketch(sketch_dir: Path, fqbn: str, *, warnings: str = "default", export_binaries: bool = True,
                   payload: Optional[dict] = None) -> Dict[str, object]:
    """
    Compile the sketch with arduino-cli and return results.
    """
    build_path = sketch_dir / "build"
    out_dir = sketch_dir / "output"
    build_path.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    args = [SET.arduino_cli, "compile", "--fqbn", fqbn, "--warnings", warnings,
            "--build-path", str(build_path), "--output-dir", str(out_dir)]
    if export_binaries:
        args.append("--export-binaries")

    # Try to get structured output when available
    args += ["--format", "json"]

    # Optional build properties (defines/flags)
    if payload:
        args += build_properties_from_payload(payload)

    # Optional verbose
    if env_bool("VERBOSE_COMPILE", False):
        args.append("--verbose")

    code, stdout, stderr = run_cmd(args, cwd=sketch_dir, timeout=SET.compile_timeout_s)

    # Fallback: if JSON parse fails, return raw stdout/stderr + parsed diagnostics
    result: Dict[str, object] = {
        "return_code": code,
        "stdout": stdout,
        "stderr": stderr,
        "diagnostics": parse_diagnostics(stderr + "\n" + stdout),
        "artifacts": {},
    }

    # Parse JSON if we can
    if stdout.strip():
        try:
            result_json = json.loads(stdout)
            result["result_json"] = result_json
            # Try to capture sizes, build info if present
            if isinstance(result_json, dict):
                result["build_info"] = result_json.get("compiler_out") or result_json.get("builder_result")
        except Exception:
            # keep raw
            pass

    # Attempt to read .hex/.eep artifacts
    hex_files = list(out_dir.glob("*.hex"))
    eep_files = list(out_dir.glob("*.eep"))
    def read_text_file(p: Path) -> Optional[str]:
        try:
            return p.read_text(encoding="utf-8")
        except Exception:
            try:
                return p.read_bytes().decode("latin1")
            except Exception:
                return None

    if hex_files:
        result["artifacts"]["hex"] = read_text_file(hex_files[0])
        result["artifacts"]["hex_path"] = str(hex_files[0])
    if eep_files:
        result["artifacts"]["eep"] = read_text_file(eep_files[0])
        result["artifacts"]["eep_path"] = str(eep_files[0])

    return result


def upload_sketch(sketch_dir: Path, fqbn: str, port: str) -> Dict[str, object]:
    """Upload the sketch using arduino-cli upload (compiles if needed)."""
    args = [SET.arduino_cli, "upload", "--fqbn", fqbn, "-p", port, str(sketch_dir), "--format", "json"]
    code, stdout, stderr = run_cmd(args, cwd=sketch_dir, timeout=max(SET.compile_timeout_s, 120))
    resp = {
        "return_code": code,
        "stdout": stdout,
        "stderr": stderr,
    }
    try:
        resp["result_json"] = json.loads(stdout) if stdout.strip() else {}
    except Exception:
        pass
    resp["diagnostics"] = parse_diagnostics(stderr + "\n" + stdout)
    return resp


def write_sketch_files(tmpdir: Path, payload: dict) -> Tuple[Path, str]:
    """
    Write incoming files to a temporary sketch folder.
    Returns (sketch_dir, sketch_name)
    """
    files = payload.get("files", [])
    if payload.get("sketch"):
        files = list(files) + [{"name": "sketch.ino", "content": payload["sketch"]}]

    validate_files(files)

    sketch_name = payload.get("sketchName") or "sketch"
    sketch_dir = tmpdir / sketch_name
    sketch_dir.mkdir(parents=True, exist_ok=True)

    for f in files:
        dst = sketch_dir / f["name"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(f["content"], encoding="utf-8")

    return sketch_dir, sketch_name


# --------------------------------------------------------------------------------------
# Flask App
# --------------------------------------------------------------------------------------

app = Flask("arduino-build-server")
CORS(app)
app.config["DEBUG"] = SET.debug


@app.route("/", methods=["GET"])
def home():
    vers = get_versions()
    return jsonify({
        "name": "arduino-build-server",
        "versions": vers,
        "settings": {
            "arduino_cli": SET.arduino_cli,
            "debug": SET.debug,
            "compile_timeout_s": SET.compile_timeout_s,
            "allowed_fqbns": SET.allowed_fqbns or "ANY",
        },
        "endpoints": [
            "GET /versions",
            "GET /boards",
            "GET /cores",
            "GET /libs",
            "GET /ports",
            "POST /build",
            "POST /upload",
        ],
    })


@app.route("/versions", methods=["GET"])
def versions():
    return jsonify(get_versions())


@app.route("/boards", methods=["GET"])
def boards():
    # Installed boards (listall catalogs all available; list shows connected)
    code, out, err = run_cmd([SET.arduino_cli, "board", "listall", "--format", "json"], timeout=20)
    if code != 0:
        return jsonify({"error": err or out, "return_code": code}), 500
    try:
        data = json.loads(out) if out.strip() else {}
    except Exception as ex:
        return jsonify({"error": f"JSON parse error: {ex}", "raw": out}), 500
    return jsonify(data)


@app.route("/cores", methods=["GET"])
def cores():
    code, out, err = run_cmd([SET.arduino_cli, "core", "list", "--format", "json"], timeout=20)
    if code != 0:
        return jsonify({"error": err or out, "return_code": code}), 500
    try:
        data = json.loads(out) if out.strip() else {}
    except Exception as ex:
        return jsonify({"error": f"JSON parse error: {ex}", "raw": out}), 500
    return jsonify(data)


@app.route("/libs", methods=["GET"])
def libs():
    code, out, err = run_cmd([SET.arduino_cli, "lib", "list", "--format", "json"], timeout=20)
    if code != 0:
        return jsonify({"error": err or out, "return_code": code}), 500
    try:
        data = json.loads(out) if out.strip() else {}
    except Exception as ex:
        return jsonify({"error": f"JSON parse error: {ex}", "raw": out}), 500
    return jsonify(data)


@app.route("/ports", methods=["GET"])
def ports():
    code, out, err = run_cmd([SET.arduino_cli, "board", "list", "--format", "json"], timeout=20)
    if code != 0:
        return jsonify({"error": err or out, "return_code": code}), 500
    try:
        data = json.loads(out) if out.strip() else {}
    except Exception as ex:
        return jsonify({"error": f"JSON parse error: {ex}", "raw": out}), 500
    return jsonify(data)


@app.route("/build", methods=["POST"])
def build():
    """
    Request JSON:
    {
      "sketch": "void setup(){} void loop(){}",
      "files": [{"name":"foo.h","content":"..."}],
      "sketchName": "MySketch",
      "fqbn": "arduino:avr:uno" | or "board": "uno",
      "warnings": "none|default|more|all",
      "defines": {"MYFLAG":1, "BAUD":115200},
      "extra_flags": ["-Os"],
    }
    """
    try:
        payload = request.get_json(force=True, silent=False) or {}
        fqbn = resolve_fqbn(payload)
        warnings = payload.get("warnings", "default")

        with tempfile.TemporaryDirectory(prefix="arduino-") as tmp:
            tmpdir = Path(tmp)
            sketch_dir, sketch_name = write_sketch_files(tmpdir, payload)
            result = compile_sketch(sketch_dir, fqbn, warnings=warnings, export_binaries=True, payload=payload)

        return jsonify({
            "fqbn": fqbn,
            "sketchName": sketch_name,
            **result
        }), (200 if result.get("return_code") == 0 else 400)

    except ValueError as ve:
        log.exception("Validation error")
        return jsonify({"error": str(ve)}), 400
    except Exception as ex:
        log.exception("Build error")
        return jsonify({"error": str(ex)}), 500


@app.route("/upload", methods=["POST"])
def upload():
    """
    Request JSON:
    {
      "sketch": "...",
      "files": [...],
      "sketchName": "MySketch",
      "fqbn": "arduino:avr:uno" | or "board": "uno",
      "port": "/dev/ttyACM0" (or "COM5" on Windows)
    }
    """
    try:
        payload = request.get_json(force=True, silent=False) or {}
        fqbn = resolve_fqbn(payload)
        port = payload.get("port")
        if not port:
            raise ValueError("'port' is required for upload")

        with tempfile.TemporaryDirectory(prefix="arduino-") as tmp:
            tmpdir = Path(tmp)
            sketch_dir, sketch_name = write_sketch_files(tmpdir, payload)
            # Compile first to ensure artifacts exist (and better error messages)
            build_res = compile_sketch(sketch_dir, fqbn, warnings=payload.get("warnings", "default"),
                                       export_binaries=True, payload=payload)
            if build_res.get("return_code") != 0:
                return jsonify({"error": "compile failed", "build": build_res}), 400

            up_res = upload_sketch(sketch_dir, fqbn, port)
            status = 200 if up_res.get("return_code") == 0 else 400

        return jsonify({
            "fqbn": fqbn,
            "sketchName": sketch_name,
            "port": port,
            "build": build_res,
            "upload": up_res
        }), status

    except ValueError as ve:
        log.exception("Validation error")
        return jsonify({"error": str(ve)}), 400
    except Exception as ex:
        log.exception("Upload error")
        return jsonify({"error": str(ex)}), 500


# --------------------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------------------

if __name__ == "__main__":
    log.info("Starting arduino-build-server on %s:%d (arduino-cli=%s)", SET.host, SET.port, SET.arduino_cli)
    app.run(host=SET.host, port=SET.port, debug=SET.debug)
