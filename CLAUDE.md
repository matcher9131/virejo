# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Virejo is a VS Code extension that automatically generates test files for TypeScript/TSX files. The extension adds a right-click context menu option to generate Vitest-compatible test files with basic structure and import statements.

## Key Development Commands

Since this is a VS Code extension project, the following commands will be essential once the project structure is established:

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Package extension for distribution
vsce package

# Run tests (when implemented)
npm test

# Lint code (when configured)
npm run lint
```

## Architecture Overview

**VS Code Extension Structure:**
- `package.json` - Extension manifest with contribution points for context menus and commands
- `src/extension.ts` - Main extension entry point with activation/deactivation logic
- `src/commands/` - Command implementations for test file generation
- `src/parser/` - TypeScript AST parsing logic to analyze source files
- `src/generator/` - Test file template generation logic
- `src/utils/` - File system utilities and helper functions

**Core Components:**

1. **Context Menu Integration** (`package.json` contributions):
   - `contributes.menus.explorer/context` for right-click menu
   - `contributes.commands` for command definitions
   - `activationEvents` for extension activation

2. **File Analysis Engine**:
   - Uses TypeScript compiler API for AST parsing
   - Extracts exported functions, classes, and React components
   - Identifies function signatures and component props

3. **Test Generation Engine**:
   - Creates Vitest-compatible test files
   - Generates appropriate import statements
   - Creates describe/it blocks for discovered exports
   - Handles both .ts and .tsx file types

## Extension-Specific Requirements

**Target Test Framework:** Vitest
- Import statement: `import { describe, it, expect } from 'vitest'`
- Support for component testing with `@testing-library/react` (for TSX files)
- Mock generation for module dependencies

**File Naming Convention:**
- Input: `component.tsx` → Output: `component.test.tsx`
- Input: `utils.ts` → Output: `utils.test.ts`
- Test files are created in the same directory as source files

**AST Parsing Focus:**
- Function declarations and expressions
- Class declarations
- Default and named exports
- React functional components (TSX)
- Interface/type definitions for test data generation

**Automatically Mocking:**
- See .claude/mocking_design.md

## Development Workflow

1. Start with basic extension scaffold (`yo code` generator)
2. Implement context menu contribution in `package.json`
3. Create command handler for file generation
4. Add TypeScript parser for source code analysis
5. Implement test template generation
6. Add error handling and user feedback
7. Package and test in VS Code development host

## Testing Strategy

The extension should be tested with:
- Sample TypeScript files with various export patterns
- React components with different prop structures
- Edge cases like empty files, syntax errors
- Existing test file scenarios (overwrite confirmation)

## Extension Dependencies

Key npm packages for implementation:
- `typescript` - For AST parsing
- `@types/vscode` - VS Code API types
- `vsce` - Extension packaging tool
- `@types/node` - Node.js types for file system operations