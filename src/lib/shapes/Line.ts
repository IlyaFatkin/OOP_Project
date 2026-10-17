import { Shape } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';

type Point = { x: number; y: number };

export class Line extends Shape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    super();

    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  drawRaster(r: RasterRenderer) {
    const a = this.transformPointToDevice(this.x1, this.y1);
    const b = this.transformPointToDevice(this.x2, this.y2);

    r.strokeLine(a.x, a.y, b.x, b.y, this.strokeStyle, this.strokeWidth);
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);

    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      return Math.hypot(p.x - this.x1, p.y - this.y1) <= this.strokeWidth / 2 + 4;
    }

    const t = Math.max(
      0,
      Math.min(1, ((p.x - this.x1) * dx + (p.y - this.y1) * dy) / lenSq)
    );

    const cx = this.x1 + t * dx;
    const cy = this.y1 + t * dy;

    const dist = Math.hypot(p.x - cx, p.y - cy);

    return dist <= this.strokeWidth / 2 + 4;
  }

  getLocalBounds() {
    const pad = this.strokeWidth / 2;

    return {
      minX: Math.min(this.x1, this.x2) - pad,
      minY: Math.min(this.y1, this.y2) - pad,
      maxX: Math.max(this.x1, this.x2) + pad,
      maxY: Math.max(this.y1, this.y2) + pad,
    };
  }

  getBounds() {
    const a = this.transformPointToDevice(this.x1, this.y1);
    const b = this.transformPointToDevice(this.x2, this.y2);

    const pad = this.strokeWidth / 2;

    return {
      minX: Math.min(a.x, b.x) - pad,
      minY: Math.min(a.y, b.y) - pad,
      maxX: Math.max(a.x, b.x) + pad,
      maxY: Math.max(a.y, b.y) + pad,
    };
  }

  getControlPoints(): Point[] {
    return [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];
  }

  setControlPoint(i: number, localPt: Point): void;
  setControlPoint(i: number, x: number, y: number): void;
  setControlPoint(i: number, arg1: Point | number, arg2?: number): void {
    const pt =
      typeof arg1 === 'number'
        ? { x: arg1, y: arg2 ?? 0 }
        : { x: arg1.x, y: arg1.y };

    if (i === 0) {
      this.x1 = pt.x;
      this.y1 = pt.y;
    }

    if (i === 1) {
      this.x2 = pt.x;
      this.y2 = pt.y;
    }
  }

  toJSON() {
    return {
      type: 'line',
      id: this.id,
      transform: this.transform,
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity,
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
    };
  }
}