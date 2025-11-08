import { RenderCommand } from '../utils/canvasRenderer';

interface WorkerInitMessage {
  type: 'init';
  canvas: OffscreenCanvas;
  config: {
    width: number;
    height: number;
    dpr: number;
  };
}

interface WorkerRenderMessage {
  type: 'render';
  commands: RenderCommand[];
}

type WorkerMessage = WorkerInitMessage | WorkerRenderMessage;

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let config: WorkerInitMessage['config'] | null = null;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data;

  switch (type) {
    case 'init':
      handleInit(e.data);
      break;
    case 'render':
      handleRender(e.data);
      break;
  }
};

function handleInit(message: WorkerInitMessage) {
  canvas = message.canvas;
  config = message.config;

  ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context in worker');

  // Set canvas size accounting for device pixel ratio
  canvas.width = config.width * config.dpr;
  canvas.height = config.height * config.dpr;

  // Scale context to account for device pixel ratio
  ctx.scale(config.dpr, config.dpr);
}

function handleRender(message: WorkerRenderMessage) {
  if (!ctx || !canvas || !config) return;

  // Store ctx in a const to ensure TypeScript knows it's not null
  const context = ctx;
  
  // Clear canvas
  context.clearRect(0, 0, config.width * config.dpr, config.height * config.dpr);

  // Execute render commands
  for (const command of message.commands) {
    switch (command.type) {
      case 'path':
        drawPath(command);
        break;
      case 'circle':
        drawCircle(command);
        break;
      case 'text':
        drawText(command);
        break;
    }
  }
}

function drawPath(command: Extract<RenderCommand, { type: 'path' }>) {
  if (!ctx) return;
  const { points, strokeStyle, lineWidth } = command;
  
  // Store ctx in a const to ensure TypeScript knows it's not null within the forEach
  const context = ctx;
  
  context.beginPath();
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;

  points.forEach((point, i) => {
    if (i === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });

  context.stroke();
}

function drawCircle(command: Extract<RenderCommand, { type: 'circle' }>) {
  if (!ctx) return;
  const { x, y, radius, fillStyle } = command;
  
  // Store ctx in a const to ensure TypeScript knows it's not null
  const context = ctx;
  
  context.beginPath();
  context.fillStyle = fillStyle;
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function drawText(command: Extract<RenderCommand, { type: 'text' }>) {
  if (!ctx) return;
  const { text, x, y, font, fillStyle } = command;
  
  // Store ctx in a const to ensure TypeScript knows it's not null
  const context = ctx;
  
  context.font = font;
  context.fillStyle = fillStyle;
  context.fillText(text, x, y);
}