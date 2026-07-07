import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [vue()],
    test: {
        environment: 'jsdom',
        globals: true,
        exclude: ['**/node_modules/**', '**/tests/cypress/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            thresholds: {
                statements: 90,
                branches: 85,
                functions: 90,
                lines: 90,
            },
        },
        alias: {
            '@': path.resolve(__dirname, './assets/js/app'),
        },
    },
});
