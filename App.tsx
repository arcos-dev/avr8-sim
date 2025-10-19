
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { ComponentPalette } from './components/ComponentPalette';
import { SimulationCanvas } from './components/SimulationCanvas';
import { CodeEditor } from './components/CodeEditor';
import { ThemeProvider } from './contexts/ThemeContext';
import type {
  ComponentInstance,
  BoardType,
  Wire,
  WireOptions,
  SimulationSettings,
  PinConnectionMap,
  PinConnectionTarget,
  CodeFile,
  CodeLanguage,
} from './types';
import { buildHex } from './services/compiler';
import { Splitter } from './components/Splitter';
import type { AVRRunner } from './services/simulation/runner';
import { createWire, updateWire } from './services/simulation/wiring';
import { SettingsModal } from './components/SettingsModal';
import { BOARD_ELEMENTS } from './constants';
import { getComponentMeta } from './services/simulation/component-meta';

const initialCode = `
// Example for Serial Plotter
// This sketch generates sine and cosine waves and prints them to the Serial port.
// Open the Serial Plotter to visualize the data in real-time.

void setup() {
  Serial.begin(9600);
  Serial.println("Arduino is ready!");
}

void loop() {
  // Calculate sine and cosine values based on time
  float sinValue = sin(millis() / 500.0) * 100;
  float cosValue = cos(millis() / 500.0) * 100;

  // Print the values in a comma-separated format for the plotter
  Serial.print(sinValue);
  Serial.print(",");
  Serial.println(cosValue);

  // A small delay to control the data rate
  delay(50);
}
`.trim();

// Keys for localStorage
const PALETTE_WIDTH_KEY = 'avr_palette_width';
const EDITOR_SIZE_XL_KEY = 'avr_editor_width_xl';
const EDITOR_SIZE_SM_KEY = 'avr_editor_height_sm';
const COMPILER_URL_KEY = 'avr_compiler_url';
const WOKWI_COMPILER_URL = 'http://localhost:9090';
const BOARD_COMPONENT_ID = 'board';
const SIM_SETTINGS_KEY = 'avr_simulation_settings';
const DEFAULT_SIMULATION_SETTINGS: SimulationSettings = {
  simulateElectronFlow: true,
  simulationSpeedMode: 'realistic',
  renderingFPS: 'unlimited',
};
const DEFAULT_PROJECT_NAME = 'Meu Projeto';

const LANGUAGE_BY_EXTENSION: Record<string, CodeLanguage> = {
  '.ino': 'arduino',
  '.c': 'c',
  '.h': 'c',
  '.hpp': 'cpp',
  '.hh': 'cpp',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.S': 'asm',
  '.s': 'asm',
  '.asm': 'asm',
  '.md': 'markdown',
  '.markdown': 'markdown',
};

const inferLanguageFromName = (name: string): CodeLanguage => {
  const lower = name.toLowerCase();
  const match = Object.keys(LANGUAGE_BY_EXTENSION).find((ext) => lower.endsWith(ext));
  return match ? LANGUAGE_BY_EXTENSION[match] : 'arduino';
};

const DEFAULT_EXTENSION_BY_LANGUAGE: Record<CodeLanguage, string> = {
  arduino: '.ino',
  c: '.c',
  cpp: '.cpp',
  asm: '.asm',
  markdown: '.md',
};

const createFileId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const createDefaultFile = (name = 'sketch.ino', content = initialCode): CodeFile => ({
  id: createFileId(),
  name,
  language: inferLanguageFromName(name),
  content,
});


function App() {
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardType>('uno');
  const [running, setRunning] = useState(false);
  const [hex, setHex] = useState<string>('');
  const [compilerOutput, setCompilerOutput] = useState('');
  const [compiling, setCompiling] = useState(false);
  const componentCountersRef = useRef<Record<string, number>>({});
  const [componentPins, setComponentPins] = useState<Record<string, any[]>>({});
  const [serialOutput, setSerialOutput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [buildServerUrl, setBuildServerUrl] = useState(() => {
    return localStorage.getItem(COMPILER_URL_KEY) || WOKWI_COMPILER_URL;
  });
  const [compilerStatus, setCompilerStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>(() => {
    try {
      const stored = localStorage.getItem(SIM_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SimulationSettings>;
        return { ...DEFAULT_SIMULATION_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to read simulation settings', error);
    }
    return DEFAULT_SIMULATION_SETTINGS;
  });
  const [fileState, setFileState] = useState<{ files: CodeFile[]; activeId: string }>(() => {
    const file = createDefaultFile();
    return { files: [file], activeId: file.id };
  });

  const codeFiles = fileState.files;
  const activeFileId = fileState.activeId;

  const mainContentRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<AVRRunner | null>(null);

  const [paletteWidth, setPaletteWidth] = useState(() => {
    const saved = localStorage.getItem(PALETTE_WIDTH_KEY);
    const val = saved ? parseInt(saved, 10) : 192;
    return isNaN(val) ? 192 : Math.max(160, Math.min(val, 500));
  });

  const [isXlLayout, setIsXlLayout] = useState(window.matchMedia('(min-width: 1280px)').matches);

  const [editorSize, setEditorSize] = useState(() => {
    const isXl = window.matchMedia('(min-width: 1280px)').matches;
    if (isXl) {
      const saved = localStorage.getItem(EDITOR_SIZE_XL_KEY);
      const defaultSize = window.innerWidth / 3.5;
      const val = saved ? parseInt(saved, 10) : defaultSize;
      return isNaN(val) ? defaultSize : Math.max(300, val);
    } else {
      const saved = localStorage.getItem(EDITOR_SIZE_SM_KEY);
      const defaultSize = 320;
      const val = saved ? parseInt(saved, 10) : defaultSize;
      return isNaN(val) ? defaultSize : Math.max(200, val);
    }
  });
  const activeFile = useMemo(() => {
    if (codeFiles.length === 0) {
      return null;
    }
    return codeFiles.find(file => file.id === activeFileId) ?? codeFiles[0];
  }, [codeFiles, activeFileId]);

  // Sync component counters with existing components
  useEffect(() => {
    const counters: Record<string, number> = {};

    // Find the highest number for each component type
    components.forEach(component => {
      const match = component.id.match(/^(.+)-(\d+)$/);
      if (match) {
        const [, type, numStr] = match;
        const num = parseInt(numStr, 10);
        if (!isNaN(num)) {
          counters[type] = Math.max(counters[type] || 0, num);
        }
      }
    });

    // Update the ref with the current highest counters
    componentCountersRef.current = counters;
  }, [components]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const updateLayout = (matches: boolean) => {
      setIsXlLayout(matches);
      if (matches) {
        const saved = localStorage.getItem(EDITOR_SIZE_XL_KEY);
        const defaultSize = window.innerWidth / 3.5;
        const val = saved ? parseInt(saved, 10) : defaultSize;
        setEditorSize(isNaN(val) ? defaultSize : Math.max(300, val));
      } else {
        const saved = localStorage.getItem(EDITOR_SIZE_SM_KEY);
        const defaultSize = 320;
        const val = saved ? parseInt(saved, 10) : defaultSize;
        setEditorSize(isNaN(val) ? defaultSize : Math.max(200, val));
      }
    };
    const handleChange = (event: MediaQueryListEvent) => {
      updateLayout(event.matches);
    };
    updateLayout(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(PALETTE_WIDTH_KEY, paletteWidth.toString());
  }, [paletteWidth]);

  useEffect(() => {
    if (isXlLayout) {
      localStorage.setItem(EDITOR_SIZE_XL_KEY, editorSize.toString());
    } else {
      localStorage.setItem(EDITOR_SIZE_SM_KEY, editorSize.toString());
    }
  }, [editorSize, isXlLayout]);

  useEffect(() => {
    localStorage.setItem(COMPILER_URL_KEY, buildServerUrl);
  }, [buildServerUrl]);

  useEffect(() => {
    localStorage.setItem(SIM_SETTINGS_KEY, JSON.stringify(simulationSettings));
  }, [simulationSettings]);

  useEffect(() => {
    const checkCompilerStatus = async () => {
      setCompilerStatus('checking');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

        const resp = await fetch(buildServerUrl + '/build', {
          method: 'OPTIONS',
          mode: 'cors',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (resp.ok) {
          setCompilerStatus('ok');
        } else {
          setCompilerStatus('error');
        }
      } catch (e) {
        setCompilerStatus('error');
      }
    };
    checkCompilerStatus();
  }, [buildServerUrl]);

  const setRunner = useCallback((runner: AVRRunner | null) => {
    runnerRef.current = runner;
  }, []);

  const handleSerialInput = (data: string) => {
    runnerRef.current?.serialWrite(data);
  };

  const handleSerialOutput = useCallback((char: string) => {
    setSerialOutput(prev => prev + char);
  }, []);

  const handleClearSerialOutput = useCallback(() => {
    setSerialOutput('');
  }, []);

  const handleSettingsSave = useCallback(
    ({ compilerUrl, simulation }: { compilerUrl: string; simulation: SimulationSettings }) => {
      setBuildServerUrl(compilerUrl);
      setSimulationSettings({ ...DEFAULT_SIMULATION_SETTINGS, ...simulation });
    },
    [setBuildServerUrl, setSimulationSettings]
  );

  const generateComponentId = (type: string): string => {
    // Initialize counter for this type if it doesn't exist
    if (!componentCountersRef.current[type]) {
      componentCountersRef.current[type] = 0;
    }

    // Increment counter
    componentCountersRef.current[type]++;

    // Generate sequential ID
    return `${type}-${componentCountersRef.current[type]}`;
  };

  const handleAddComponent = (type: string, defaults: Record<string, any>) => {
    const newComponent: ComponentInstance = {
      id: generateComponentId(type),
      type,
      x: 100 + (components.length % 5) * 50,
      y: 100 + (components.length % 5) * 50,
      ...defaults,
    };
    setComponents((prev) => [...prev, newComponent]);
    setSelectedComponentId(newComponent.id);
  };

  const handleUpdateComponent = useCallback((id: string, updates: Partial<ComponentInstance>) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const handleDeleteComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter(c => c.id !== id));
    setComponentPins(prev => {
      const newPins = {...prev};
      delete newPins[id];
      return newPins;
    })
    // Also remove any wires connected to the deleted component
    setWires(prev => prev.filter(w => w.from.componentId !== id && w.to.componentId !== id));
    setSelectedComponentId(null);
  }, []);

  const handlePinsLoaded = useCallback((componentId: string, pins: any[]) => {
    setComponentPins(prev => ({ ...prev, [componentId]: pins }));
  }, []);

  const ensureFileName = useCallback(
    (rawName: string, fallbackExtension = '.ino') => {
      const trimmed = rawName.trim();
      if (!trimmed) {
        return '';
      }
      if (trimmed.includes('.')) {
        return trimmed;
      }
      return `${trimmed}${fallbackExtension}`;
    },
    []
  );

  const generateUniqueName = useCallback(
    (desiredName: string) => {
      const existing = new Set(codeFiles.map((file) => file.name.toLowerCase()));
      if (!existing.has(desiredName.toLowerCase())) {
        return desiredName;
      }
      const lastDot = desiredName.lastIndexOf('.');
      const base = lastDot > 0 ? desiredName.slice(0, lastDot) : desiredName;
      const ext = lastDot > 0 ? desiredName.slice(lastDot) : '';
      let counter = 2;
      let candidate = `${base}-${counter}${ext}`;
      while (existing.has(candidate.toLowerCase())) {
        counter += 1;
        candidate = `${base}-${counter}${ext}`;
      }
      return candidate;
    },
    [codeFiles]
  );

  const handleSelectFile = useCallback((id: string) => {
    setFileState(prev => (prev.activeId === id ? prev : { ...prev, activeId: id }));
  }, []);

  const handleUpdateFileContent = useCallback((id: string, content: string) => {
    setFileState(prev => ({
      ...prev,
      files: prev.files.map(file => (file.id === id ? { ...file, content } : file)),
    }));
  }, []);

  const handleRenameFile = useCallback((id: string) => {
    const file = codeFiles.find(f => f.id === id);
    if (!file) return;
    const response = window.prompt('Renomear arquivo', file.name);
    if (!response) return;
    const ensured = ensureFileName(response, DEFAULT_EXTENSION_BY_LANGUAGE[file.language] ?? '.txt');
    if (!ensured) return;
    const uniqueName = generateUniqueName(ensured);
    setFileState(prev => ({
      ...prev,
      files: prev.files.map(f => (f.id === id ? { ...f, name: uniqueName, language: inferLanguageFromName(uniqueName) } : f)),
    }));
  }, [codeFiles, ensureFileName, generateUniqueName]);

  const handleDeleteFile = useCallback((id: string) => {
    setFileState(prev => {
      if (prev.files.length <= 1) {
        return prev;
      }
      const files = prev.files.filter(file => file.id !== id);
      const activeId = prev.activeId === id ? files[files.length - 1].id : prev.activeId;
      return { files, activeId };
    });
  }, []);

  const handleAddFile = useCallback(() => {
    const defaultName = `arquivo-${codeFiles.length + 1}.ino`;
    const response = window.prompt('Nome do novo arquivo', defaultName);
    if (!response) return;
    const ensured = ensureFileName(response, '.ino');
    if (!ensured) return;
    const uniqueName = generateUniqueName(ensured);
    const newFile = createDefaultFile(uniqueName, '');
    setFileState(prev => ({
      files: [...prev.files, newFile],
      activeId: newFile.id,
    }));
  }, [codeFiles.length, ensureFileName, generateUniqueName]);

  const handleAddWire = useCallback((wire: WireOptions) => {
    setWires(prev => [...prev, createWire(wire)]);
  }, []);

  const handleUpdateWire = useCallback((wireId: string, updates: Partial<WireOptions>) => {
    setWires(prev =>
      prev.map((wire) => {
        if (wire.id !== wireId) {
          return wire;
        }
        const nextUpdates: Partial<Pick<Wire, 'from' | 'to' | 'signal' | 'color' | 'metadata'>> = {};
        if (updates.from) {
          nextUpdates.from = updates.from;
        }
        if (updates.to) {
          nextUpdates.to = updates.to;
        }
        if (updates.signal) {
          nextUpdates.signal = updates.signal;
        }
        if (updates.color) {
          nextUpdates.color = updates.color;
        }
        if (updates.metadata) {
          nextUpdates.metadata = updates.metadata;
        }
        return updateWire(wire, nextUpdates);
      })
    );
  }, []);

  const handleRemoveConnection = useCallback((componentId: string, pinName: string, target: PinConnectionTarget) => {
    setWires(prev => {
      let removed = false;
      return prev.filter(wire => {
        const matches =
          ((wire.from.componentId === componentId && wire.from.pinName === pinName) &&
            (wire.to.componentId === target.componentId && wire.to.pinName === target.pinName)) ||
          ((wire.to.componentId === componentId && wire.to.pinName === pinName) &&
            (wire.from.componentId === target.componentId && wire.from.pinName === target.pinName));
        if (matches && !removed) {
          removed = true;
          return false;
        }
        return true;
      });
    });
  }, []);

  const handleDeleteWire = useCallback((id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleCreateProject = useCallback(() => {
    const response = window.prompt('Nome do projeto', projectName);
    const nextName = response && response.trim() ? response.trim() : DEFAULT_PROJECT_NAME;
    setProjectName(nextName);
    runnerRef.current?.stop();
    setRunner(null);
    setRunning(false);
    setHex('');
    setCompilerOutput('');
    setSerialOutput('');
    setComponents([]);
    setWires([]);
    setComponentPins({});
    setSelectedComponentId(null);
    const file = createDefaultFile();
    setFileState({ files: [file], activeId: file.id });
  }, [projectName, setRunner]);

  const handleRenameProject = useCallback(() => {
    const response = window.prompt('Renomear projeto', projectName);
    if (!response) return;
    const trimmed = response.trim();
    if (trimmed) {
      setProjectName(trimmed);
    }
  }, [projectName]);

  const handleCompileAndRun = useCallback(async (file: CodeFile | null) => {
    if (!file) {
      setCompilerOutput('Nenhum arquivo selecionado para compilação.');
      return;
    }

    if (file.language !== 'arduino') {
      setCompilerOutput(`O compilador suporta apenas sketches Arduino (.ino). O arquivo "${file.name}" não será compilado.`);
      return;
    }

    if (compilerStatus !== 'ok') {
      const statusMessage = compilerStatus === 'error'
          ? `Could not connect to the build server at: ${buildServerUrl}`
          : 'Still checking build server status. Please wait a moment.';

      const helpMessage = `Please ensure your local Python build server is running correctly. Refer to the banner at the top of the page for setup instructions.`;

      setCompilerOutput(`${statusMessage}\n\n${helpMessage}`);
      return;
    }

    setCompiling(true);
    setCompilerOutput(`Compiling ${file.name}...`);
    setSerialOutput('');
    setRunning(false);
    try {
      const result = await buildHex(buildServerUrl, file.content, [], board);
      if (result.hex) {
        setCompilerOutput(`Compilation successful!\n${result.stdout || ''}\n${result.stderr || ''}`.trim());
        setHex(result.hex);
        setRunning(true);
      } else {
        setCompilerOutput(`Compilation failed:\n${result.stderr}\n${result.stdout}`.trim());
        setHex('');
      }
    } catch (error) {
      console.error('Compilation error:', error);
      let errorMessage = 'An unknown error occurred during compilation.';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = `Failed to connect to the build server at: ${buildServerUrl}\n\nPlease ensure your local Python build server is running.\n\nRefer to the banner at the top of the page for detailed setup instructions.`;
        setCompilerStatus('error');
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setCompilerOutput(errorMessage);
      setHex('');
    } finally {
      setCompiling(false);
    }
  }, [board, buildServerUrl, compilerStatus]);

  const handleStop = () => {
    setRunning(false);
  };

  const handlePaletteResize = useCallback((dx: number) => {
    setPaletteWidth(prev => Math.max(160, Math.min(prev + dx, 500)));
  }, []);

  const handleEditorResize = useCallback((delta: number) => {
    setEditorSize(prev => {
      const newSize = prev - delta;
      if (isXlLayout) {
        const containerWidth = mainContentRef.current?.offsetWidth ?? window.innerWidth;
        return Math.max(300, Math.min(newSize, containerWidth * 0.75));
      } else {
        const containerHeight = mainContentRef.current?.offsetHeight ?? window.innerHeight;
        return Math.max(200, Math.min(newSize, containerHeight * 0.75));
      }
    });
  }, [isXlLayout]);

  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;
  const selectedComponentPinInfo = useMemo(() => {
    if (!selectedComponentId) {
      return null;
    }
    const existing = componentPins[selectedComponentId];
    if (existing) {
      return existing;
    }
    if (selectedComponentId === BOARD_COMPONENT_ID) {
      return getComponentMeta(BOARD_ELEMENTS[board]).pins;
    }
    return null;
  }, [selectedComponentId, componentPins, board]);

  const connectionsByComponent = useMemo(() => {
    const map = new Map<string, PinConnectionMap>();

    const addConnection = (source: { componentId: string; pinName: string }, target: PinConnectionTarget) => {
      if (!map.has(source.componentId)) {
        map.set(source.componentId, {});
      }
      const pinMap = map.get(source.componentId)!;
      if (!pinMap[source.pinName]) {
        pinMap[source.pinName] = [];
      }
      pinMap[source.pinName].push(target);
    };

    wires.forEach((wire) => {
      addConnection(wire.from, { componentId: wire.to.componentId, pinName: wire.to.pinName });
      addConnection(wire.to, { componentId: wire.from.componentId, pinName: wire.from.pinName });
    });

    return map;
  }, [wires]);

  const selectedComponentConnections = useMemo<PinConnectionMap>(() => {
    if (!selectedComponentId) {
      return {};
    }
    return connectionsByComponent.get(selectedComponentId) ?? {};
  }, [selectedComponentId, connectionsByComponent]);

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
        <Header
          board={board}
          setBoard={setBoard}
          projectName={projectName}
          onRenameProject={handleRenameProject}
          onCreateProject={handleCreateProject}
          onAddFile={handleAddFile}
          onStop={handleStop}
          onOpenSettings={() => setIsSettingsOpen(true)}
          running={running}
          compiling={compiling}
        />
        {compilerStatus === 'error' && (
          <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 text-sm" role="alert">
            <p className="font-bold">Local Compiler Connection Error</p>
            <p>
              Could not connect to the build server at <strong>{buildServerUrl}</strong>.
              This app requires a local Python server to compile code.
            </p>
          </div>
        )}
        <main className="flex flex-1 overflow-hidden">
          <div
            style={{ width: `${paletteWidth}px` }}
            className="hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
          >
            <ComponentPalette
              onAddComponent={handleAddComponent}
              dragPreviewRef={dragPreviewRef}
              selectedComponent={selectedComponent}
              selectedComponentPins={selectedComponentPinInfo}
              selectedComponentConnections={selectedComponentConnections}
              onUpdateComponent={handleUpdateComponent}
              onDeleteComponent={handleDeleteComponent}
              onRemoveConnection={handleRemoveConnection}
            />
          </div>
          <Splitter
            orientation="vertical"
            onResize={handlePaletteResize}
            className="hidden md:block"
          />

          <div ref={mainContentRef} className="flex-1 flex flex-col-reverse xl:flex-row-reverse overflow-hidden">
            <div
              className="relative flex flex-col shrink-0"
              style={isXlLayout ? { width: `${editorSize}px` } : { height: `${editorSize}px` }}
            >
              <CodeEditor
                files={codeFiles}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onUpdateFile={handleUpdateFileContent}
                onCompileAndRun={handleCompileAndRun}
                compilerOutput={compilerOutput}
                compiling={compiling}
                selectedComponent={selectedComponent}
                selectedComponentPins={selectedComponentPinInfo}
                selectedComponentConnections={selectedComponentConnections}
                onUpdateComponent={handleUpdateComponent}
                onDeleteComponent={handleDeleteComponent}
                onRemoveConnection={handleRemoveConnection}
                serialOutput={serialOutput}
                onSerialInput={handleSerialInput}
                onClearSerialOutput={handleClearSerialOutput}
                running={running}
              />
            </div>

            <Splitter
              orientation={isXlLayout ? 'vertical' : 'horizontal'}
              onResize={handleEditorResize}
            />

            <div className="flex-1 relative overflow-hidden">
              <SimulationCanvas
                components={components}
                wires={wires}
                onUpdateComponent={handleUpdateComponent}
                onAddComponent={handleAddComponent}
                onDeleteComponent={handleDeleteComponent}
                onAddWire={handleAddWire}
                onUpdateWire={handleUpdateWire}
                onDeleteWire={handleDeleteWire}
                onPinsLoaded={handlePinsLoaded}
                board={board}
                running={running}
                hex={hex}
                selectedComponentId={selectedComponentId}
                onSelectComponent={setSelectedComponentId}
                onSerialOutput={handleSerialOutput}
                setRunner={setRunner}
                simulateElectronFlow={simulationSettings.simulateElectronFlow}
                simulationSpeedMode={simulationSettings.simulationSpeedMode}
                simulationSettings={simulationSettings}
              />
            </div>
          </div>
        </main>
        <div ref={dragPreviewRef} style={{ position: 'absolute', top: 0, left: '-9999px', zIndex: -1 }} />
        {isSettingsOpen && (
          <SettingsModal
            currentUrl={buildServerUrl}
            defaultUrl={WOKWI_COMPILER_URL}
            simulationSettings={simulationSettings}
            defaultSimulationSettings={DEFAULT_SIMULATION_SETTINGS}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSettingsSave}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;






