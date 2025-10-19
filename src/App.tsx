import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ComponentPalette } from './components/ComponentPalette';
import { SimulationCanvas } from './components/SimulationCanvas';
import { CodeEditor } from './components/CodeEditor';
import { ThemeProvider } from './contexts/ThemeContext';
import type { ComponentInstance, BoardType } from './types';
import { buildHex } from './services/compiler';
import { Splitter } from './components/Splitter';
import type { AVRRunner } from './services/simulation/runner';
import { SettingsModal } from './components/SettingsModal';
import { idGenerator } from './services/idGenerator';

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


function App() {
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardType>('uno');
  const [running, setRunning] = useState(false);
  const [hex, setHex] = useState<string>('');
  const [compilerOutput, setCompilerOutput] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [componentPins, setComponentPins] = useState<Record<string, any[]>>({});
  const [serialOutput, setSerialOutput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [buildServerUrl, setBuildServerUrl] = useState(() => {
    return localStorage.getItem(COMPILER_URL_KEY) || WOKWI_COMPILER_URL;
  });
  const [compilerStatus, setCompilerStatus] = useState<'checking' | 'ok' | 'error'>('checking');

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
        // FIX: Corrected typo in localStorage key from EDITOR_SIZE_SM__KEY to EDITOR_SIZE_SM_KEY.
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
    const checkCompilerStatus = async () => {
      setCompilerStatus('checking');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

        // Use an OPTIONS request to the build endpoint. This is a lightweight way
        // to verify that the server is running and that CORS is configured correctly,
        // without actually triggering a build.
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
        // This will catch network errors (server down) and CORS preflight failures.
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

  const handleAddComponent = (type: string, defaults: Record<string, any>) => {
    const newComponent: ComponentInstance = {
      id: `${type}-${Date.now()}`,
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
    setSelectedComponentId(null);
  }, []);

  const handlePinsLoaded = useCallback((componentId: string, pins: any[]) => {
    setComponentPins(prev => ({ ...prev, [componentId]: pins }));
  }, []);

  const handleCanvasBackgroundClick = useCallback(() => {
    setSelectedComponentId(null);
  }, []);

  const handleCompileAndRun = async (source: string) => {
    // Proactively check compiler status before attempting to fetch
    if (compilerStatus !== 'ok') {
      const statusMessage = compilerStatus === 'error'
          ? `Could not connect to the build server at: ${buildServerUrl}`
          : 'Still checking build server status. Please wait a moment.';

      const helpMessage = `Please ensure your local Python build server is running correctly. Refer to the banner at the top of the page for setup instructions.`

      setCompilerOutput(`${statusMessage}\n\n${helpMessage}`);
      return;
    }

    setCompiling(true);
    setCompilerOutput('Compiling...');
    setSerialOutput('');
    setRunning(false);
    try {
      const result = await buildHex(buildServerUrl, source, [], board);
      if (result.hex) {
        setCompilerOutput('Compilation successful!\n' + (result.stdout || '') + '\n' + (result.stderr || ''));
        setHex(result.hex);
        setRunning(true);
      } else {
        setCompilerOutput('Compilation failed:\n' + result.stderr + '\n' + result.stdout);
        setHex('');
      }
    } catch (error) {
      console.error('Compilation error:', error);
      // This catch block is now a fallback, the proactive check should handle most cases.
      let errorMessage = 'An unknown error occurred during compilation.';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = `Failed to connect to the build server at: ${buildServerUrl}\n\nPlease ensure your local Python build server is running.\n\nRefer to the banner at the top of the page for detailed setup instructions.`;
        // Also update status if we discover it's down here
// FIX: The `compilerStatus` is known to be 'ok' at this point due to the early return,
// so the `if` condition `compilerStatus !== 'error'` is redundant and causes a TypeScript error.
// Removing the condition simplifies the code.
        setCompilerStatus('error');
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setCompilerOutput(errorMessage);
      setHex('');
    } finally {
      setCompiling(false);
    }
  };

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
  const selectedComponentPinInfo = selectedComponentId ? componentPins[selectedComponentId] : null;

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
        <Header
          board={board}
          setBoard={setBoard}
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
            <div className="mt-2">
              <p><strong>To fix this:</strong></p>
              <ol className="list-decimal list-inside pl-2 mt-1 space-y-1">
                <li>Ensure you have Python 3 and Flask installed: <code className="bg-red-200 dark:bg-gray-700 p-1 rounded text-xs font-mono">pip install Flask</code></li>
                <li>Save the server code provided to a file (e.g., <code className="bg-red-200 dark:bg-gray-700 p-1 rounded text-xs font-mono">server.py</code>).</li>
                <li>Run the server from your terminal: <code className="bg-red-200 dark:bg-gray-700 p-1 rounded text-xs font-mono">python server.py</code></li>
                <li>If it's running on a different URL, update it in <strong>Settings</strong> (top right).</li>
              </ol>
            </div>
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
              selectedComponentConnections={selectedComponent ? (selectedComponent.connections || {}) : {}}
              onUpdateComponent={handleUpdateComponent}
              onDeleteComponent={handleDeleteComponent}
              onRemoveConnection={(componentId, pinName, target) => {
                handleUpdateComponent(componentId, {
                  connections: {
                    ...((components.find(c => c.id === componentId)?.connections) || {}),
                    [pinName]: ((components.find(c => c.id === componentId)?.connections?.[pinName] as any[]) || [])
                      .filter((t: any) => !(t.component === target.component && t.pin === target.pin))
                  }
                });
              }}
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
                initialCode={initialCode}
                onCompileAndRun={handleCompileAndRun}
                compilerOutput={compilerOutput}
                compiling={compiling}
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
                onUpdateComponent={handleUpdateComponent}
                onAddComponent={handleAddComponent}
                onPinsLoaded={handlePinsLoaded}
                board={board}
                running={running}
                hex={hex}
                selectedComponentId={selectedComponentId}
                onSelectComponent={setSelectedComponentId}
                onCanvasBackgroundClick={handleCanvasBackgroundClick}
                onSerialOutput={handleSerialOutput}
                setRunner={setRunner}
              />
            </div>
          </div>
        </main>
        <div ref={dragPreviewRef} style={{ position: 'absolute', top: 0, left: '-9999px', zIndex: -1 }} />
        {isSettingsOpen && (
          <SettingsModal
            currentUrl={buildServerUrl}
            onClose={() => setIsSettingsOpen(false)}
            onSave={setBuildServerUrl}
            defaultUrl={WOKWI_COMPILER_URL}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
