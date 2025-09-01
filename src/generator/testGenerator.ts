import * as path from 'path';
import { AnalysisResult, FunctionInfo, ClassInfo, ComponentInfo } from '../parser/tsParser';

export const generateTestContent = (analysis: AnalysisResult, sourceFilePath: string): string => {
    const sourceFileName = path.basename(sourceFilePath, path.extname(sourceFilePath));
    const relativePath = `./${sourceFileName}`;
    
    const lines: string[] = [];
    
    // Add Vitest imports
    lines.push("import { describe, it, expect } from 'vitest';");
    
    // Add React testing imports for TSX files
    if (analysis.isReactFile && analysis.components.length > 0) {
        lines.push("import { render, screen } from '@testing-library/react';");
    }
    
    // Add source file imports
    const imports = generateImports(analysis, relativePath);
    if (imports) {
        lines.push(imports);
    }
    
    lines.push('');
    
    // Generate tests for functions
    if (analysis.functions.length > 0) {
        lines.push(`describe('${sourceFileName}', () => {`);
        analysis.functions.forEach(func => {
            lines.push(...generateFunctionTests(func));
        });
        lines.push('});');
        lines.push('');
    }
    
    // Generate tests for classes
    analysis.classes.forEach(classInfo => {
        lines.push(...generateClassTests(classInfo));
        lines.push('');
    });
    
    // Generate tests for React components
    analysis.components.forEach(component => {
        lines.push(...generateComponentTests(component));
        lines.push('');
    });
    
    return lines.join('\n');
};

const generateImports = (analysis: AnalysisResult, relativePath: string): string => {
    const namedImports: string[] = [];
    let defaultImport: string | undefined;
    
    // Collect all exported items
    analysis.functions.filter(f => f.isExported).forEach(f => namedImports.push(f.name));
    analysis.classes.filter(c => c.isExported).forEach(c => namedImports.push(c.name));
    
    // Handle React components
    analysis.components.forEach(component => {
        if (component.isDefaultExport) {
            defaultImport = component.name;
        } else if (component.isExported) {
            namedImports.push(component.name);
        }
    });
    
    // Build import statement
    const importParts: string[] = [];
    if (defaultImport) {
        importParts.push(defaultImport);
    }
    if (namedImports.length > 0) {
        const namedPart = `{ ${namedImports.join(', ')} }`;
        importParts.push(namedPart);
    }
    
    if (importParts.length > 0) {
        return `import ${importParts.join(', ')} from '${relativePath}';`;
    }
    
    return '';
};

const generateFunctionTests = (func: FunctionInfo): string[] => {
    const lines: string[] = [];
    const testName = func.isAsync ? 'async function' : 'function';
    
    lines.push(`  describe('${func.name}', () => {`);
    lines.push(`    it('should be defined', () => {`);
    lines.push(`      expect(${func.name}).toBeDefined();`);
    lines.push(`    });`);
    lines.push('');
    
    // Add basic test case
    if (func.parameters.length === 0) {
        lines.push(`    it('should execute without parameters', ${func.isAsync ? 'async ' : ''}() => {`);
        if (func.isAsync) {
            lines.push(`      const result = await ${func.name}();`);
        } else {
            lines.push(`      const result = ${func.name}();`);
        }
        lines.push(`      // Add your assertions here`);
        lines.push(`      expect(result).toBeDefined();`);
        lines.push(`    });`);
    } else {
        lines.push(`    it('should execute with parameters', ${func.isAsync ? 'async ' : ''}() => {`);
        const mockParams = func.parameters.map(param => getMockValue(param.type)).join(', ');
        if (func.isAsync) {
            lines.push(`      const result = await ${func.name}(${mockParams});`);
        } else {
            lines.push(`      const result = ${func.name}(${mockParams});`);
        }
        lines.push(`      // Add your assertions here`);
        lines.push(`      expect(result).toBeDefined();`);
        lines.push(`    });`);
    }
    
    lines.push(`  });`);
    return lines;
};

const generateClassTests = (classInfo: ClassInfo): string[] => {
    const lines: string[] = [];
    
    lines.push(`describe('${classInfo.name}', () => {`);
    lines.push(`  let instance: ${classInfo.name};`);
    lines.push('');
    lines.push(`  beforeEach(() => {`);
    lines.push(`    instance = new ${classInfo.name}();`);
    lines.push(`  });`);
    lines.push('');
    
    lines.push(`  it('should be instantiated', () => {`);
    lines.push(`    expect(instance).toBeDefined();`);
    lines.push(`    expect(instance).toBeInstanceOf(${classInfo.name});`);
    lines.push(`  });`);
    lines.push('');
    
    // Generate tests for methods
    classInfo.methods.forEach(method => {
        lines.push(`  describe('${method.name}', () => {`);
        lines.push(`    it('should be defined', () => {`);
        lines.push(`      expect(instance.${method.name}).toBeDefined();`);
        lines.push(`    });`);
        lines.push('');
        
        lines.push(`    it('should execute', ${method.isAsync ? 'async ' : ''}() => {`);
        const mockParams = method.parameters.map(param => getMockValue(param.type)).join(', ');
        if (method.isAsync) {
            lines.push(`      const result = await instance.${method.name}(${mockParams});`);
        } else {
            lines.push(`      const result = instance.${method.name}(${mockParams});`);
        }
        lines.push(`      // Add your assertions here`);
        lines.push(`      expect(result).toBeDefined();`);
        lines.push(`    });`);
        lines.push(`  });`);
        lines.push('');
    });
    
    lines.push(`});`);
    return lines;
};

const generateComponentTests = (component: ComponentInfo): string[] => {
    const lines: string[] = [];
    
    lines.push(`describe('${component.name}', () => {`);
    lines.push(`  it('should render without crashing', () => {`);
    lines.push(`    const { container } = render(<${component.name} />);`);
    lines.push(`    expect(container).toBeInTheDocument();`);
    lines.push(`  });`);
    lines.push('');
    
    // Add props test if component has props
    if (component.props && component.props !== 'any') {
        lines.push(`  it('should render with props', () => {`);
        lines.push(`    const mockProps = {`);
        lines.push(`      // Add mock props based on your component's prop types`);
        lines.push(`    };`);
        lines.push(`    const { container } = render(<${component.name} {...mockProps} />);`);
        lines.push(`    expect(container).toBeInTheDocument();`);
        lines.push(`  });`);
        lines.push('');
    }
    
    lines.push(`  it('should match snapshot', () => {`);
    lines.push(`    const { container } = render(<${component.name} />);`);
    lines.push(`    expect(container.firstChild).toMatchSnapshot();`);
    lines.push(`  });`);
    lines.push(`});`);
    
    return lines;
};

const getMockValue = (type?: string): string => {
    if (!type) return "undefined";
    
    const cleanType = type.toLowerCase().replace(/\s/g, '');
    
    if (cleanType.includes('string')) return "'test'";
    if (cleanType.includes('number')) return "0";
    if (cleanType.includes('boolean')) return "false";
    if (cleanType.includes('array') || cleanType.includes('[]')) return "[]";
    if (cleanType.includes('object') || cleanType.includes('{')) return "{}";
    if (cleanType.includes('function') || cleanType.includes('=>')) return "vi.fn()";
    if (cleanType.includes('promise')) return "Promise.resolve()";
    if (cleanType.includes('date')) return "new Date()";
    
    return "undefined";
};