import type { CellColors } from '../shared-types/index';

interface SocialImageEntry {
  colors: CellColors;
}

export function drawSocialImage(
  ctx: CanvasRenderingContext2D,
  entries: SocialImageEntry[],
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.fillStyle = 'green';
  ctx.fillRect(0, 0, width, height);
}
