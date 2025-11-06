import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

import { dependencies } from './package.json';

const basic = defineConfig({
  input: 'src/index.ts',
  platform: 'node',
  treeshake: true,
  external: Object.keys(dependencies || {})
});

export default defineConfig([
  {
    ...basic,
    output: {
      dir: 'dist',
      format: 'commonjs',
      exports: 'named',
      cleanDir: true
    }
  },
  {
    ...basic,
    plugins: [
      dts({
        emitDtsOnly: true,
        compilerOptions: { removeComments: false }
      })
    ],
    output: {
      dir: 'dist',
      format: 'esm'
    }
  }
]);
