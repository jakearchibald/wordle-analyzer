import { drawSocialImage } from 'shared/social-image';

const canvas = document.querySelector<HTMLCanvasElement>('.canvas')!;
canvas.width = 1920;
canvas.height = 960;

const ctx = canvas.getContext('2d')!;

drawSocialImage(ctx, []);
