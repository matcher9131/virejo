import * as assert from 'assert';
import { beforeEach, afterEach } from "mocha";
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { generateTestFileCommand } from './generateTestFile';
import * as parseModule from '../parser/tsParser';
import * as generateModule from '../generator/testGenerator';
import * as utilsModule from '../utils/fileUtils';

suite('generateTestFileCommand', () => {
  let fsStubs: {
    existsSync: sinon.SinonStub; 
    readFileSync: sinon.SinonStub;
    writeFileSync: sinon.SinonStub;
  };
  let parseTypeScriptFileStub: sinon.SinonStub;
  let generateTestContentStub: sinon.SinonStub;
  let getTestFilePathStub: sinon.SinonStub;
  let vscodeStubs: {
    showErrorMessage: sinon.SinonStub;
    showInformationMessage: sinon.SinonStub;
    showQuickPick: sinon.SinonStub;
    openTextDocument: sinon.SinonStub;
    showTextDocument: sinon.SinonStub;
  };

  beforeEach(() => {
    // Create stubs for file system operations
    fsStubs = {
      existsSync: sinon.stub(fs, 'existsSync'), 
      readFileSync: sinon.stub(fs, 'readFileSync'), 
      writeFileSync: sinon.stub(fs, 'writeFileSync') 
    };
    
    // Create stubs for module dependencies
    parseTypeScriptFileStub = sinon.stub().returns({
      functions: [],
      classes: [],
      components: [],
      imports: [],
      isReactFile: false
    });
    
    generateTestContentStub = sinon.stub().returns('test content'); 
    getTestFilePathStub = sinon.stub().returns('/test/file.test.ts'); 

    // Create stubs for VS Code APIs
    vscodeStubs = {
      showErrorMessage: sinon.stub(vscode.window, 'showErrorMessage'), 
      showInformationMessage: sinon.stub(vscode.window, 'showInformationMessage'), 
      showQuickPick: sinon.stub(vscode.window, 'showQuickPick'), 
      openTextDocument: sinon.stub(vscode.workspace, 'openTextDocument'), 
      showTextDocument: sinon.stub(vscode.window, 'showTextDocument') 
    };

    // Replace the actual module functions with stubs
    sinon.stub(parseModule, 'parseTypeScriptFile').callsFake(parseTypeScriptFileStub); 
    sinon.stub(generateModule, 'generateTestContent').callsFake(generateTestContentStub); 
    sinon.stub(utilsModule, 'getTestFilePath').callsFake(getTestFilePathStub); 
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  test('should be defined', () => {
    assert.ok(typeof generateTestFileCommand === 'function');
  });

  test('should show error when no file is selected', async () => {
    await generateTestFileCommand();

    assert.ok(vscodeStubs.showErrorMessage.calledWith('No file selected or active'));
  });

  test('should show error for non-TypeScript files', async () => {
    const mockUri = vscode.Uri.file('/test/file.js');

    await generateTestFileCommand(mockUri);

    assert.ok(vscodeStubs.showErrorMessage.calledWith('This command only works with .ts and .tsx files'));
  });

  test('should generate test file for TypeScript file', async () => {
    const mockUri = vscode.Uri.file('/test/file.ts');
    const sourceContent = 'export function test() {}';
    const testContent = 'test content';

    // Setup stubs
    getTestFilePathStub.returns('/test/file.test.ts');
    fsStubs.existsSync.returns(false);
    fsStubs.readFileSync.returns(sourceContent);
    generateTestContentStub.returns(testContent);
    vscodeStubs.openTextDocument.resolves({} as vscode.TextDocument);
    vscodeStubs.showTextDocument.resolves({} as vscode.TextEditor);

    await generateTestFileCommand(mockUri);

    assert.ok(fsStubs.readFileSync.calledWith('/test/file.ts', 'utf8'));
    assert.ok(fsStubs.writeFileSync.calledWith('/test/file.test.ts', testContent, 'utf8'));
    assert.ok(vscodeStubs.showInformationMessage.calledWith('Test file generated: file.test.ts'));
  });

  test('should prompt for overwrite when test file exists', async () => {
    const mockUri = vscode.Uri.file('/test/file.ts');

    getTestFilePathStub.returns('/test/file.test.ts');
    fsStubs.existsSync.returns(true);
    vscodeStubs.showQuickPick.resolves({ label: "No" });

    await generateTestFileCommand(mockUri);

    assert.ok(vscodeStubs.showQuickPick.calledWith(['Yes', 'No'], {
      placeHolder: 'Test file already exists. Overwrite?'
    }));
    assert.ok(fsStubs.writeFileSync.notCalled);
  });

  test('should overwrite when user confirms', async () => {
    const mockUri = vscode.Uri.file('/test/file.ts');
    const sourceContent = 'export function test() {}';
    const testContent = 'test content';

    getTestFilePathStub.returns('/test/file.test.ts');
    fsStubs.existsSync.returns(true);
    fsStubs.readFileSync.returns(sourceContent);
    generateTestContentStub.returns(testContent);
    vscodeStubs.showQuickPick.resolves({ label: 'Yes' });
    vscodeStubs.openTextDocument.resolves({} as vscode.TextDocument);
    vscodeStubs.showTextDocument.resolves({} as vscode.TextEditor);

    await generateTestFileCommand(mockUri);

    assert.ok(vscodeStubs.showQuickPick.calledWith(['Yes', 'No'], {
      placeHolder: 'Test file already exists. Overwrite?'
    }));
    assert.ok(fsStubs.writeFileSync.calledWith('/test/file.test.ts', testContent, 'utf8'));
    assert.ok(vscodeStubs.showInformationMessage.calledWith('Test file generated: file.test.ts'));
  });

  test('should handle errors gracefully', async () => {
    const mockUri = vscode.Uri.file('/test/file.ts');
    const error = new Error('Test error');
    const consoleErrorSpy = sinon.spy(console, 'error');

    getTestFilePathStub.throws(error);

    await generateTestFileCommand(mockUri);

    assert.ok(consoleErrorSpy.calledWith('Error generating test file:', error));
    assert.ok(vscodeStubs.showErrorMessage.calledWith('Failed to generate test file: Test error'));

    consoleErrorSpy.restore();
  });
});