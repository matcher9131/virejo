import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import * as fs from 'fs';
// import * as path from 'path';
import { generateTestFileCommand } from './generateTestFile';
import { parseTypeScriptFile } from '../parser/tsParser';
import { generateTestContent } from '../generator/testGenerator';
import { getTestFilePath } from '../utils/fileUtils';

vi.mock('fs');
vi.mock('../parser/tsParser');
vi.mock('../generator/testGenerator');
vi.mock('../utils/fileUtils');

describe('generateTestFileCommand', () => {
  const mockFs = vi.mocked(fs);
  const mockParseTypeScriptFile = vi.mocked(parseTypeScriptFile);
  const mockGenerateTestContent = vi.mocked(generateTestContent);
  const mockGetTestFilePath = vi.mocked(getTestFilePath);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(generateTestFileCommand).toBeDefined();
  });

  it('should show error when no file is selected', async () => {
    const showErrorMessageSpy = vi.spyOn(vscode.window, 'showErrorMessage');

    await generateTestFileCommand();

    expect(showErrorMessageSpy).toHaveBeenCalledWith('No file selected or active');
  });

  it('should show error for non-TypeScript files', async () => {
    const mockUri = { fsPath: '/test/file.js' } as vscode.Uri;
    const showErrorMessageSpy = vi.spyOn(vscode.window, 'showErrorMessage');

    await generateTestFileCommand(mockUri);

    expect(showErrorMessageSpy).toHaveBeenCalledWith('This command only works with .ts and .tsx files');
  });

  it('should generate test file for TypeScript file', async () => {
    const mockUri = { fsPath: '/test/file.ts' } as vscode.Uri;
    const testFilePath = '/test/file.test.ts';
    const sourceContent = 'export function test() {}';
    const analysisResult = { functions: [], classes: [], components: [], imports: [], isReactFile: false };
    const testContent = 'test content';

    mockGetTestFilePath.mockReturnValue(testFilePath);
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue(sourceContent);
    mockParseTypeScriptFile.mockReturnValue(analysisResult);
    mockGenerateTestContent.mockReturnValue(testContent);
    
    const openTextDocumentSpy = vi.spyOn(vscode.workspace, 'openTextDocument').mockResolvedValue({} as vscode.TextDocument);
    const showTextDocumentSpy = vi.spyOn(vscode.window, 'showTextDocument').mockResolvedValue({} as vscode.TextEditor);
    const showInformationMessageSpy = vi.spyOn(vscode.window, 'showInformationMessage');

    await generateTestFileCommand(mockUri);

    expect(mockGetTestFilePath).toHaveBeenCalledWith('/test/file.ts');
    expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/file.ts', 'utf8');
    expect(mockParseTypeScriptFile).toHaveBeenCalledWith(sourceContent, '/test/file.ts');
    expect(mockGenerateTestContent).toHaveBeenCalledWith(analysisResult, '/test/file.ts');
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(testFilePath, testContent, 'utf8');
    expect(openTextDocumentSpy).toHaveBeenCalledWith(testFilePath);
    expect(showTextDocumentSpy).toHaveBeenCalled();
    expect(showInformationMessageSpy).toHaveBeenCalledWith('Test file generated: file.test.ts');
  });

  it('should prompt for overwrite when test file exists', async () => {
    const mockUri = { fsPath: '/test/file.ts' } as vscode.Uri;
    const testFilePath = '/test/file.test.ts';

    mockGetTestFilePath.mockReturnValue(testFilePath);
    mockFs.existsSync.mockReturnValue(true);
    
    const showQuickPickSpy = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue({ label: "No" });

    await generateTestFileCommand(mockUri);

    expect(showQuickPickSpy).toHaveBeenCalledWith(['Yes', 'No'], {
      placeHolder: 'Test file already exists. Overwrite?'
    });
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const mockUri = { fsPath: '/test/file.ts' } as vscode.Uri;
    const error = new Error('Test error');

    mockGetTestFilePath.mockImplementation(() => {
      throw error;
    });

    const showErrorMessageSpy = vi.spyOn(vscode.window, 'showErrorMessage');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await generateTestFileCommand(mockUri);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating test file:', error);
    expect(showErrorMessageSpy).toHaveBeenCalledWith('Failed to generate test file: Test error');
  });
});