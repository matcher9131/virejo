# Virejo - Test File Generator

A VS Code extension that automatically generates Vitest test files for TypeScript and TSX files.

## Features

- **Right-click context menu**: Generate test files directly from the explorer
- **TypeScript support**: Works with both .ts and .tsx files
- **Vitest integration**: Generates test files with Vitest syntax
- **React component testing**: Special handling for React components with testing-library
- **AST-based analysis**: Intelligently parses your code to create meaningful test stubs
- **Auto mocking**: Automatically generates appropriate mocks based on file type and imports

## Usage

1. Right-click on any TypeScript (.ts) or TSX (.tsx) file in the VS Code explorer
2. Select "Generate Test File" from the context menu
3. The extension will create a corresponding test file in the same directory
4. The test file includes:
   - Vitest imports
   - Basic test structure for functions, classes, and React components
   - Appropriate imports from the source file
   - Automatically generated mocks based on your imports and file type

## Generated Test Structure

### For Functions
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFile';

describe('myFile', () => {
  describe('myFunction', () => {
    it('should be defined', () => {
      expect(myFunction).toBeDefined();
    });
    
    it('should execute with parameters', () => {
      const result = myFunction('test');
      expect(result).toBeDefined();
    });
  });
});
```

### For React Components
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render without crashing', () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeInTheDocument();
  });
  
  it('should match snapshot', () => {
    const { container } = render(<MyComponent />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Auto Mocking

Virejo automatically generates appropriate mocks based on your file type and imports, following different strategies:

### React Custom Hooks (`useXxx.ts/tsx`)

For files matching the pattern `use[A-Z]*.ts(x)`, Virejo generates:

- **Jotai atom mocks**: Atoms are mocked as strings, atom families as functions returning strings
- **Jotai hook mocks**: `useAtom` and `useAtomValue` are mocked with switch statements based on actual usage
- **Regular function mocks**: Other imports are mocked with `vi.fn()`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { useFoo } from './useFoo';

const {
    useAtomMock,
    useAtomValueMock,
    someFunctionMock,
    fooMock,
    setFooMock,
    barMock
} = vi.hoisted(() => {
    const someFunctionMock = vi.fn();
    const fooMock = { id: "foo_id", value: 42 };
    const setFooMock = vi.fn();
    const barMock = -3;
    const useAtomMock = vi.fn().mockImplementation((atom: string) => {
        switch (atom) {
            case "fooAtom": return [fooMock, setFooMock];
            default: throw new Error("Invalid atom");
        }
    });
    const useAtomValueMock = vi.fn().mockImplementation((atom: string) => {
        switch (atom) {
            case "barAtom": return barMock;
            default: throw new Error("Invalid atom");
        }
    });
    return { useAtomMock, useAtomValueMock, someFunctionMock, fooMock, setFooMock, barMock };
});

vi.mock("../models/atoms", () => ({ fooAtom: "fooAtom", barAtom: "barAtom" }));
vi.mock("../utils/helpers", () => ({ someFunction: someFunctionMock }));
vi.mock(import("jotai"), async (importOriginal) => {
    const mod = await importOriginal();
    return { ...mod, useAtom: useAtomMock, useAtomValue: useAtomValueMock };
});
```

### React Components (`[A-Z]*.tsx`)

For React component files, Virejo generates:

- **Component mocks**: Other React components as `<div data-testid="component-name"></div>`
- **Hook mocks**: Custom hooks with return value mocks
- **Function mocks**: Regular imports as `vi.fn()`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { UserProfile } from './UserProfile';

const {
    useUserDataMock,
    useUserDataReturnValueMock,
    UserCardMock
} = vi.hoisted(() => {
    const useUserDataReturnValueMock = { id: "test", value: 42 };
    const useUserDataMock = vi.fn().mockReturnValue(useUserDataReturnValueMock);
    const UserCardMock = <div data-testid="usercard"></div>;
    return { useUserDataMock, useUserDataReturnValueMock, UserCardMock };
});

vi.mock("./useUserData", () => ({ useUserData: useUserDataMock }));
vi.mock("./UserCard", () => ({ UserCard: UserCardMock }));
```

### Other Files (`*.ts`)

For regular TypeScript files, Virejo generates basic function mocks:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { calculateSum } from './utils';

const { helperFunctionMock, UtilityClassMock } = vi.hoisted(() => {
    const helperFunctionMock = vi.fn();
    const UtilityClassMock = vi.fn();
    return { helperFunctionMock, UtilityClassMock };
});

vi.mock("./helpers", () => ({ 
    helperFunction: helperFunctionMock,
    default: UtilityClassMock 
}));
```

## Requirements

- VS Code 1.93.0 or higher
- TypeScript files (.ts, .tsx)
- Vitest testing framework (for running the generated tests)

## Development

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm test
```

### Packaging

```bash
npm run package
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT