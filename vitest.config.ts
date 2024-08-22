import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**.js',
        '**.ts',
        '**/**.stories.**',
        '**/getMockFrameRequest.ts',
        '**/index.ts',
        '**/mocks.tsx',
        '**/*Svg.tsx',
        '**/types.ts',
        '.storybook/**',
        '.yarn/**',
        'esm/**',
        'framegear/**',
        'node_modules/**',
        'onchainkit/esm/**',
        'playground/**',
        'site/**',
      ],
      reportOnFailure: true,
      thresholds: {
        statements: 99.67,
        branches: 99.71,
        functions: 100,
        lines: 99.67,
      },
    },
    environment: 'jsdom',
    exclude: ['**/node_modules/**', 'framegear/**', 'playground/**', 'site/**'],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
