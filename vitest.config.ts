/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import analog from '@analogjs/vite-plugin-angular';

export default defineConfig({
    plugins: [analog()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['src/test.setup.ts'],
        include: ['src/**/*.spec.ts'],
    },
});