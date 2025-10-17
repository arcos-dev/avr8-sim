import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-asm6502';
import 'prismjs/themes/prism-tomorrow.css';

import { PlayIcon } from './icons/PlayIcon';
import { PropertiesPanel } from './PropertiesPanel';
import { SerialPlotter } from './SerialPlotter';
import { TrashIcon } from './icons/TrashIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { ChartLineIcon } from './icons/ChartLineIcon';
import type {
  ComponentInstance,
  CodeFile,
  CodeLanguage,
  PinConnectionMap,
  PinConnectionTarget,
} from '../types';

interface CodeEditorProps {
  files: CodeFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onCreateFile: () => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string) => void;
  onUpdateFile: (id: string, content: string) => void;
  onCompileAndRun: (file: CodeFile | null) => void;
  compilerOutput: string;
  compiling: boolean;
  selectedComponent: ComponentInstance | null;
  selectedComponentPins: any[] | null;
  selectedComponentConnections: PinConnectionMap;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onDeleteComponent: (id: string) => void;
  onRemoveConnection: (componentId: string, pinName: string, target: PinConnectionTarget) => void;
  serialOutput: string;
  onSerialInput: (data: string) => void;
  onClearSerialOutput: () => void;
  running: boolean;
}

type MainTab = 'code' | 'properties';
type BottomTab = 'output' | 'serial';
type SerialView = 'text' | 'plotter';

const PRISM_LANGUAGE_MAP: Record<CodeLanguage, string> = {
  arduino: 'cpp',
  c: 'c',
  cpp: 'cpp',
  asm: 'asm6502',
  markdown: 'markdown',
};

const highlightCode = (code: string, language: CodeLanguage) => {
  const prismLanguage = PRISM_LANGUAGE_MAP[language] ?? 'clike';
  const grammar = Prism.languages[prismLanguage] || Prism.languages.clike || Prism.languages.markup;
  return Prism.highlight(code, grammar, prismLanguage);
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onUpdateFile,
  onCompileAndRun,
  compilerOutput,
  compiling,
  selectedComponent,
  selectedComponentPins,
  selectedComponentConnections,
  onUpdateComponent,
  onDeleteComponent,
  onRemoveConnection,
  serialOutput,
  onSerialInput,
  onClearSerialOutput,
  running,
}) => {
  const [mainTab, setMainTab] = useState<MainTab>('code');
  const [bottomTab, setBottomTab] = useState<BottomTab>('output');
  const [serialView, setSerialView] = useState<SerialView>('plotter');
  const [serialInputValue, setSerialInputValue] = useState('');
  const serialOutputRef = useRef<HTMLPreElement>(null);
  const firstRunRef = useRef(true);

  const activeFile = useMemo(() => files.find((file) => file.id === activeFileId) ?? files[0] ?? null, [files, activeFileId]);

  useEffect(() => {
    if (!activeFile && files.length > 0) {
      onSelectFile(files[0].id);
    }
  }, [activeFile, files, onSelectFile]);

  useEffect(() => {
    if (selectedComponent) {
      setMainTab('properties');
    } else {
      setMainTab('code');
    }
  }, [selectedComponent]);

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    if (running && bottomTab !== 'serial') {
      setBottomTab('serial');
    }
    if (!running && bottomTab === 'serial') {
      setBottomTab('output');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (bottomTab === 'serial' && serialView === 'text' && serialOutputRef.current) {
      serialOutputRef.current.scrollTop = serialOutputRef.current.scrollHeight;
    }
  }, [serialOutput, bottomTab, serialView]);

  const highlight = useMemo(() => {
    const language = activeFile?.language ?? 'arduino';
    return (code: string) => highlightCode(code, language);
  }, [activeFile?.language]);

  const handleSerialSend = () => {
    if (serialInputValue.trim()) {
      onSerialInput(serialInputValue + '\n');
      setSerialInputValue('');
    }
  };

  const handleSerialInputKeypress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSerialSend();
    }
  };

  const renderSerialContent = () => {
    if (!running) {
      return <div className="p-4 text-sm text-gray-500">Start the simulation to interact with the Serial Monitor.</div>;
    }

    if (serialView === 'text') {
      return (
        <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-800">
          <pre ref={serialOutputRef} className="p-4 text-xs whitespace-pre-wrap flex-1 overflow-y-auto">
            {serialOutput || 'Serial output will appear here...'}
          </pre>
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2 bg-white dark:bg-gray-900">
            <input
              type="text"
              value={serialInputValue}
              onChange={(e) => setSerialInputValue(e.target.value)}
              onKeyDown={handleSerialInputKeypress}
              placeholder="Type and press Enter to send"
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSerialSend}
              className="px-4 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-gray-100 dark:bg-gray-800">
        <SerialPlotter data={serialOutput} />
      </div>
    );
  };

  const handleCompileClick = () => {
    onCompileAndRun(activeFile ?? null);
  };

  const canRemoveFile = files.length > 1;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold">Arquivos do Projeto</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{activeFile?.name || '—'}</span>
        </div>
        <button
          onClick={handleCompileClick}
          disabled={compiling || !activeFile}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          <PlayIcon />
          <span>{compiling ? 'Compiling...' : 'Compile & Run'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2">
        <div className="flex overflow-x-auto">
          {files.map((file) => {
            const isActive = file.id === activeFile?.id;
            return (
              <div
                key={file.id}
                className={`flex items-center px-3 py-2 text-sm border-b-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <button
                  onClick={() => onSelectFile(file.id)}
                  onDoubleClick={() => onRenameFile(file.id)}
                  className="flex items-center gap-2 focus:outline-none"
                  title="Duplo clique para renomear"
                >
                  <span className="font-medium">{file.name}</span>
                </button>
                {canRemoveFile && (
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="ml-1 text-xs text-gray-400 hover:text-red-500 focus:outline-none"
                    title="Fechar arquivo"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={onCreateFile}
          className="ml-auto mr-1 px-2 py-1 text-xs font-semibold rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          + Arquivo
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button onClick={() => setMainTab('code')} className={`px-4 py-2 text-sm font-semibold ${mainTab === 'code' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          Code
        </button>
        <button
          onClick={() => selectedComponent && setMainTab('properties')}
          disabled={!selectedComponent}
          className={`px-4 py-2 text-sm font-semibold ${selectedComponent ? (mainTab === 'properties' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800') : 'text-gray-400 cursor-not-allowed'}`}
        >
          Properties
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {mainTab === 'code' && (
          <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">
            {activeFile ? (
              <Editor
                value={activeFile.content}
                onValueChange={(value) => onUpdateFile(activeFile.id, value)}
                highlight={highlight}
                padding={16}
                textareaClassName="outline-none"
                preClassName="language-clike"
                className="text-sm font-mono text-gray-900 dark:text-gray-100"
                style={{ minHeight: '100%' }}
                spellCheck={false}
              />
            ) : (
              <div className="p-6 text-sm text-gray-500">Crie um arquivo para começar a editar o código.</div>
            )}
          </div>
        )}
        {mainTab === 'properties' && selectedComponent && (
          <div className="h-full overflow-y-auto">
            <PropertiesPanel
              key={selectedComponent.id}
              component={selectedComponent}
              pins={selectedComponentPins}
              connections={selectedComponentConnections}
              onUpdate={onUpdateComponent}
              onDelete={onDeleteComponent}
              onRemoveConnection={onRemoveConnection}
            />
          </div>
        )}
        {mainTab === 'properties' && !selectedComponent && (
          <div className="p-4 text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 h-full">
            Select a component on the canvas to see its properties.
          </div>
        )}
      </div>

      <div className="h-48 flex flex-col border-t border-gray-200 dark:border-gray-700">
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
          <div className="flex space-x-4">
            <button
              onClick={() => setBottomTab('output')}
              className={`px-3 py-1 text-sm font-semibold rounded-md ${bottomTab === 'output' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              Compiler Output
            </button>
            <button
              onClick={() => setBottomTab('serial')}
              disabled={!running}
              className={`px-3 py-1 text-sm font-semibold rounded-md ${bottomTab === 'serial' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Serial Monitor
            </button>
          </div>
          {bottomTab === 'serial' && running && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-md">
                <button
                  onClick={() => setSerialView('text')}
                  title="Serial Monitor"
                  className={`p-1.5 rounded-md ${serialView === 'text' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  <TerminalIcon />
                </button>
                <button
                  onClick={() => setSerialView('plotter')}
                  title="Serial Plotter"
                  className={`p-1.5 rounded-md ${serialView === 'plotter' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  <ChartLineIcon />
                </button>
              </div>
              <button
                onClick={onClearSerialOutput}
                title="Clear output"
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {bottomTab === 'output' && (
            <pre className="p-4 bg-gray-100 dark:bg-gray-800 text-xs whitespace-pre-wrap h-full overflow-y-auto">
              {compilerOutput || 'Output will appear here...'}
            </pre>
          )}
          {bottomTab === 'serial' && renderSerialContent()}
        </div>
      </div>
    </div>
  );
};
