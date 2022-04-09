import { URLSearchParams } from 'url';

import { Handler } from '@netlify/functions';
import htmlText from 'built-asset-text:index.html';

const socialRe = /\/c\/social-large-[^\.]+.png/g;

export const handler: Handler = async (event, context) => {
  let body = htmlText;

  if (event.queryStringParameters?.s) {
    const params = new URLSearchParams({ s: event.queryStringParameters.s });
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
