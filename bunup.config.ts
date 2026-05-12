import { defineConfig } from 'bunup';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  outDir: 'dist',
  target: 'node',
  packages: 'external',
  sourcemap: 'linked',
  dts: true,
  splitting: false,
});
