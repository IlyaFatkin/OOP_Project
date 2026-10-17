export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = 'bresenham' | 'wu';

export type Point = { x: number; y: number };

export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function hexToRGBA(hex: string, alpha = 255): RGBA {
  hex = hex.replace('#', '');

  let r = 0;
  let g = 0;
  let b = 0;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }

  return {
    r: clampByte(r),
    g: clampByte(g),
    b: clampByte(b),
    a: clampByte(alpha),
  };
}

export class RasterRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData | null = null;
  private buf!: Uint8ClampedArray;

  width = 0;
  height = 0;
  dpr = 1;

  private canvas: HTMLCanvasElement;
  private _onWindowResize: () => void;
  private lineAlg: LineAlg = 'bresenham';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2D context');
    }

    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this._onWindowResize = () => this.resize();
    window.addEventListener('resize', this._onWindowResize);

    this.resize();
  }

  dispose() {
    window.removeEventListener('resize', this._onWindowResize);
  }

  setLineAlgorithm(a: LineAlg) {
    this.lineAlg = a;
  }

  getLineAlgorithm(): LineAlg {
    return this.lineAlg;
  }

  private idx(x: number, y: number): number {
    return (y * this.width + x) * 4;
  }

  private inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  setPixel(x: number, y: number, color: RGBA) {
    x = Math.round(x);
    y = Math.round(y);

    if (!this.inside(x, y)) return;

    const i = this.idx(x, y);

    this.buf[i] = clampByte(color.r);
    this.buf[i + 1] = clampByte(color.g);
    this.buf[i + 2] = clampByte(color.b);
    this.buf[i + 3] = clampByte(color.a);
  }

  private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1) {
    x = Math.round(x);
    y = Math.round(y);

    if (!this.inside(x, y)) return;

    const i = this.idx(x, y);

    const srcA = Math.max(0, Math.min(1, (color.a / 255) * alphaFactor));
    const dstA = this.buf[i + 3] / 255;

    const outA = srcA + dstA * (1 - srcA);

    if (outA <= 0) {
      this.buf[i] = 0;
      this.buf[i + 1] = 0;
      this.buf[i + 2] = 0;
      this.buf[i + 3] = 0;
      return;
    }

    const dstR = this.buf[i] / 255;
    const dstG = this.buf[i + 1] / 255;
    const dstB = this.buf[i + 2] / 255;

    const srcR = color.r / 255;
    const srcG = color.g / 255;
    const srcB = color.b / 255;

    const outR = (srcR * srcA + dstR * dstA * (1 - srcA)) / outA;
    const outG = (srcG * srcA + dstG * dstA * (1 - srcA)) / outA;
    const outB = (srcB * srcA + dstB * dstA * (1 - srcA)) / outA;

    this.buf[i] = clampByte(outR * 255);
    this.buf[i + 1] = clampByte(outG * 255);
    this.buf[i + 2] = clampByte(outB * 255);
    this.buf[i + 3] = clampByte(outA * 255);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();

    this.dpr = window.devicePixelRatio || 1;

    this.width = Math.max(1, Math.floor(rect.width * this.dpr));
    this.height = Math.max(1, Math.floor(rect.height * this.dpr));

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.ctx.imageSmoothingEnabled = false;

    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.buf = this.imageData.data;
  }

  beginFrame(clear = true) {
    if (clear) {
      this.buf.fill(0);
    }
  }

  commit() {
    if (!this.imageData) return;
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
    if (this.lineAlg === 'wu') {
      this.drawLineWu(x0, y0, x1, y1, color);
    } else {
      this.drawLineBrassenham(
        Math.round(x0),
        Math.round(y0),
        Math.round(x1),
        Math.round(y1),
        color
      );
    }
  }

  drawLineBrassenham(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: RGBA
  ) {
    let dx = Math.abs(x1 - x0);
    let dy = -Math.abs(y1 - y0);

    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    let err = dx + dy;

    while (true) {
      this.blendPixel(x0, y0, color);

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;

      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }

      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  drawLineWu(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: RGBA
  ) {
    const ipart = (x: number) => Math.floor(x);
    const round = (x: number) => Math.round(x);
    const fpart = (x: number) => x - Math.floor(x);
    const rfpart = (x: number) => 1 - fpart(x);

    let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);

    if (steep) {
      [x0, y0] = [y0, x0];
      [x1, y1] = [y1, x1];
    }

    if (x0 > x1) {
      [x0, x1] = [x1, x0];
      [y0, y1] = [y1, y0];
    }

    const dx = x1 - x0;
    const dy = y1 - y0;

    if (dx === 0) {
      this.drawLineBrassenham(
        Math.round(x0),
        Math.round(y0),
        Math.round(x1),
        Math.round(y1),
        color
      );
      return;
    }

    const gradient = dy / dx;

    let xEnd = round(x0);
    let yEnd = y0 + gradient * (xEnd - x0);
    let xGap = rfpart(x0 + 0.5);
    const xPixel1 = xEnd;
    const yPixel1 = ipart(yEnd);

    if (steep) {
      this.blendPixel(yPixel1, xPixel1, color, rfpart(yEnd) * xGap);
      this.blendPixel(yPixel1 + 1, xPixel1, color, fpart(yEnd) * xGap);
    } else {
      this.blendPixel(xPixel1, yPixel1, color, rfpart(yEnd) * xGap);
      this.blendPixel(xPixel1, yPixel1 + 1, color, fpart(yEnd) * xGap);
    }

    let intery = yEnd + gradient;

    xEnd = round(x1);
    yEnd = y1 + gradient * (xEnd - x1);
    xGap = fpart(x1 + 0.5);

    const xPixel2 = xEnd;
    const yPixel2 = ipart(yEnd);

    for (let x = xPixel1 + 1; x <= xPixel2 - 1; x++) {
      const y = ipart(intery);

      if (steep) {
        this.blendPixel(y, x, color, rfpart(intery));
        this.blendPixel(y + 1, x, color, fpart(intery));
      } else {
        this.blendPixel(x, y, color, rfpart(intery));
        this.blendPixel(x, y + 1, color, fpart(intery));
      }

      intery += gradient;
    }

    if (steep) {
      this.blendPixel(yPixel2, xPixel2, color, rfpart(yEnd) * xGap);
      this.blendPixel(yPixel2 + 1, xPixel2, color, fpart(yEnd) * xGap);
    } else {
      this.blendPixel(xPixel2, yPixel2, color, rfpart(yEnd) * xGap);
      this.blendPixel(xPixel2, yPixel2 + 1, color, fpart(yEnd) * xGap);
    }
  }

  private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
    y = Math.round(y);

    if (y < 0 || y >= this.height) return;

    let start = Math.ceil(Math.min(x0, x1));
    let end = Math.floor(Math.max(x0, x1));

    start = Math.max(0, start);
    end = Math.min(this.width - 1, end);

    for (let x = start; x <= end; x++) {
      this.blendPixel(x, y, color);
    }
  }

  fillCircle(cx: number, cy: number, r: number, color: RGBA) {
    if (r <= 0) return;

    const minY = Math.floor(cy - r);
    const maxY = Math.ceil(cy + r);

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;
      const inside = r * r - dy * dy;

      if (inside < 0) continue;

      const dx = Math.sqrt(inside);

      this.drawHSpan(y, cx - dx, cx + dx, color);
    }
  }

  fillPolygon(points: Point[], color: RGBA) {
    if (points.length < 3) return;

    const ys = points.map((p) => p.y);
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));

    for (let y = minY; y <= maxY; y++) {
      const scanY = y + 0.5;
      const intersections: number[] = [];

      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];

        if (
          (p1.y <= scanY && p2.y > scanY) ||
          (p2.y <= scanY && p1.y > scanY)
        ) {
          const t = (scanY - p1.y) / (p2.y - p1.y);
          const x = p1.x + t * (p2.x - p1.x);
          intersections.push(x);
        }
      }

      intersections.sort((a, b) => a - b);

      for (let i = 0; i + 1 < intersections.length; i += 2) {
        this.drawHSpan(y, intersections[i], intersections[i + 1], color);
      }
    }
  }

  strokeLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: RGBA,
    width = 1
  ) {
    if (width <= 0) return;

    if (width <= 1) {
      this.drawLine(x0, y0, x1, y1, color);
      return;
    }

    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);

    if (len === 0) {
      this.fillCircle(x0, y0, width / 2, color);
      return;
    }

    const half = width / 2;

    const nx = -dy / len;
    const ny = dx / len;

    const p1 = {
      x: x0 + nx * half,
      y: y0 + ny * half,
    };

    const p2 = {
      x: x1 + nx * half,
      y: y1 + ny * half,
    };

    const p3 = {
      x: x1 - nx * half,
      y: y1 - ny * half,
    };

    const p4 = {
      x: x0 - nx * half,
      y: y0 - ny * half,
    };

    this.fillPolygon([p1, p2, p3, p4], color);

    this.fillCircle(x0, y0, half, color);
    this.fillCircle(x1, y1, half, color);
  }

  strokePolyline(points: Point[], color: RGBA, width = 1) {
    if (points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];

      this.strokeLine(a.x, a.y, b.x, b.y, color, width);
    }

    if (width > 1) {
      const r = width / 2;

      for (const p of points) {
        this.fillCircle(p.x, p.y, r, color);
      }
    }
  }

  strokePolygon(points: Point[], color: RGBA, width = 1) {
    if (points.length < 2) return;

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];

      this.strokeLine(a.x, a.y, b.x, b.y, color, width);
    }

    if (width > 1) {
      const r = width / 2;

      for (const p of points) {
        this.fillCircle(p.x, p.y, r, color);
      }
    }
  }
}