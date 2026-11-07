import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

// Newer Node versions (25+) ship their own experimental `localStorage`, which hides the one from jsdom
// and breaks every test that touches it. Turn it off in the test workers (flag exists from Node 22.4).
const [major, minor] = process.versions.node.split('.').map(Number);
const execArgv = major > 22 || (major === 22 && minor >= 4) ? ['--no-experimental-webstorage'] : [];

// Unit/component tests for the frontend. Run with: npm test
export default defineConfig({
  resolve: {
    // same "@/..." alias as tsconfig.json
    alias: { '@': root },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    pool: 'forks',
    poolOptions: { forks: { execArgv } },
  },
});
