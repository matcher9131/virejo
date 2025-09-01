import * as vscode from 'vscode';
import { generateTestFileCommand } from './commands/generateTestFile';

export function activate(context: vscode.ExtensionContext) {
    console.log('Virejo extension is now active!');

    const disposable = vscode.commands.registerCommand('virejo.generateTestFile', generateTestFileCommand);

    context.subscriptions.push(disposable);
}

export function deactivate() {
    console.log('Virejo extension is now deactive!');
}