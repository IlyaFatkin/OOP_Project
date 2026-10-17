import { Shape } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';

type Point = { x: number; y: number };

export class Rect extends Shape {
  w: number;
  h: number;

  constructor(w: number, h: number) {
    super();

    this.w = w;
    this.h = h;
  }

  private getLocalCorners(): Point[] {
    const hw = this.w / 2;
    const hh = this.h / 2;

    return [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];
  }

  drawRaster(r: RasterRenderer) {
    const pts = this.getLocalCorners().map((p) =>
      this.transformPointToDevice(p.x, p.y)
    );

    r.fillPolygon(pts, this.fillStyle);

    if (this.strokeWidth > 0) {
      r.strokePolygon(pts, this.strokeStyle, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);

    return (
      p.x >= -this.w / 2 &&
      p.x <= this.w / 2 &&
      p.y >= -this.h / 2 &&
      p.y <= this.h / 2
    );
  }

  getLocalBounds() {
    return {
      minX: -this.w / 2,
      minY: -this.h / 2,
      maxX: this.w / 2,
      maxY: this.h / 2,
    };
  }

  getBounds() {
    const pts = this.getLocalCorners().map((p) =>
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
    return this.getLocalCorners();
  }

  setControlPoint(i: number, localPt: Point): void;
  setControlPoint(i: number, x: number, y: number): void;
  setControlPoint(_i: number, arg1: Point | number, arg2?: number): void {
    const pt =
      typeof arg1 === 'number'
        ? { x: arg1, y: arg2 ?? 0 }
        : { x: arg1.x, y: arg1.y };

    this.w = Math.max(1, Math.abs(pt.x) * 2);
    this.h = Math.max(1, Math.abs(pt.y) * 2);
  }

  toJSON() {
    return {
      type: 'rect',
      id: this.id,
      transform: this.transform,
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity,
      w: this.w,
      h: this.h,
    };
  }
}