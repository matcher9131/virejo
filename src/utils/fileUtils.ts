import * as path from 'path';

export const getTestFilePath = (sourceFilePath: string): string => {
    const dir = path.dirname(sourceFilePath);
    const baseName = path.basename(sourceFilePath, path.extname(sourceFilePath));
    const ext = path.extname(sourceFilePath);
    
    return path.join(dir, `${baseName}.test${ext}`);
};

export const isTypeScriptFile = (filePath: string): boolean => {
    const ext = path.extname(filePath);
    return ['.ts', '.tsx'].includes(ext);
};

export const isReactFile = (filePath: string): boolean => {
    return path.extname(filePath) === '.tsx';
};