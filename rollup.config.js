/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as path from 'path';
import del from 'del';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';

import simpleTS from './lib/simple-ts';
import { fileNameToURL } from './lib/utils';
import clientBundlePlugin from './lib/client-bundle-plugin';
import nodeExternalPlugin from './lib/node-external-plugin';
import urlPlugin from './lib/url-plugin';
import cssPlugin from './lib/css-plugin';
import resolveDirsPlugin from './lib/resolve-dirs-plugin';
import runScript from './lib/run-script';
import emitFiles from './lib/emit-files-plugin';
import serviceWorkerPlugin from './lib/sw-plugin';
import entryDataPlugin from './lib/entry-data-plugin';
import entryURLPlugin from './lib/entry-url-plugin';

const __MAJOR_VERSION__ = Number(
  require('./package.json').version.split('.')[0],
);

function resolveFileUrl({ fileName }) {
  return JSON.stringify(fileNameToURL(fileName));
}

const dir = '.tmp/build';
const staticPath = 'static/c/[name]-[hash][extname]';
const jsPath = staticPath.replace('[extname]', '.js');

function jsFileName(chunkInfo) {
  if (!chunkInfo.facadeModuleId) return jsPath;
  const parsedPath = path.parse(chunkInfo.facadeModuleId);
  if (parsedPath.name !== 'index') return jsPath;
  // Come up with a better name than 'index'
  const name = parsedPath.dir.split(/\\|\//).slice(-1);
  return jsPath.replace('[name]', name);
}

export default async function ({ watch }) {
  await del('.tmp/build');

  const isProduction = !watch;

  const tsPluginInstance = simpleTS('.', {
    watch,
  });

  const commonPlugins = () => [
    tsPluginInstance,
    resolveDirsPlugin([
      'src/static-build',
      'src/client',
      'src/shared',
      'src/workers',
    ]),
    urlPlugin(),
    cssPlugin(),
  ];

  return {
    input: 'src/static-build/index.tsx',
    output: {
      dir,
      format: 'cjs',
      assetFileNames: staticPath,
      exports: 'named',
    },
    watch: {
      clearScreen: false,
      // Don't watch the ts files. Instead we watch the output from the ts compiler.
      exclude: ['**/*.ts', '**/*.tsx'],
      // Sometimes TypeScript does its thing a little slowly, which causes
      // Rollup to build twice on each change. This delay seems to fix it,
      // although we may need to change this number over time.
      buildDelay: 250,
    },
    preserveModules: true,
    plugins: [
      { resolveFileUrl },
      clientBundlePlugin(
        {
          plugins: [
            { resolveFileUrl },
            serviceWorkerPlugin({
              output: 'static/sw.js',
            }),
            entryURLPlugin(),
            ...commonPlugins(),
            commonjs(),
            resolve(),
            replace({
              values: {
                __PRERENDER__: false,
                __PRODUCTION__: isProduction,
                __MAJOR_VERSION__,
              },
              preventAssignment: true,
            }),
            entryDataPlugin(),
            isProduction ? terser({ module: true }) : {},
          ],
          preserveEntrySignatures: false,
        },
        {
          dir,
          format: 'esm',
          chunkFileNames: jsFileName,
          entryFileNames: jsFileName,
        },
        resolveFileUrl,
      ),
      ...commonPlugins(),
      emitFiles({ include: '**/*', root: path.join(__dirname, 'src', 'copy') }),
      nodeExternalPlugin(),
      replace({
        values: {
          __PRERENDER__: true,
          __PRODUCTION__: isProduction,
          __MAJOR_VERSION__,
        },
        preventAssignment: true,
      }),
      runScript(dir + '/index.js'),
    ],
  };
}
