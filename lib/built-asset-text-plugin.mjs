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
import { readFile } from 'fs/promises';

const importPrefix = 'built-asset-text:';

export default function builtAssetTextPlugin({ devMode = true } = {}) {
  const path = '.tmp/build/static';

  return {
    name: 'built-asset-text',
    resolveId(id, importer) {
      if (id.startsWith(importPrefix)) return id;
    },
    async load(id) {
      if (!id.startsWith(importPrefix)) return;

      const realId = id.slice(importPrefix.length);
      const text = await readFile(`${path}/${realId}`, { encoding: 'utf8' });

      return `export default ${JSON.stringify(text)};`;
    },
  };
}
