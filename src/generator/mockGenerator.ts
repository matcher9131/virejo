import { ImportInfo } from '../parser/tsParser';

export type MockingStrategy = 'React custom hooks' | 'React component' | 'Other';

export type MockInfo = {
    name: string;
    mockName: string;
    type: 'function' | 'component' | 'atom' | 'jotai-hook' | 'variable';
    moduleName: string;
}

export type AtomInfo = {
    name: string;
    isFunction: boolean; // true for atomFamily, false for atom
    usedInUseAtom: boolean;
    usedInUseAtomValue: boolean;
}

export type MockGenerationResult = {
    hoistedDeclarations: string[];
    viMockCalls: string[];
    mockNames: string[];
}

export const determineMockingStrategy = (filename: string): MockingStrategy => {
    const basename = filename.split(/[/\\]/).pop() || filename;
    
    if (basename.match(/^use[A-Z]\w*\.tsx?$/)) {
        return 'React custom hooks';
    } else if (basename.match(/^[A-Z]\w*\.tsx$/)) {
        return 'React component';
    } else {
        return 'Other';
    }
};

export const generateMockName = (originalName: string): string => {
    return `${originalName}Mock`;
};

export const isAtom = (importName: string): boolean => {
    return importName.endsWith('Atom') && importName !== 'useAtom';
};

export const isJotaiHook = (importName: string): boolean => {
    return importName === 'useAtom' || importName === 'useAtomValue';
};

export const isReactComponent = (importName: string, moduleName: string): boolean => {
    // React components typically start with uppercase
    return /^[A-Z]/.test(importName) && !moduleName.includes('jotai');
};

export const isReactHook = (importName: string): boolean => {
    return importName.startsWith('use') && /^use[A-Z]/.test(importName);
};

export const generateMocksForStrategy = (
    strategy: MockingStrategy,
    imports: ImportInfo[],
    sourceContent: string
): MockGenerationResult => {
    switch (strategy) {
        case 'React custom hooks':
            return generateReactCustomHooksMocks(imports, sourceContent);
        case 'React component':
            return generateReactComponentMocks(imports);
        case 'Other':
            return generateOtherMocks(imports);
        default:
            return { hoistedDeclarations: [], viMockCalls: [], mockNames: [] };
    }
};

const generateReactCustomHooksMocks = (
    imports: ImportInfo[], 
    sourceContent: string
): MockGenerationResult => {
    const hoistedDeclarations: string[] = [];
    const viMockCalls: string[] = [];
    const mockNames: string[] = [];
    const atoms: AtomInfo[] = [];
    let hasJotaiMocks = false;

    imports.forEach(importInfo => {
        if (importInfo.moduleName === 'jotai') {
            // Handle jotai hooks
            importInfo.namedImports.forEach(importName => {
                if (isJotaiHook(importName)) {
                    hasJotaiMocks = true;
                    const mockName = generateMockName(importName);
                    mockNames.push(mockName);
                    
                    if (importName === 'useAtom') {
                        hoistedDeclarations.push(
                            `    const ${mockName} = (atom: string) => {`,
                            `        switch (atom) {`,
                            `            // Add cases based on atoms used in useAtom`,
                            `            default: throw new Error("Invalid atom");`,
                            `        }`,
                            `    };`
                        );
                    } else if (importName === 'useAtomValue') {
                        hoistedDeclarations.push(
                            `    const ${mockName} = (atom: string) => {`,
                            `        switch (atom) {`,
                            `            // Add cases based on atoms used in useAtomValue`,
                            `            default: throw new Error("Invalid atom");`,
                            `        }`,
                            `    };`
                        );
                    }
                }
            });
        } else {
            // Handle atom imports
            const atomMocks: string[] = [];
            
            importInfo.namedImports.forEach(importName => {
                if (isAtom(importName)) {
                    const isAtomFunction = sourceContent.includes(`${importName}(`);
                    atoms.push({
                        name: importName,
                        isFunction: isAtomFunction,
                        usedInUseAtom: sourceContent.includes(`useAtom(${importName}`),
                        usedInUseAtomValue: sourceContent.includes(`useAtomValue(${importName}`)
                    });
                    
                    if (isAtomFunction) {
                        atomMocks.push(`    ${importName}: () => "${importName}"`);
                    } else {
                        atomMocks.push(`    ${importName}: "${importName}"`);
                    }
                } else {
                    // Regular function/variable import
                    const mockName = generateMockName(importName);
                    mockNames.push(mockName);
                    hoistedDeclarations.push(`    const ${mockName} = vi.fn();`);
                }
            });
            
            if (atomMocks.length > 0) {
                viMockCalls.push(
                    `vi.mock("${importInfo.moduleName}", () => ({`,
                    atomMocks.join(',\n'),
                    `}));`
                );
            }
            
            // Generate vi.mock for other imports (non-atom imports)
            const otherImports = importInfo.namedImports.filter(name => !isAtom(name));
            if (otherImports.length > 0) {
                const otherMocks = otherImports.map(name => `    ${name}: ${generateMockName(name)}`);
                viMockCalls.push(
                    `vi.mock("${importInfo.moduleName}", () => ({`,
                    otherMocks.join(',\n'),
                    `}));`
                );
            }
        }
    });

    // Generate mock data for atoms used in hooks
    atoms.forEach(atom => {
        if (atom.usedInUseAtom) {
            const baseName = atom.name.replace('Atom', '');
            const capitalizedBaseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
            const valueMock = `${baseName}Mock`;
            const setterMock = `set${capitalizedBaseName}Mock`;
            mockNames.push(valueMock, setterMock);
            hoistedDeclarations.push(
                `    const ${valueMock} = { id: "${atom.name.toLowerCase()}_id", value: 42 };`,
                `    const ${setterMock} = vi.fn();`
            );
        }
        
        if (atom.usedInUseAtomValue) {
            const valueMock = `${atom.name.replace('Atom', '')}Mock`;
            if (!mockNames.includes(valueMock)) {
                mockNames.push(valueMock);
                hoistedDeclarations.push(`    const ${valueMock} = -3;`);
            }
        }
    });

    // Add jotai partial mock if needed
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (hasJotaiMocks) {
        const jotaiMockEntries = mockNames
            .filter(name => name.includes('useAtom'))
            .map(name => `        ${name.replace('Mock', '')}: ${name}`);
        
        viMockCalls.push(
            `vi.mock(import("jotai"), async (importOriginal) => {`,
            `    const mod = await importOriginal();`,
            `    return {`,
            `        ...mod,`,
            jotaiMockEntries.join(',\n'),
            `    };`,
            `});`
        );
    }

    return { hoistedDeclarations, viMockCalls, mockNames };
};

const generateReactComponentMocks = (imports: ImportInfo[]): MockGenerationResult => {
    const hoistedDeclarations: string[] = [];
    const viMockCalls: string[] = [];
    const mockNames: string[] = [];

    imports.forEach(importInfo => {
        if (importInfo.moduleName.startsWith('.') && !importInfo.moduleName.includes('jotai')) {
            const componentMocks: string[] = [];
            const hookMocks: string[] = [];
            const otherMocks: string[] = [];

            importInfo.namedImports.forEach(importName => {
                const mockName = generateMockName(importName);
                mockNames.push(mockName);

                if (isReactComponent(importName, importInfo.moduleName)) {
                    // React component mock
                    const testId = importName.toLowerCase();
                    hoistedDeclarations.push(`    const ${mockName} = <div data-testid="${testId}"></div>;`);
                    componentMocks.push(`    ${importName}: ${mockName}`);
                } else if (isReactHook(importName)) {
                    // React hook mock
                    const returnValueMock = `${importName}ReturnValueMock`;
                    mockNames.push(returnValueMock);
                    hoistedDeclarations.push(
                        `    const ${returnValueMock} = { id: "test", value: 42 };`,
                        `    const ${mockName} = vi.fn().mockReturnValue(${returnValueMock});`
                    );
                    hookMocks.push(`    ${importName}: ${mockName}`);
                } else {
                    // Other imports
                    hoistedDeclarations.push(`    const ${mockName} = vi.fn();`);
                    otherMocks.push(`    ${importName}: ${mockName}`);
                }
            });

            if (importInfo.defaultImport) {
                const defaultMockName = generateMockName(importInfo.defaultImport);
                mockNames.push(defaultMockName);
                
                if (isReactComponent(importInfo.defaultImport, importInfo.moduleName)) {
                    const testId = importInfo.defaultImport.toLowerCase();
                    hoistedDeclarations.push(`    const ${defaultMockName} = <div data-testid="${testId}"></div>;`);
                }
            }

            // Generate vi.mock calls
            const allMocks = [...componentMocks, ...hookMocks, ...otherMocks];
            if (allMocks.length > 0 || importInfo.defaultImport) {
                const mockEntries = [...allMocks];
                if (importInfo.defaultImport) {
                    mockEntries.push(`    default: ${generateMockName(importInfo.defaultImport)}`);
                }
                
                viMockCalls.push(
                    `vi.mock("${importInfo.moduleName}", () => ({`,
                    mockEntries.join(',\n'),
                    `}));`
                );
            }
        }
    });

    return { hoistedDeclarations, viMockCalls, mockNames };
};

const generateOtherMocks = (imports: ImportInfo[]): MockGenerationResult => {
    const hoistedDeclarations: string[] = [];
    const viMockCalls: string[] = [];
    const mockNames: string[] = [];

    imports.forEach(importInfo => {
        if (importInfo.moduleName.startsWith('.')) {
            const mocks: string[] = [];

            importInfo.namedImports.forEach(importName => {
                const mockName = generateMockName(importName);
                mockNames.push(mockName);
                hoistedDeclarations.push(`    const ${mockName} = vi.fn();`);
                mocks.push(`    ${importName}: ${mockName}`);
            });

            if (importInfo.defaultImport) {
                const defaultMockName = generateMockName(importInfo.defaultImport);
                mockNames.push(defaultMockName);
                hoistedDeclarations.push(`    const ${defaultMockName} = vi.fn();`);
                mocks.push(`    default: ${defaultMockName}`);
            }

            if (mocks.length > 0) {
                viMockCalls.push(
                    `vi.mock("${importInfo.moduleName}", () => ({`,
                    mocks.join(',\n'),
                    `}));`
                );
            }
        }
    });

    return { hoistedDeclarations, viMockCalls, mockNames };
};