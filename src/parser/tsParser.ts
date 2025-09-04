import * as ts from 'typescript';
import * as path from 'path';

export type FunctionInfo = {
    name: string;
    isAsync: boolean;
    parameters: ParameterInfo[];
    returnType?: string;
    isExported: boolean;
}

export type ParameterInfo = {
    name: string;
    type?: string;
    isOptional: boolean;
}

export type ClassInfo = {
    name: string;
    isExported: boolean;
    methods: FunctionInfo[];
    properties: PropertyInfo[];
}

export type PropertyInfo = {
    name: string;
    type?: string;
    isOptional: boolean;
}

export type ComponentInfo = {
    name: string;
    isExported: boolean;
    props?: string;
    isDefaultExport: boolean;
}

export type AnalysisResult = {
    functions: FunctionInfo[];
    classes: ClassInfo[];
    components: ComponentInfo[];
    imports: ImportInfo[];
    isReactFile: boolean;
}

export type ImportInfo = {
    moduleName: string;
    namedImports: string[];
    defaultImport?: string;
    namespaceImport?: string;
}

export const parseTypeScriptFile = (content: string, filePath: string): AnalysisResult => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

    const result: AnalysisResult = {
        functions: [],
        classes: [],
        components: [],
        imports: [],
        isReactFile: path.extname(filePath) === '.tsx' || content.includes('import React') || content.includes('from \'react\'')
    };

    const visit = (node: ts.Node) => {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                handleImportDeclaration(node as ts.ImportDeclaration, result);
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                handleFunctionDeclaration(node as ts.FunctionDeclaration, result);
                break;
            case ts.SyntaxKind.VariableStatement:
                handleVariableStatement(node as ts.VariableStatement, result);
                break;
            case ts.SyntaxKind.ClassDeclaration:
                handleClassDeclaration(node as ts.ClassDeclaration, result);
                break;
            case ts.SyntaxKind.ExportAssignment:
                handleExportAssignment(node as ts.ExportAssignment, result);
                break;
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return result;
}

const handleImportDeclaration = (node: ts.ImportDeclaration, result: AnalysisResult) => {
    if (/*!node.moduleSpecifier ||*/ !ts.isStringLiteral(node.moduleSpecifier)) {
        return;
    }

    const moduleName = node.moduleSpecifier.text;
    const importInfo: ImportInfo = {
        moduleName,
        namedImports: []
    };

    if (node.importClause) {
        if (node.importClause.name) {
            importInfo.defaultImport = node.importClause.name.text;
        }

        if (node.importClause.namedBindings) {
            if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                importInfo.namespaceImport = node.importClause.namedBindings.name.text;
            } else if (ts.isNamedImports(node.importClause.namedBindings)) {
                importInfo.namedImports = node.importClause.namedBindings.elements.map(
                    element => element.name.text
                );
            }
        }
    }

    result.imports.push(importInfo);
}

const handleFunctionDeclaration = (node: ts.FunctionDeclaration, result: AnalysisResult) => {
    if (!node.name) {
        return;
    }

    const functionInfo: FunctionInfo = {
        name: node.name.text,
        isAsync: !!(node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword)),
        parameters: node.parameters.map(param => ({
            name: param.name.getText(),
            type: param.type?.getText(),
            isOptional: !!param.questionToken
        })),
        returnType: node.type?.getText(),
        isExported: !!(node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword))
    };

    // Check if it's a React component
    if (result.isReactFile && isReactComponent(node)) {
        const componentInfo: ComponentInfo = {
            name: functionInfo.name,
            isExported: functionInfo.isExported,
            props: functionInfo.parameters[0]?.type,
            isDefaultExport: false
        };
        result.components.push(componentInfo);
    } else {
        result.functions.push(functionInfo);
    }
}

const handleVariableStatement = (node: ts.VariableStatement, result: AnalysisResult) => {
    const isExported = !!(node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword));

    node.declarationList.declarations.forEach(declaration => {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
            return;
        }

        const name = declaration.name.text;

        // Check for arrow functions
        if (ts.isArrowFunction(declaration.initializer)) {
            const arrowFunction = declaration.initializer;
            const typeAnnotation = declaration.type?.getText();
            const functionInfo: FunctionInfo = {
                name,
                isAsync: !!(arrowFunction.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword)),
                parameters: arrowFunction.parameters.map(param => ({
                    name: param.name.getText(),
                    type: param.type?.getText(),
                    isOptional: !!param.questionToken
                })),
                returnType: arrowFunction.type?.getText(),
                isExported
            };

            // Check if it's a React component
            if (result.isReactFile && isReactComponentArrow(arrowFunction, name, typeAnnotation)) {
                // Extract props from React.FC<Props> type annotation
                let props = functionInfo.parameters[0]?.type;
                if (!props && typeAnnotation?.includes('React.FC<')) {
                    const match = typeAnnotation.match(/React\.FC<([^>]+)>/);
                    if (match) {
                        props = match[1];
                    }
                }
                
                const componentInfo: ComponentInfo = {
                    name,
                    isExported,
                    props,
                    isDefaultExport: false
                };
                result.components.push(componentInfo);
            } else {
                result.functions.push(functionInfo);
            }
        }
    });
}

const handleClassDeclaration = (node: ts.ClassDeclaration, result: AnalysisResult) => {
    if (!node.name) {
        return;
    }

    const classInfo: ClassInfo = {
        name: node.name.text,
        isExported: !!(node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)),
        methods: [],
        properties: []
    };

    node.members.forEach(member => {
        if (ts.isMethodDeclaration(member) && /*member.name &&*/ ts.isIdentifier(member.name)) {
            const methodInfo: FunctionInfo = {
                name: member.name.text,
                isAsync: !!(member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword)),
                parameters: member.parameters.map(param => ({
                    name: param.name.getText(),
                    type: param.type?.getText(),
                    isOptional: !!param.questionToken
                })),
                returnType: member.type?.getText(),
                isExported: false
            };
            classInfo.methods.push(methodInfo);
        } else if (ts.isPropertyDeclaration(member) && /*member.name &&*/ ts.isIdentifier(member.name)) {
            const propertyInfo: PropertyInfo = {
                name: member.name.text,
                type: member.type?.getText(),
                isOptional: !!member.questionToken
            };
            classInfo.properties.push(propertyInfo);
        }
    });

    result.classes.push(classInfo);
}

const handleExportAssignment = (node: ts.ExportAssignment, result: AnalysisResult) => {
    if (/*node.expression &&*/ ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        
        // Find the corresponding component or function and mark as default export
        const component = result.components.find(c => c.name === name);
        if (component) {
            component.isDefaultExport = true;
            component.isExported = true; // Default exports are exported
        }
        
        const func = result.functions.find(f => f.name === name);
        if (func && result.isReactFile) {
            // Convert function to component if it's a React file with default export
            result.components.push({
                name: func.name,
                isExported: true,
                isDefaultExport: true,
                props: func.parameters[0]?.type
            });
            result.functions = result.functions.filter(f => f.name !== name);
        } else if (func) {
            // Update function export status
            func.isExported = true;
        }
    }
}

const isReactComponent = (node: ts.FunctionDeclaration): boolean => {
    // Check if function name starts with uppercase (React component convention)
    const name = node.name?.text;
    if (!name || name[0] !== name[0].toUpperCase()) {
        return false;
    }

    // Check return type or if it returns JSX
    const returnType = node.type?.getText();
    return !!(returnType?.includes('JSX') || returnType?.includes('ReactElement') || returnType?.includes('React.FC'));
}

const isReactComponentArrow = (arrowFunction: ts.ArrowFunction, name?: string, typeAnnotation?: string): boolean => {
    // Check if variable has React.FC type annotation
    if (typeAnnotation?.includes('React.FC') || typeAnnotation?.includes('ReactFC')) {
        return true;
    }
    
    // Check if component name starts with uppercase (React component convention)
    if (name && name[0] === name[0].toUpperCase()) {
        return true;
    }

    // Check return type or if it returns JSX
    const returnType = arrowFunction.type?.getText();
    return !!(returnType?.includes('JSX') || returnType?.includes('ReactElement') || returnType?.includes('React.FC'));
}