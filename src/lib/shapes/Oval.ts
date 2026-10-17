import { Shape } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';

type Point = { x: number; y: number };

export class Oval extends Shape {
  rx: number;
  ry: number;

  constructor(rx: number, ry: number) {
    super();

    this.rx = rx;
    this.ry = ry;
  }

  private getLocalPoints(steps = 72): Point[] {
    const pts: Point[] = [];

    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;

      pts.push({
        x: this.rx * Math.cos(t),
        y: this.ry * Math.sin(t),
      });
    }

    return pts;
  }

  drawRaster(r: RasterRenderer) {
    const pts = this.getLocalPoints().map((p) =>
      this.transformPointToDevice(p.x, p.y)
    );

    r.fillPolygon(pts, this.fillStyle);

    if (this.strokeWidth > 0) {
      r.strokePolygon(pts, this.strokeStyle, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);

    if (this.rx === 0 || this.ry === 0) return false;

    const nx = p.x / this.rx;
    const ny = p.y / this.ry;

    return nx * nx + ny * ny <= 1;
  }

  getLocalBounds() {
    return {
      minX: -this.rx,
      minY: -this.ry,
      maxX: this.rx,
      maxY: this.ry,
    };
  }

  getBounds() {
    const pts = this.getLocalPoints().map((p) =>
      this.transformPointToDevice(p.x, p.y)
    );

    return {
      minX: Math.min(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxX: Math.max(...pts.map((p) => p.x)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }

  getControlPoints(): Point[] {
    return [
      { x: this.rx, y: 0 },
      { x: 0, y: this.ry },
      { x: -this.rx, y: 0 },
      { x: 0, y: -this.ry },
    ];
  }

  setControlPoint(i: number, localPt: Point): void;
  setControlPoint(i: number, x: number, y: number): void;
  setControlPoint(i: number, arg1: Point | number, arg2?: number): void {
    const pt =
      typeof arg1 === 'number'
        ? { x: arg1, y: arg2 ?? 0 }
        : { x: arg1.x, y: arg1.y };

    if (i === 0 || i === 2) {
      this.rx = Math.max(1, Math.abs(pt.x));
    }

    if (i === 1 || i === 3) {
      this.ry = Math.max(1, Math.abs(pt.y));
    }
  }

  toJSON() {
    return {
      type: 'oval',
      id: this.id,
      transform: this.transform,
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity,
      rx: this.rx,
      ry: this.ry,
    };
  }
}