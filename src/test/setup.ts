import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock VS Code API
const mockVscode = {
  Uri: {
    file: (path: string) => ({ fsPath: path, scheme: 'file' }),
    parse: (uri: string) => ({ fsPath: uri.replace('file://', ''), scheme: 'file' })
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn(),
      inspect: vi.fn()
    })),
    workspaceFolders: [],
    onDidChangeConfiguration: vi.fn(),
    openTextDocument: vi.fn(),
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      stat: vi.fn(),
      readDirectory: vi.fn()
    }
  },
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn(),
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn()
    }))
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
  },
  languages: {
    createDiagnosticCollection: vi.fn(() => ({
      set: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    }))
  }
};

// Mock the vscode module
vi.mock('vscode', () => mockVscode);

// Mock path module for consistent behavior
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    sep: '/'
  };
});

// Global test utilities
global.mockVscode = mockVscode;