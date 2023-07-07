import { defineBuildConfig } from 'unbuild';

import pkg from './package.json';

export default defineBuildConfig({
  entries: ['./src/index'],
  outDir: './dist',
  declaration: true,
  externals: [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies)
  ],
  rollup: {
    emitCJS: true
  }
});
