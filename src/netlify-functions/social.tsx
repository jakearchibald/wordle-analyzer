import { h } from 'preact';
import renderToString from 'preact-render-to-string';
import { Handler, HandlerResponse } from '@netlify/functions';
import { Resvg } from '@resvg/resvg-js';
import robotoUrl from 'url:./assets/roboto-v29-latin.ttf';

import SocialSVG, { Props as SocialSVGProps } from 'shared/SocialSVG';
import { bton, numToCell, socialDataSizes, unpackValues } from 'shared/utils';
import { CellColors } from 'shared-types/index';

const errorResponse = (): HandlerResponse => ({
  statusCode: 400,
  headers: { 'Content-Type': 'text/html' },
  body: 'Error',
});

export const handler: Handler = async (event, context) => {
  const entries: SocialSVGProps['entries'] = [];

  if (!event.queryStringParameters?.s) return errorResponse();
  const dataStr = event.queryStringParameters.s;

  if (dataStr.length % 3) return errorResponse();

  const dataChunks = Array.from(
    { length: Math.min(dataStr.length / 3, 6) },
    (_, i) => dataStr.slice(i * 3, i * 3 + 3),
  );

  for (const chunk of dataChunks) {
    const num = bton(chunk);
    const values = unpackValues(num, socialDataSizes);
    entries.push({
      colors: values
        .slice(0, 5)
        .map((value) => numToCell[value as 0 | 1 | 2]) as CellColors,
      stars: values[5],
      luckIndex: values[6],
    });
  }

  const resvg = new Resvg(renderToString(<SocialSVG entries={entries} />), {
    background: '#fff',
    //logLevel: __PRODUCTION__ ? 'off' : 'debug',
    logLevel: 'debug',
    font: {
      fontFiles: [robotoUrl],
      loadSystemFonts: false,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache',
    },
    isBase64Encoded: true,
    body: pngBuffer.toString('base64'),
  };
};
