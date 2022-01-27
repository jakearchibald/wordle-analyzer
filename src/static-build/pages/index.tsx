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
import { h, FunctionalComponent } from 'preact';

import initialCss from 'prerender-css:';
import { src, imports } from 'client-bundle:client';
// import favicon from 'url:static-build/assets/favicon.ico';
// import ogImage from 'url:static-build/assets/icon-large-maskable.png';
import { escapeStyleScriptContent } from 'static-build/utils';

interface Props {}

const Index: FunctionalComponent<Props> = () => (
  <html lang="en">
    <head>
      <title>Wordle Analyzer</title>
      {
        <style
          dangerouslySetInnerHTML={{
            __html: escapeStyleScriptContent(initialCss),
          }}
        />
      }
      {imports.map((preload) => (
        <link rel="modulepreload" href={preload} />
      ))}
    </head>
    <body>
      <div id="app"></div>
      <script
        type="module"
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(src),
        }}
      />
    </body>
  </html>
);

export default Index;
