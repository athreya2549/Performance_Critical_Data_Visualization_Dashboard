export interface CanvasRendererConfig {
  width: number;
  height: number;
  devicePixelRatio?: number;
  useOffscreen?: boolean;
}

interface RenderContext {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

export class CanvasRenderer {
  private mainCanvas: HTMLCanvasElement;
  private offscreenCanvas: OffscreenCanvas | null = null;
  private worker: Worker | null = null;
  private renderContext: RenderContext | null = null;

  constructor(canvas: HTMLCanvasElement, config: CanvasRendererConfig) {
    this.mainCanvas = canvas;
    
    if (config.useOffscreen && 'transferControlToOffscreen' in canvas) {
      this.initOffscreenRenderer(config);
    } else {
      this.initMainThreadRenderer(config);
    }
  }

  private initOffscreenRenderer(config: CanvasRendererConfig) {
    if (!('transferControlToOffscreen' in this.mainCanvas)) {
      console.warn('OffscreenCanvas not supported, falling back to main thread rendering');
      this.initMainThreadRenderer(config);
      return;
    }

    // Create offscreen canvas and transfer control
    this.offscreenCanvas = this.mainCanvas.transferControlToOffscreen();
    
    // Initialize rendering worker
    this.worker = new Worker(
      new URL('../workers/canvasWorker.ts', import.meta.url)
    );

    // Send initial configuration to worker
    this.worker.postMessage({
      type: 'init',
      canvas: this.offscreenCanvas,
      config: {
        width: config.width,
        height: config.height,
        dpr: config.devicePixelRatio || window.devicePixelRatio
      }
    }, [this.offscreenCanvas]);
  }

  private initMainThreadRenderer(config: CanvasRendererConfig) {
    const ctx = this.mainCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');

    const dpr = config.devicePixelRatio || window.devicePixelRatio;
    
    // Set canvas size accounting for device pixel ratio
    this.mainCanvas.width = config.width * dpr;
    this.mainCanvas.height = config.height * dpr;
    this.mainCanvas.style.width = `${config.width}px`;
    this.mainCanvas.style.height = `${config.height}px`;

    // Scale context to account for device pixel ratio
    ctx.scale(dpr, dpr);

    this.renderContext = {
      canvas: this.mainCanvas,
      ctx,
      width: config.width,
      height: config.height,
      dpr
    };
  }

  public render(renderCommands: RenderCommand[]) {
    if (this.worker) {
      // Send render commands to worker
      this.worker.postMessage({
        type: 'render',
        commands: renderCommands
      });
    } else if (this.renderContext) {
      // Execute render commands on main thread
      this.executeRenderCommands(this.renderContext, renderCommands);
    }
  }

  private executeRenderCommands(context: RenderContext, commands: RenderCommand[]) {
    const { ctx } = context;
    
    // Clear canvas
    ctx.clearRect(0, 0, context.width * context.dpr, context.height * context.dpr);

    for (const command of commands) {
      switch (command.type) {
        case 'path':
          this.drawPath(ctx, command);
          break;
        case 'circle':
          this.drawCircle(ctx, command);
          break;
        case 'text':
          this.drawText(ctx, command);
          break;
      }
    }
  }

  private drawPath(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    command: PathCommand
  ) {
    const { points, strokeStyle, lineWidth } = command;
    
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;

    points.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });

    ctx.stroke();
  }

  private drawCircle(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    command: CircleCommand
  ) {
    const { x, y, radius, fillStyle } = command;
    
    ctx.beginPath();
    ctx.fillStyle = fillStyle;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawText(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    command: TextCommand
  ) {
    const { text, x, y, font, fillStyle } = command;
    
    ctx.font = font;
    ctx.fillStyle = fillStyle;
    ctx.fillText(text, x, y);
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Command types for rendering
export interface Point {
  x: number;
  y: number;
}

interface PathCommand {
  type: 'path';
  points: Point[];
  strokeStyle: string;
  lineWidth: number;
}

interface CircleCommand {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
  fillStyle: string;
}

interface TextCommand {
  type: 'text';
  text: string;
  x: number;
  y: number;
  font: string;
  fillStyle: string;
}

export type RenderCommand = PathCommand | CircleCommand | TextCommand;
