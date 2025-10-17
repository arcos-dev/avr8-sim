
import React from 'react';
import type { BoardType } from '../types';
import { BOARDS } from '../constants';
import { ThemeToggle } from './ThemeToggle';
import { StopIcon } from './icons/StopIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface HeaderProps {
  board: BoardType;
  setBoard: (board: BoardType) => void;
  projectName: string;
  onRenameProject: () => void;
  onCreateProject: () => void;
  onAddFile: () => void;
  onStop: () => void;
  onOpenSettings: () => void;
  running: boolean;
  compiling: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  board,
  setBoard,
  projectName,
  onRenameProject,
  onCreateProject,
  onAddFile,
  onStop,
  onOpenSettings,
  running,
  compiling,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 md:px-6 md:py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <h1 className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
          AVR8js Simulator
        </h1>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900 rounded-md px-2 py-1">
          <span className="text-xs uppercase tracking-wide text-blue-500 dark:text-blue-300">Projeto</span>
          <button
            type="button"
            onClick={onRenameProject}
            className="text-sm font-semibold text-blue-700 dark:text-blue-200 hover:underline max-w-[180px] truncate"
            title="Renomear projeto"
          >
            {projectName}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateProject}
            className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Novo Projeto
          </button>
          <button
            onClick={onAddFile}
            className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Novo Arquivo
          </button>
        </div>
        <div className="relative">
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value as BoardType)}
            disabled={running || compiling}
            className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {BOARDS.map((b) => (
              <option key={b} value={b}>
                Arduino {b.charAt(0).toUpperCase() + b.slice(1)}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2 md:space-x-3">
        {running && (
          <button
            onClick={onStop}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
          >
            <StopIcon />
            <span className="hidden md:inline">Stop</span>
          </button>
        )}
        <ThemeToggle />
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-blue-500"
          aria-label="Open settings"
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
};
