import { build } from 'tsup';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

// Normalize path for tsup on Windows
const normalizePath = (p: string) => p.replace(/\\/g, '/');

console.log('Building test extension...');
console.log('__dirname:', __dirname);

// Create dist directory
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Build background worker
await build({
  entry: [normalizePath(path.join(__dirname, 'src/background.ts'))],
  format: ['esm'],
  outDir: normalizePath(distDir),
  external: [],  // Bundle everything
  bundle: true,
  splitting: false,
  clean: false,
  noExternal: [/.*/],  // Force bundle all dependencies
});

console.log('✓ Background worker built');

// Build content script
await build({
  entry: [normalizePath(path.join(__dirname, 'src/content-script.ts'))],
  format: ['esm'],
  outDir: normalizePath(distDir),
  external: [],  // Bundle everything
  bundle: true,
  splitting: false,
  clean: false,
  noExternal: [/.*/],  // Force bundle all dependencies
});

console.log('✓ Content script built');

// Build test-page script
await build({
  entry: [normalizePath(path.join(__dirname, 'src/test-page.ts'))],
  format: ['esm'],
  outDir: normalizePath(distDir),
  external: [],  // Bundle everything
  bundle: true,
  splitting: false,
  clean: false,
  noExternal: [/.*/],  // Force bundle all dependencies
});

console.log('✓ Test page script built');

// Copy static files to dist
copyFileSync(path.join(__dirname, 'manifest.json'), path.join(distDir, 'manifest.json'));
copyFileSync(path.join(__dirname, 'test-page.html'), path.join(distDir, 'test-page.html'));

console.log('✓ Static files copied');
console.log('\nTest extension build complete!');
