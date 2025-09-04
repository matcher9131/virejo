import * as assert from 'assert';
import * as path from 'path';
import { getTestFilePath, isTypeScriptFile, isReactFile } from './fileUtils';

suite('fileUtils', () => {
  suite('getTestFilePath', () => {
    test('should be defined', () => {
      assert.ok(typeof getTestFilePath === 'function');
    });

    test('should generate test file path for .ts file', () => {
      const result = getTestFilePath(path.join(path.sep, 'src', 'utils.ts'));
      assert.strictEqual(result, path.join(path.sep, 'src', 'utils.test.ts'));
    });

    test('should generate test file path for .tsx file', () => {
      const result = getTestFilePath(path.join(path.sep, 'src', 'Component.tsx'));
      assert.strictEqual(result, path.join(path.sep, 'src', 'Component.test.tsx'));
    });

    test('should handle nested directory paths', () => {
      const result = getTestFilePath(path.join(path.sep, 'src', 'components', 'Button.tsx'));
      assert.strictEqual(result, path.join(path.sep, 'src', 'components', 'Button.test.tsx'));
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
      assert.strictEqual(isTypeScriptFile(path.join(path.sep, 'path', 'file.ts')), true);
    });

    test('should return true for .tsx files', () => {
      assert.strictEqual(isTypeScriptFile(path.join(path.sep, 'path', 'Component.tsx')), true);
    });

    test('should return false for .js files', () => {
      assert.strictEqual(isTypeScriptFile(path.join(path.sep, 'path', 'file.js')), false);
    });

    test('should return false for other file types', () => {
      assert.strictEqual(isTypeScriptFile(path.join(path.sep, 'path', 'file.json')), false);
      assert.strictEqual(isTypeScriptFile(path.join(path.sep, 'path', 'file.md')), false);
    });
  });

  suite('isReactFile', () => {
    test('should be defined', () => {
      assert.ok(typeof isReactFile === 'function');
    });

    test('should return true for .tsx files', () => {
      assert.strictEqual(isReactFile(path.join(path.sep, 'path', 'Component.tsx')), true);
    });

    test('should return false for .ts files', () => {
      assert.strictEqual(isReactFile(path.join(path.sep, 'path', 'utils.ts')), false);
    });

    test('should return false for other file types', () => {
      assert.strictEqual(isReactFile(path.join(path.sep, 'path', 'file.js')), false);
      assert.strictEqual(isReactFile(path.join(path.sep, 'path', 'file.json')), false);
    });
  });
});