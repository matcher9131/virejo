import * as assert from 'assert';
import { beforeEach, afterEach } from "mocha";
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { generateTestFileCommand } from './generateTestFile';

suite('generateTestFileCommand', () => {
  let sandbox: sinon.SinonSandbox;
  let vscodeStubs: {
    showErrorMessage: sinon.SinonStub;
    showInformationMessage: sinon.SinonStub;
    showQuickPick: sinon.SinonStub;
    openTextDocument: sinon.SinonStub;
    showTextDocument: sinon.SinonStub;
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Create stubs for VS Code APIs
    vscodeStubs = {
      showErrorMessage: sandbox.stub(vscode.window, 'showErrorMessage'), 
      showInformationMessage: sandbox.stub(vscode.window, 'showInformationMessage'), 
      showQuickPick: sandbox.stub(vscode.window, 'showQuickPick'), 
      openTextDocument: sandbox.stub(vscode.workspace, 'openTextDocument'), 
      showTextDocument: sandbox.stub(vscode.window, 'showTextDocument') 
    };
  });

  afterEach(() => {
    // Restore all stubs using sandbox
    sandbox.restore();
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
});