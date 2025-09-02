import { describe, it, expect } from 'vitest';
import { getTestFilePath, isTypeScriptFile, isReactFile } from './fileUtils';

describe('fileUtils', () => {
  describe('getTestFilePath', () => {
    it('should be defined', () => {
      expect(getTestFilePath).toBeDefined();
    });

    it('should generate test file path for .ts file', () => {
      const result = getTestFilePath('/src/utils.ts');
      expect(result).toBe('/src/utils.test.ts');
    });

    it('should generate test file path for .tsx file', () => {
      const result = getTestFilePath('/src/Component.tsx');
      expect(result).toBe('/src/Component.test.tsx');
    });

    it('should handle nested directory paths', () => {
      const result = getTestFilePath('/src/components/Button.tsx');
      expect(result).toBe('/src/components/Button.test.tsx');
    });

    it('should handle files without directory', () => {
      const result = getTestFilePath('index.ts');
      expect(result).toBe('index.test.ts');
    });
  });

  describe('isTypeScriptFile', () => {
    it('should be defined', () => {
      expect(isTypeScriptFile).toBeDefined();
    });

    it('should return true for .ts files', () => {
      expect(isTypeScriptFile('/path/file.ts')).toBe(true);
    });

    it('should return true for .tsx files', () => {
      expect(isTypeScriptFile('/path/Component.tsx')).toBe(true);
    });

    it('should return false for .js files', () => {
      expect(isTypeScriptFile('/path/file.js')).toBe(false);
    });

    it('should return false for other file types', () => {
      expect(isTypeScriptFile('/path/file.json')).toBe(false);
      expect(isTypeScriptFile('/path/file.md')).toBe(false);
    });
  });

  describe('isReactFile', () => {
    it('should be defined', () => {
      expect(isReactFile).toBeDefined();
    });

    it('should return true for .tsx files', () => {
      expect(isReactFile('/path/Component.tsx')).toBe(true);
    });

    it('should return false for .ts files', () => {
      expect(isReactFile('/path/utils.ts')).toBe(false);
    });

    it('should return false for other file types', () => {
      expect(isReactFile('/path/file.js')).toBe(false);
      expect(isReactFile('/path/file.json')).toBe(false);
    });
  });
});