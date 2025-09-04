import * as assert from 'assert';
import { getTestFilePath, isTypeScriptFile, isReactFile } from './fileUtils';

suite('fileUtils', () => {
  suite('getTestFilePath', () => {
    test('should be defined', () => {
      assert.ok(typeof getTestFilePath === 'function');
    });

    test('should generate test file path for .ts file', () => {
      const result = getTestFilePath('/src/utils.ts');
      assert.strictEqual(result, '/src/utils.test.ts');
    });

    test('should generate test file path for .tsx file', () => {
      const result = getTestFilePath('/src/Component.tsx');
      assert.strictEqual(result, '/src/Component.test.tsx');
    });

    test('should handle nested directory paths', () => {
      const result = getTestFilePath('/src/components/Button.tsx');
      assert.strictEqual(result, '/src/components/Button.test.tsx');
    });

    test('should handle files without directory', () => {
      const result = getTestFilePath('index.ts');
      assert.strictEqual(result, 'index.test.ts');
    });
  });

  suite('isTypeScriptFile', () => {
    test('should be defined', () => {
      assert.ok(typeof isTypeScriptFile === 'function');
    });

    test('should return true for .ts files', () => {
      assert.strictEqual(isTypeScriptFile('/path/file.ts'), true);
    });

    test('should return true for .tsx files', () => {
      assert.strictEqual(isTypeScriptFile('/path/Component.tsx'), true);
    });

    test('should return false for .js files', () => {
      assert.strictEqual(isTypeScriptFile('/path/file.js'), false);
    });

    test('should return false for other file types', () => {
      assert.strictEqual(isTypeScriptFile('/path/file.json'), false);
      assert.strictEqual(isTypeScriptFile('/path/file.md'), false);
    });
  });

  suite('isReactFile', () => {
    test('should be defined', () => {
      assert.ok(typeof isReactFile === 'function');
    });

    test('should return true for .tsx files', () => {
      assert.strictEqual(isReactFile('/path/Component.tsx'), true);
    });

    test('should return false for .ts files', () => {
      assert.strictEqual(isReactFile('/path/utils.ts'), false);
    });

    test('should return false for other file types', () => {
      assert.strictEqual(isReactFile('/path/file.js'), false);
      assert.strictEqual(isReactFile('/path/file.json'), false);
    });
  });
});