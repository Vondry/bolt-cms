import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
    plugins: [vue()],
    test: {
        environment: 'jsdom',
        globals: true,
        exclude: ['**/node_modules/**', '**/tests/cypress/**'],
        passWithNoTests: true,
        alias: {
            '@': path.resolve(__dirname, './assets/js/app'),
        },
    },
});
