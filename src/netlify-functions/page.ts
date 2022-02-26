import { URLSearchParams } from 'url';

import { Handler } from '@netlify/functions';
import htmlText from 'built-asset-text:index.html';

const socialRe = /\/c\/social-large-[^\.]+.png/g;

export const handler: Handler = async (event, context) => {
  console.log(process.env.LD_LIBRARY_PATH);

  let body = htmlText;

  if (event.queryStringParameters?.guesses) {
    const params = new URLSearchParams(
      event.queryStringParameters as Record<string, string>,
    );
    body = body.replace(
      socialRe,
      '/.netlify/functions/social?' + params.toString(),
    );
  }

  return {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    statusCode: 200,
    body,
  };
};
