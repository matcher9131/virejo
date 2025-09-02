import { describe, it, expect } from 'vitest';
import { parseTypeScriptFile } from './tsParser';

describe('tsParser', () => {
  describe('parseTypeScriptFile', () => {
    it('should be defined', () => {
      expect(parseTypeScriptFile).toBeDefined();
    });

    it('should parse function declarations', () => {
      const content = `
        export function add(a: number, b: number): number {
          return a + b;
        }
        
        function helper(): void {
          // helper function
        }
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      expect(result.functions).toHaveLength(2);
      expect(result.functions[0]).toEqual({
        name: 'add',
        isAsync: false,
        parameters: [
          { name: 'a', type: 'number', isOptional: false },
          { name: 'b', type: 'number', isOptional: false }
        ],
        returnType: 'number',
        isExported: true
      });
      expect(result.functions[1].name).toBe('helper');
      expect(result.functions[1].isExported).toBe(false);
    });

    it('should parse arrow functions', () => {
      const content = `
        export const multiply = (a: number, b: number): number => a * b;
        const divide = async (a: number, b: number): Promise<number> => a / b;
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      expect(result.functions).toHaveLength(2);
      expect(result.functions[0]).toEqual({
        name: 'multiply',
        isAsync: false,
        parameters: [
          { name: 'a', type: 'number', isOptional: false },
          { name: 'b', type: 'number', isOptional: false }
        ],
        returnType: 'number',
        isExported: true
      });
      expect(result.functions[1].name).toBe('divide');
      expect(result.functions[1].isAsync).toBe(true);
    });

    it('should parse class declarations', () => {
      const content = `
        export class Calculator {
          private result: number = 0;
          
          public add(value: number): number {
            this.result += value;
            return this.result;
          }
          
          async fetchResult(): Promise<number> {
            return this.result;
          }
        }
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]).toEqual({
        name: 'Calculator',
        isExported: true,
        methods: [
          {
            name: 'add',
            isAsync: false,
            parameters: [{ name: 'value', type: 'number', isOptional: false }],
            returnType: 'number',
            isExported: false
          },
          {
            name: 'fetchResult',
            isAsync: true,
            parameters: [],
            returnType: 'Promise<number>',
            isExported: false
          }
        ],
        properties: [
          {
            name: 'result',
            type: 'number',
            isOptional: false
          }
        ]
      });
    });

    it('should parse React components', () => {
      const content = `
        import React from 'react';
        
        interface Props {
          title: string;
          onClick?: () => void;
        }
        
        export function Button({ title, onClick }: Props): JSX.Element {
          return <button onClick={onClick}>{title}</button>;
        }
        
        export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => {
          return <div className="card">{children}</div>;
        };
      `;

      const result = parseTypeScriptFile(content, 'Button.tsx');

      expect(result.isReactFile).toBe(true);
      expect(result.components).toHaveLength(2);
      expect(result.components[0]).toEqual({
        name: 'Button',
        isExported: true,
        props: 'Props',
        isDefaultExport: false
      });
      expect(result.components[1]).toEqual({
        name: 'Card',
        isExported: true,
        props: '{ children: React.ReactNode }',
        isDefaultExport: false
      });
    });

    it('should parse import declarations', () => {
      const content = `
        import React, { useState } from 'react';
        import * as fs from 'fs';
        import { join } from 'path';
        import utils from './utils';
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      expect(result.imports).toHaveLength(4);
      expect(result.imports[0]).toEqual({
        moduleName: 'react',
        namedImports: ['useState'],
        defaultImport: 'React'
      });
      expect(result.imports[1]).toEqual({
        moduleName: 'fs',
        namedImports: [],
        namespaceImport: 'fs'
      });
      expect(result.imports[2]).toEqual({
        moduleName: 'path',
        namedImports: ['join']
      });
      expect(result.imports[3]).toEqual({
        moduleName: './utils',
        namedImports: [],
        defaultImport: 'utils'
      });
    });

    it('should handle optional parameters', () => {
      const content = `
        export function greet(name: string, greeting?: string): string {
          return \`\${greeting || 'Hello'}, \${name}!\`;
        }
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      expect(result.functions[0].parameters).toEqual([
        { name: 'name', type: 'string', isOptional: false },
        { name: 'greeting', type: 'string', isOptional: true }
      ]);
    });

    it('should detect React files by extension', () => {
      const content = 'const value = 42;';
      
      const tsxResult = parseTypeScriptFile(content, 'test.tsx');
      const tsResult = parseTypeScriptFile(content, 'test.ts');

      expect(tsxResult.isReactFile).toBe(true);
      expect(tsResult.isReactFile).toBe(false);
    });

    it('should detect React files by import', () => {
      const content = `
        import React from 'react';
        export const value = 42;
      `;
      
      const result = parseTypeScriptFile(content, 'test.ts');

      expect(result.isReactFile).toBe(true);
    });

    it('should handle export assignments', () => {
      const content = `
        const App = () => <div>Hello</div>;
        export default App;
      `;

      const result = parseTypeScriptFile(content, 'App.tsx');

      expect(result.components).toHaveLength(1);
      expect(result.components[0]).toEqual({
        name: 'App',
        isExported: true,
        isDefaultExport: true,
        props: undefined
      });
    });

    it('should handle empty file', () => {
      const result = parseTypeScriptFile('', 'empty.ts');

      expect(result.functions).toHaveLength(0);
      expect(result.classes).toHaveLength(0);
      expect(result.components).toHaveLength(0);
      expect(result.imports).toHaveLength(0);
      expect(result.isReactFile).toBe(false);
    });
  });
});