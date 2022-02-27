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
import { h, FunctionalComponent, Fragment } from 'preact';

import cssSource from 'css:./styles.module.css';
import * as styles from './styles.module.css';
import { escapeStyleScriptContent } from 'shared/utils';

interface Props {}

const SocialDesign: FunctionalComponent<Props> = () => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <title>Wordle Analyzer</title>
      <style
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(cssSource),
        }}
      />
    </head>
    <body>
      <div class={styles.container}>
        <div class={styles.canvas}>
          <div class={styles.main}>
            <div></div>
            <div class={styles.tableHeading}>Skill</div>
            <div class={styles.tableHeading}>Luck</div>
            {Array(4)
              .fill('')
              .map(() => (
                <>
                  <div class={styles.guess}>
                    <div class={styles.guessLetter} />
                    <div class={styles.guessLetter} />
                    <div class={styles.guessLetter} />
                    <div class={styles.guessLetter} />
                    <div class={styles.guessLetter} />
                  </div>
                  <div class={styles.tableContent}>⭐⭐⭐⭐⭐</div>
                  <div class={styles.tableContent}>⭐⭐⭐⭐⭐</div>
                </>
              ))}
          </div>
          <div class={styles.footer}>wordle-analyzer.com</div>
        </div>
      </div>
    </body>
  </html>
);

export default SocialDesign;
