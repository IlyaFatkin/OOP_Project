import { Shape } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';

export class CubicBezier extends Shape {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  steps: number;

  constructor(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    steps = 40
  ) {
    super();

    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
    this.steps = steps;
  }

  evalLocal(t: number): { x: number; y: number } {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x:
        mt3 * this.x0 +
        3 * mt2 * t * this.x1 +
        3 * mt * t2 * this.x2 +
        t3 * this.x3,
      y:
        mt3 * this.y0 +
        3 * mt2 * t * this.y1 +
        3 * mt * t2 * this.y2 +
        t3 * this.y3,
    };
  }

  flattenDevicePoints(): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];

    for (let i = 0; i <= this.steps; i++) {
      const p = this.evalLocal(i / this.steps);
      pts.push(this.transformPointToDevice(p.x, p.y));
    }

    return pts;
  }

  drawRaster(r: RasterRenderer) {
    r.strokePolyline(this.flattenDevicePoints(), this.strokeStyle, this.strokeWidth);
  }

  hitTest(px: number, py: number): boolean {
    const pts = this.flattenDevicePoints();
    const threshold = this.strokeWidth / 2 + 4;

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;

      if (lenSq === 0) continue;

      const t = Math.max(
        0,
        Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lenSq)
      );

      const cx = a.x + t * dx;
      const cy = a.y + t * dy;

      if (Math.hypot(px - cx, py - cy) <= threshold) {
        return true;
      }
    }

    return false;
  }

  getLocalBounds() {
    const pts = Array.from({ length: this.steps + 1 }, (_, i) =>
      this.evalLocal(i / this.steps)
    );

    return {
      minX: Math.min(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxX: Math.max(...pts.map((p) => p.x)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }

  getBounds() {
    const pts = this.flattenDevicePoints();

    return {
      minX: Math.min(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxX: Math.max(...pts.map((p) => p.x)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }

  getControlPoints() {
    return [
      { x: this.x0, y: this.y0 },
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
      { x: this.x3, y: this.y3 },
    ];
  }

  setControlPoint(i: number, localPt: { x: number; y: number }) {
    if (i === 0) {
      this.x0 = localPt.x;
      this.y0 = localPt.y;
    }

    if (i === 1) {
      this.x1 = localPt.x;
      this.y1 = localPt.y;
    }

    if (i === 2) {
      this.x2 = localPt.x;
      this.y2 = localPt.y;
    }

    if (i === 3) {
      this.x3 = localPt.x;
      this.y3 = localPt.y;
    }

    this.transform = { ...this.transform };
  }

  toJSON() {
    return {
      type: 'cubicBezier',
      id: this.id,
      transform: this.transform,
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity,
      x0: this.x0,
      y0: this.y0,
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      x3: this.x3,
      y3: this.y3,
      steps: this.steps,
    };
  }
}