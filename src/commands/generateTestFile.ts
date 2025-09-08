import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseTypeScriptFile } from '../parser/tsParser';
import { generateTestContent } from '../generator/testGenerator';
import { getTestFilePath } from '../utils/fileUtils';

export async function generateTestFileCommand(uri?: vscode.Uri) {
    try {
        // Get the selected file URI
        const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
        
        if (!fileUri) {
            vscode.window.showErrorMessage('No file selected or active');
            return;
        }

        const filePath = fileUri.fsPath;
        const ext = path.extname(filePath);

        // Check if the file is a TypeScript or TSX file
        if (!['.ts', '.tsx'].includes(ext)) {
            vscode.window.showErrorMessage('This command only works with .ts and .tsx files');
            return;
        }

        // Generate test file path
        const testFilePath = getTestFilePath(filePath);

        // Check if test file already exists
        if (fs.existsSync(testFilePath)) {
            const overwrite = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: 'Test file already exists. Overwrite?'
            });
            
            if (overwrite !== 'Yes') {
                return;
            }
        }

        // Parse the source file
        const sourceContent = fs.readFileSync(filePath, 'utf8');
        const analysisResult = parseTypeScriptFile(sourceContent, filePath);

        // Generate test content
        const testContent = generateTestContent(analysisResult, filePath, sourceContent);

        // Write test file
        fs.writeFileSync(testFilePath, testContent, 'utf8');

        // Open the generated test file
        const testDoc = await vscode.workspace.openTextDocument(testFilePath);
        await vscode.window.showTextDocument(testDoc);

        vscode.window.showInformationMessage(`Test file generated: ${path.basename(testFilePath)}`);

    } catch (error) {
        console.error('Error generating test file:', error);
        vscode.window.showErrorMessage(`Failed to generate test file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}