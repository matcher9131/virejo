import { it, suite } from 'node:test';
import { strict as assert } from 'node:assert';
import { getTestFilePath, isTypeScriptFile, isReactFile } from './fileUtils';

suite('fileUtils', () => {
  suite('getTestFilePath', () => {
    it('should be defined', () => {
      assert.ok(typeof getTestFilePath === 'function');
    });

    it('should generate test file path for .ts file', () => {
      const result = getTestFilePath('/src/utils.ts');
      assert.strictEqual(result, '/src/utils.test.ts');
    });

    it('should generate test file path for .tsx file', () => {
      const result = getTestFilePath('/src/Component.tsx');
      assert.strictEqual(result, '/src/Component.test.tsx');
    });

    it('should handle nested directory paths', () => {
      const result = getTestFilePath('/src/components/Button.tsx');
      assert.strictEqual(result, '/src/components/Button.test.tsx');
    });

    it('should handle files without directory', () => {
      const result = getTestFilePath('index.ts');
      assert.strictEqual(result, 'index.test.ts');
    });
  });

  suite('isTypeScriptFile', () => {
    it('should be defined', () => {
      assert.ok(typeof isTypeScriptFile === 'function');
    });

    it('should return true for .ts files', () => {
      assert.strictEqual(isTypeScriptFile('/path/file.ts'), true);
    });

    it('should return true for .tsx files', () => {
      assert.strictEqual(isTypeScriptFile('/path/Component.tsx'), true);
    });

    it('should return false for .js files', () => {
      assert.strictEqual(isTypeScriptFile('/path/file.js'), false);
    });

    it('should return false for other file types', () => {
      assert.strictEqual(isTypeScriptFile('/path/file.json'), false);
      assert.strictEqual(isTypeScriptFile('/path/file.md'), false);
    });
  });

  suite('isReactFile', () => {
    it('should be defined', () => {
      assert.ok(typeof isReactFile === 'function');
    });

    it('should return true for .tsx files', () => {
      assert.strictEqual(isReactFile('/path/Component.tsx'), true);
    });

    it('should return false for .ts files', () => {
      assert.strictEqual(isReactFile('/path/utils.ts'), false);
    });

    it('should return false for other file types', () => {
      assert.strictEqual(isReactFile('/path/file.js'), false);
      assert.strictEqual(isReactFile('/path/file.json'), false);
    });
  });
});