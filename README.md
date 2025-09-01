# Virejo - Test File Generator

A VS Code extension that automatically generates Vitest test files for TypeScript and TSX files.

## Features

- **Right-click context menu**: Generate test files directly from the explorer
- **TypeScript support**: Works with both .ts and .tsx files
- **Vitest integration**: Generates test files with Vitest syntax
- **React component testing**: Special handling for React components with testing-library
- **AST-based analysis**: Intelligently parses your code to create meaningful test stubs

## Usage

1. Right-click on any TypeScript (.ts) or TSX (.tsx) file in the VS Code explorer
2. Select "Generate Test File" from the context menu
3. The extension will create a corresponding test file in the same directory
4. The test file includes:
   - Vitest imports
   - Basic test structure for functions, classes, and React components
   - Appropriate imports from the source file

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

## Requirements

- VS Code 1.74.0 or higher
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