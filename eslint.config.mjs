import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        files: ['src/**/*.ts', 'src/**/*.tsx'],
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.json"],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: { js },
        extends: ["js/recommended"],
        rules: {}
    },
    tseslint.configs.strictTypeChecked,
    {
        ignores: ['out/**', 'dist/**', '**/*.d.ts']
    }
]);