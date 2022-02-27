import { h } from 'preact';
import renderToString from 'preact-render-to-string';
import { Handler } from '@netlify/functions';
import { render } from '@resvg/resvg-js';

import SocialSVG from 'shared/SocialSVG';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/png' },
    isBase64Encoded: true,
    body: render(renderToString(<SocialSVG entries={[]} />), {}).toString(
      'base64',
    ),
  };
};
