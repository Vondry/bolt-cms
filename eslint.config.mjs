import js from '@eslint/js';
import cypress from 'eslint-plugin-cypress';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['node_modules/**', 'public/assets/**', 'var/**', 'vendor/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...vue.configs['flat/recommended'],
    {
        files: ['assets/**/*.{js,ts,vue}', 'tests/cypress/**/*.js', '*.mjs'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: ['.vue'],
            },
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            'no-console': ['error', { allow: ['error', 'warn'] }],
            'no-debugger': 'error',
            'vue/require-default-prop': 'off',
            'vue/require-prop-type-constructor': 'off',
            // Existing component names and kebab-case registrations are the public
            // contract used by the Twig (in-DOM) templates; renaming is out of scope.
            'vue/multi-word-component-names': 'off',
            'vue/component-definition-name-casing': 'off',
            // Pre-existing in-place prop array mutations (File, Image, Select);
            // surfaced as warnings until refactored to emit-based updates.
            'vue/no-mutating-props': 'warn',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'prettier/prettier': ['error', { printWidth: 120 }],
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.vue'],
                },
            },
        },
    },
    {
        files: ['tests/cypress/**/*.js'],
        ...cypress.configs.recommended,
    },
    {
        files: ['tests/unit/**/*.{js,ts}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    prettierRecommended,
];
