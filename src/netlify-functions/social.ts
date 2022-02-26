import { Handler } from '@netlify/functions';
import { createCanvas } from 'canvas';
import { drawSocialImage } from 'shared/social-image';

export const handler: Handler = async (event, context) => {
  const canvas = createCanvas(1920, 960);
  const ctx = canvas.getContext('2d');
  drawSocialImage(ctx as CanvasRenderingContext2D, []);

  const buffer = canvas.toBuffer();

  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: { 'Content-Type': 'image/png' },
    body: buffer.toString('base64'),
  };
};
