import { describe, it, expect } from 'vitest';
import { generateTestContent } from './testGenerator';
import { AnalysisResult } from '../parser/tsParser';

describe('testGenerator', () => {
  describe('generateTestContent', () => {
    it('should be defined', () => {
      expect(generateTestContent).toBeDefined();
    });

    it('should generate basic test content for functions', () => {
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

      const result = generateTestContent(analysis, '/test/math.ts');

      expect(result).toContain("import { describe, it, expect } from 'vitest';");
      expect(result).toContain("import { add } from './math';");
      expect(result).toContain("describe('math', () => {");
      expect(result).toContain("describe('add', () => {");
      expect(result).toContain("expect(add).toBeDefined();");
    });

    it('should generate test content for React components', () => {
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

      const result = generateTestContent(analysis, '/components/Button.tsx');

      expect(result).toContain("import { describe, it, expect } from 'vitest';");
      expect(result).toContain("import { render, screen } from '@testing-library/react';");
      expect(result).toContain("import { Button } from './Button';");
      expect(result).toContain("describe('Button', () => {");
      expect(result).toContain("should render without crashing");
      expect(result).toContain("should render with props");
      expect(result).toContain("should match snapshot");
    });

    it('should generate test content for classes', () => {
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

      const result = generateTestContent(analysis, '/utils/Calculator.ts');

      expect(result).toContain("import { describe, it, expect } from 'vitest';");
      expect(result).toContain("import { Calculator } from './Calculator';");
      expect(result).toContain("describe('Calculator', () => {");
      expect(result).toContain("let instance: Calculator;");
      expect(result).toContain("instance = new Calculator();");
      expect(result).toContain("expect(instance).toBeInstanceOf(Calculator);");
      expect(result).toContain("describe('add', () => {");
    });

    it('should handle async functions', () => {
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

      const result = generateTestContent(analysis, '/api/client.ts');

      expect(result).toContain("it('should execute without parameters', async () => {");
      expect(result).toContain("const result = await fetchData();");
    });

    it('should handle default export React components', () => {
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

      const result = generateTestContent(analysis, '/App.tsx');

      expect(result).toContain("import App from './App';");
      expect(result).toContain("render(<App />);");
    });

    it('should handle mixed exports', () => {
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

      const result = generateTestContent(analysis, '/mixed.tsx');

      expect(result).toContain("import Widget, { helper, Service } from './mixed';");
      expect(result).toContain("describe('mixed', () => {");
      expect(result).toContain("describe('Service', () => {");
      expect(result).toContain("describe('Widget', () => {");
    });
  });
});