import { Shape } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';

type Point = { x: number; y: number };

export class Triangle extends Shape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;

  constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    super();

    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
  }

  drawRaster(r: RasterRenderer) {
    const pts = [
      this.transformPointToDevice(this.x1, this.y1),
      this.transformPointToDevice(this.x2, this.y2),
      this.transformPointToDevice(this.x3, this.y3),
    ];

    r.fillPolygon(pts, this.fillStyle);

    if (this.strokeWidth > 0) {
      r.strokePolygon(pts, this.strokeStyle, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);

    const sign = (p1: Point, p2: Point, p3: Point) =>
      (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);

    const a = { x: this.x1, y: this.y1 };
    const b = { x: this.x2, y: this.y2 };
    const c = { x: this.x3, y: this.y3 };

    const d1 = sign(p, a, b);
    const d2 = sign(p, b, c);
    const d3 = sign(p, c, a);

    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

    return !(hasNeg && hasPos);
  }

  getLocalBounds() {
    const xs = [this.x1, this.x2, this.x3];
    const ys = [this.y1, this.y2, this.y3];

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  }

  getBounds() {
    const pts = [
      this.transformPointToDevice(this.x1, this.y1),
      this.transformPointToDevice(this.x2, this.y2),
      this.transformPointToDevice(this.x3, this.y3),
    ];

    return {
      minX: Math.min(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxX: Math.max(...pts.map((p) => p.x)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }

  getControlPoints(): Point[] {
    return [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
      { x: this.x3, y: this.y3 },
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

    if (i === 2) {
      this.x3 = pt.x;
      this.y3 = pt.y;
    }
  }

  toJSON() {
    return {
      type: 'triangle',
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
      x3: this.x3,
      y3: this.y3,
    };
  }
}