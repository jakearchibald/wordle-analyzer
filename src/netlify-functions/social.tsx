import { h } from 'preact';
import render from 'preact-render-to-string';
import { Handler } from '@netlify/functions';
import SocialSVG from 'shared/SocialSVG';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
    body: render(<SocialSVG entries={[]} />),
  };
};
