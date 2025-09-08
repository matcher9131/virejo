import * as assert from 'assert';
import { generateTestContent } from './testGenerator';
import { AnalysisResult } from '../parser/tsParser';

suite('testGenerator', () => {
  suite('generateTestContent', () => {
    test('should be defined', () => {
      assert.ok(typeof generateTestContent === 'function');
    });

    test('should generate basic test content for functions', () => {
      const analysis: AnalysisResult = {
        functions: [{
          name: 'add',
          isAsync: false,
          parameters: [
            { name: 'a', type: 'number', isOptional: false },
            { name: 'b', type: 'number', isOptional: false }
          ],
          returnType: 'number',
          isExported: true
        }],
        classes: [],
        components: [],
        imports: [],
        isReactFile: false
      };

      const result = generateTestContent(analysis, '/test/math.ts', 'export function add(a: number, b: number): number { return a + b; }');

      assert.ok(result.includes("import { describe, it, expect } from 'vitest';"));
      assert.ok(result.includes("import { add } from './math';"));
      assert.ok(result.includes("describe('math', () => {"));
      assert.ok(result.includes("describe('add', () => {"));
      assert.ok(result.includes("expect(add).toBeDefined();"));
    });

    test('should generate test content for React components', () => {
      const analysis: AnalysisResult = {
        functions: [],
        classes: [],
        components: [{
          name: 'Button',
          isExported: true,
          isDefaultExport: false,
          props: '{ label: string }'
        }],
        imports: [],
        isReactFile: true
      };

      const result = generateTestContent(analysis, '/components/Button.tsx', 'import React from "react"; export const Button = ({ label }) => <button>{label}</button>;');

      assert.ok(result.includes("import { describe, it, expect } from 'vitest';"));
      assert.ok(result.includes("import { render, screen } from '@testing-library/react';"));
      assert.ok(result.includes("import { Button } from './Button';"));
      assert.ok(result.includes("describe('Button', () => {"));
      assert.ok(result.includes("should render without crashing"));
      assert.ok(result.includes("should render with props"));
      assert.ok(result.includes("should match snapshot"));
    });

    test('should generate test content for classes', () => {
      const analysis: AnalysisResult = {
        functions: [],
        classes: [{
          name: 'Calculator',
          isExported: true,
          methods: [{
            name: 'add',
            isAsync: false,
            parameters: [
              { name: 'a', type: 'number', isOptional: false },
              { name: 'b', type: 'number', isOptional: false }
            ],
            returnType: 'number',
            isExported: false
          }],
          properties: [{
            name: 'result',
            type: 'number',
            isOptional: false
          }]
        }],
        components: [],
        imports: [],
        isReactFile: false
      };

      const result = generateTestContent(analysis, '/utils/Calculator.ts', 'export class Calculator { add(a: number, b: number): number { return a + b; } }');

      assert.ok(result.includes("import { describe, it, expect } from 'vitest';"));
      assert.ok(result.includes("import { Calculator } from './Calculator';"));
      assert.ok(result.includes("describe('Calculator', () => {"));
      assert.ok(result.includes("let instance: Calculator;"));
      assert.ok(result.includes("instance = new Calculator();"));
      assert.ok(result.includes("expect(instance).toBeInstanceOf(Calculator);"));
      assert.ok(result.includes("describe('add', () => {"));
    });

    test('should handle async functions', () => {
      const analysis: AnalysisResult = {
        functions: [{
          name: 'fetchData',
          isAsync: true,
          parameters: [],
          returnType: 'Promise<string>',
          isExported: true
        }],
        classes: [],
        components: [],
        imports: [],
        isReactFile: false
      };

      const result = generateTestContent(analysis, '/api/client.ts', 'export async function fetchData(): Promise<string> { return "data"; }');

      assert.ok(result.includes("it('should execute without parameters', async () => {"));
      assert.ok(result.includes("const result = await fetchData();"));
    });

    test('should handle default export React components', () => {
      const analysis: AnalysisResult = {
        functions: [],
        classes: [],
        components: [{
          name: 'App',
          isExported: true,
          isDefaultExport: true,
          props: undefined
        }],
        imports: [],
        isReactFile: true
      };

      const result = generateTestContent(analysis, '/App.tsx', 'import React from "react"; const App = () => <div>App</div>; export default App;');

      assert.ok(result.includes("import App from './App';"));
      assert.ok(result.includes("render(<App />);"));
    });

    test('should handle mixed exports', () => {
      const analysis: AnalysisResult = {
        functions: [{
          name: 'helper',
          isAsync: false,
          parameters: [],
          isExported: true
        }],
        classes: [{
          name: 'Service',
          isExported: true,
          methods: [],
          properties: []
        }],
        components: [{
          name: 'Widget',
          isExported: true,
          isDefaultExport: false
        }],
        imports: [],
        isReactFile: true
      };

      const result = generateTestContent(analysis, '/mixed.tsx', 'import React from "react"; export function helper() {} export class Service {} export const Widget = () => <div></div>;');

      assert.ok(result.includes("import { helper, Service, Widget } from './mixed';"));
      assert.ok(result.includes("describe('mixed', () => {"));
      assert.ok(result.includes("describe('Service', () => {"));
      assert.ok(result.includes("describe('Widget', () => {"));
    });
  });
});