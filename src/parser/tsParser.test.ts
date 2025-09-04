import * as assert from 'assert';
import { parseTypeScriptFile } from './tsParser';

suite('tsParser', () => {
  suite('parseTypeScriptFile', () => {
    test('should be defined', () => {
      assert.ok(typeof parseTypeScriptFile === 'function');
    });

    test('should parse function declarations', () => {
      const content = `
        export function add(a: number, b: number): number {
          return a + b;
        }
        
        function helper(): void {
          // helper function
        }
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      assert.strictEqual(result.functions.length, 2);
      assert.deepStrictEqual(result.functions[0], {
        name: 'add',
        isAsync: false,
        parameters: [
          { name: 'a', type: 'number', isOptional: false },
          { name: 'b', type: 'number', isOptional: false }
        ],
        returnType: 'number',
        isExported: true
      });
      assert.strictEqual(result.functions[1].name, 'helper');
      assert.strictEqual(result.functions[1].isExported, false);
    });

    test('should parse arrow functions', () => {
      const content = `
        export const multiply = (a: number, b: number): number => a * b;
        const divide = async (a: number, b: number): Promise<number> => a / b;
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      assert.strictEqual(result.functions.length, 2);
      assert.deepStrictEqual(result.functions[0], {
        name: 'multiply',
        isAsync: false,
        parameters: [
          { name: 'a', type: 'number', isOptional: false },
          { name: 'b', type: 'number', isOptional: false }
        ],
        returnType: 'number',
        isExported: true
      });
      assert.strictEqual(result.functions[1].name, 'divide');
      assert.strictEqual(result.functions[1].isAsync, true);
    });

    test('should parse class declarations', () => {
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

      assert.strictEqual(result.classes.length, 1);
      assert.deepStrictEqual(result.classes[0], {
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

    test('should parse React components', () => {
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

      assert.strictEqual(result.isReactFile, true);
      assert.strictEqual(result.components.length, 2);
      assert.deepStrictEqual(result.components[0], {
        name: 'Button',
        isExported: true,
        props: 'Props',
        isDefaultExport: false
      });
      assert.deepStrictEqual(result.components[1], {
        name: 'Card',
        isExported: true,
        props: '{ children: React.ReactNode }',
        isDefaultExport: false
      });
    });

    test('should parse import declarations', () => {
      const content = `
        import React, { useState } from 'react';
        import * as fs from 'fs';
        import { join } from 'path';
        import utils from './utils';
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      assert.strictEqual(result.imports.length, 4);
      assert.deepStrictEqual(result.imports[0], {
        moduleName: 'react',
        namedImports: ['useState'],
        defaultImport: 'React'
      });
      assert.deepStrictEqual(result.imports[1], {
        moduleName: 'fs',
        namedImports: [],
        namespaceImport: 'fs'
      });
      assert.deepStrictEqual(result.imports[2], {
        moduleName: 'path',
        namedImports: ['join']
      });
      assert.deepStrictEqual(result.imports[3], {
        moduleName: './utils',
        namedImports: [],
        defaultImport: 'utils'
      });
    });

    test('should handle optional parameters', () => {
      const content = `
        export function greet(name: string, greeting?: string): string {
          return \`\${greeting || 'Hello'}, \${name}!\`;
        }
      `;

      const result = parseTypeScriptFile(content, 'test.ts');

      assert.deepStrictEqual(result.functions[0].parameters, [
        { name: 'name', type: 'string', isOptional: false },
        { name: 'greeting', type: 'string', isOptional: true }
      ]);
    });

    test('should detect React files by extension', () => {
      const content = 'const value = 42;';
      
      const tsxResult = parseTypeScriptFile(content, 'test.tsx');
      const tsResult = parseTypeScriptFile(content, 'test.ts');

      assert.strictEqual(tsxResult.isReactFile, true);
      assert.strictEqual(tsResult.isReactFile, false);
    });

    test('should detect React files by import', () => {
      const content = `
        import React from 'react';
        export const value = 42;
      `;
      
      const result = parseTypeScriptFile(content, 'test.ts');

      assert.strictEqual(result.isReactFile, true);
    });

    test('should handle export assignments', () => {
      const content = `
        const App = () => <div>Hello</div>;
        export default App;
      `;

      const result = parseTypeScriptFile(content, 'App.tsx');

      assert.strictEqual(result.components.length,1 );
      assert.deepStrictEqual(result.components[0], {
        name: 'App',
        isExported: true,
        isDefaultExport: true,
        props: undefined
      });
    });

    test('should handle empty file', () => {
      const result = parseTypeScriptFile('', 'empty.ts');

      assert.strictEqual(result.functions.length, 0);
      assert.strictEqual(result.classes.length, 0)
      assert.strictEqual(result.components.length, 0);
      assert.strictEqual(result.imports.length, 0);
      assert.strictEqual(result.isReactFile, false);
    });
  });
});