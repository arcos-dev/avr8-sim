

export interface IHexiResult {
  stdout: string;
  stderr: string;
  hex: string;
}

// This interface models the actual JSON structure returned by the Python server
interface PythonBuildResponse {
  stdout: string; // raw stdout from arduino-cli (can be JSON)
  stderr: string; // raw stderr from arduino-cli
  artifacts: {
    hex?: string;
  };
  return_code: number;
  // This is the parsed JSON from the raw stdout string
  result_json?: {
    compiler_out?: string;
    compiler_err?: string;
    success: boolean;
  };
}

export async function buildHex(
  serverUrl: string,
  source: string, 
  files: any[], 
  board: 'uno' | 'nano' | 'mega' = 'uno'
): Promise<IHexiResult> {
  const resp = await fetch(serverUrl + '/build', {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sketch: source,
      files,
      board: board,
    })
  });

  if (!resp.ok) {
    let errorText = '';
    try {
      // The server might return a JSON error object like {"error": "..."}
      const errorJson = await resp.json();
      errorText = errorJson.error || JSON.stringify(errorJson);
    } catch (e) {
      try {
        errorText = await resp.text();
      } catch (e2) {
        errorText = 'Could not read error response.';
      }
    }
    throw new Error(`Compilation failed: ${resp.status} ${resp.statusText}\n${errorText}`);
  }

  const serverResponse = await resp.json() as PythonBuildResponse;

  // Adapt the server's response to the IHexiResult format that the App expects.
  const stdoutMessage = serverResponse.result_json?.compiler_out || '';
  const stderrMessage = serverResponse.stderr || serverResponse.result_json?.compiler_err || '';

  return {
    hex: serverResponse.artifacts?.hex ?? '', // Provide empty string if hex is missing
    stdout: stdoutMessage,
    stderr: stderrMessage,
  };
}