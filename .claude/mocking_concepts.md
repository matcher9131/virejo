# Mocking Concepts

## Base Concepts
- Each test double is named original name + `Mock`
  - For examle: `fooBar` → `fooBarMock`
- Avoid importing actual modules intended to be mocked.
- All the test doubles are declared in `vi.hoisted()`, and `vi.hoisted()` returns them as a single object.
- Then use `vi.mock()` for mocking.
- Refer to the example below for details.

```ts
import { vi } from "vitest";

const { fooBarMock } = vi.hoisted(() => {
    const fooBarMock = vi.fn();
    return { fooBarMock }
});

vi.mock("../foo/", () => ({
    fooBar: fooBarMock
}));
```

## Mocking Strategy
- We adopt three different mocking strategies below.
  - For React custom hooks files
  - For React component files
  - For other files
- The specifics of each strategy is explained in the next chapters. 
- Which strategy is assigned to the file is determined by the file name as shown in the virtual code below. All the conditions are case-sensitive.

```ts
if (filename.match(/^use[A-Z]\w*\.tsx?$/)) {
    return "React custom hooks";
} else if (filename.match(/^[A-Z]\w*.tsx$/)) {
    return "React component";
} else {
    return "Other";
}
```

### For React Componets Files

- Create mocks of imported other React components.
  - Each mock should be a `div` element with `data-testid` attribute of its name.
- Create mocks of imported React custom hooks.
  - The return values of custom hooks also should be mocked.
- Create mocks of other imported variables and functions.

For example, if the original module likes to be the following,

```tsx
import { useFoo } from "./useFoo"; // importing React custom hooks
import { Foo } from "./Foo";  // importing React components

type FooContainerProps = { readonly id: string };

export const FooContainer = ({id}: FooContainerProps) => {
    const props = useFoo(id);
    return <Foo {...props} />;
}
```

The generated test file should be the following.

```tsx
import { describe, it, expect, vi } from "vitest";
import { FooContainer } from "./FooContainer";

const { useFooReturnValueMock, useFooMock, FooMock } = vi.hoisted(() => {
    const useFooReturnValueMock = { id: "baz", value: 42 };
    const useFooMock = vi.fn().mockReturnValue(useFooReturnValueMock);
    const FooMock = <div data-testid="foo"></div>;
    return {
        useFooReturnValueMock,
        useFooMock,
        FooMock
    }
});

vi.mock("./useFoo", () => ({
    useFoo: useFooMock
}));
vi.mock("./Foo", () => ({
    Foo: FooMock
}));

// Test cases below
```

### For React Custom Hooks File

- Create mocks of imported *atoms*.
  - *atoms* are those that satisfies the following conditions:
    - Named import variables or functions.
    - Its name ends with `Atom`.
    - Its name is not `useAtom`.
    - Used as an argument of `useAtom` or `useAtomValue` in `jotai`
  - If *atom* is a variable (regarded as the one created by `atom`), its mock is a string of its name.
  - If *atom* is a function (regarded as the one created by `atomFamily`), its mock is a function which returns a string of its name.
- Create mocks of `useAtom` or `useAtomValue` from `jotai` if imported.
  - `jotai` should be partially mocked.
  - Mock of `useAtom` and `useAtomValue` should be a function that satisfies the following conditions:
    - Takes an string as an arguemnt.
    - Switches by the argument and returns
      - A tuple of a mocked object and a function (`useAtom`)
      - A mocked object (`useAtomValue`)
- Create mocks of other imported variables and functions.

For example, if the original module likes to be the following,

```ts
import { useAtom, useAtomValue } from "jotai";
import { fooAtom, barAtom, bazAtom } from "../models/fooAtom";
import { someFunction } from "../utils/someFunctions";

export const useFoo = (id: string) => {
    const [foo, setFoo] = useAtom(fooAtom);
    const bar = someFunction(useAtomValue(barAtom));
    const [baz, setBaz] = useAtom(bazAtom(id));
    return {
        foo,
        setFoo,
        bar,
        baz,
        setBaz
    };
}
```

The generated test file should be the following.

```ts
import { describe, it, expect, vi } from "vitest";
import { useFoo } from "./useFoo";

// Declare test doubles
const { 
    someFunctionMock,
    fooMock,
    setFooMock,
    barMock,
    bazMock,
    setBazMock,
    useAtomMock,
    useAtomValueMock,
} = vi.hoisted(() => {
    const someFunctionMock = vi.fn();
    const fooMock = { id: "foo_id", value: 42 };
    const setFooMock = vi.fn();
    const barMock = -3;
    const bazMock = ["hoge", "fuga"];
    const setBazMock = vi.fn();
    const useAtomMock = (atom: string) => {
        // switch by argument and return test doubles of atom used in `useAtom`
        switch (atom) {
            case "fooAtom": return [fooMock, setFooMock];
            case "bazAtom": return [bazMock, setBazMock];
            default: throw new Error("Invalid atom");
        }
    };
    const useAtomValueMock = (atom: string) => {
        // switch by argument and return test doubles of atom used in `useAtomValue`
        switch (atom) {
            case "barAtom": return barMock;
            default: throw new Error("Invalid atom");
        }
    };

    // return all the test doubles as an object.
    return {
        someFunctionMock,
        fooMock,
        setFooMock,
        barMock,
        bazMock,
        setBazMock,
        useAtomMock,
        useAtomValueMock,
    };
});

// Mock *atoms*
vi.mock("../models/fooAtom", () => ({
    fooAtom: "fooAtom",
    barAtom: "barAtom",
    bazAtom: () => "bazAtom",
}));

// Mock jotai partially 
vi.mock(import("jotai"), async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        useAtom: useAtomMock,
        useAtomValue: useAtomValueMock,
    };
});

// Mock other files
vi.mock("../utils/someFunctions", () => ({
    someFunction: someFunctionMock
}));

// Test cases below
```

### For Other Files

