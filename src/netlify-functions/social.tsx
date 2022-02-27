import { h } from 'preact';
import renderToString from 'preact-render-to-string';
import { Handler } from '@netlify/functions';
import { render } from '@resvg/resvg-js';
import robotoUrl from 'url:./assets/roboto-v29-latin.ttf';

import SocialSVG from 'shared/SocialSVG';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': __PRODUCTION__ ? 'max-age=31536000' : 'no-cache',
    },
    isBase64Encoded: true,
    body: render(
      renderToString(
        <SocialSVG
          entries={[
            {
              colors: ['a', 'a', 'c', 'p', 'a'],
            },
            {
              colors: ['c', 'p', 'c', 'a', 'a'],
            },
            {
              colors: ['c', 'c', 'c', 'c', 'a'],
            },
            {
              colors: ['c', 'c', 'c', 'c', 'c'],
            },
          ]}
        />,
      ),
      {
        background: '#fff',
        logLevel: __PRODUCTION__ ? 'off' : 'debug',
        font: {
          fontFiles: [robotoUrl],
          loadSystemFonts: false,
        },
      },
    ).toString('base64'),
  };
};
