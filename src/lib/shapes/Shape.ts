import type { RasterRenderer } from '../raster/RasterRenderer';

export type Transform = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

let ID = 0;

export abstract class Shape {
  id: string;

  transform: Transform = {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };

  fillStyle = { r: 255, g: 0, b: 0, a: 255 };
  fillOpacity = 1;

  strokeStyle = { r: 0, g: 0, b: 0, a: 255 };
  strokeWidth = 1;
  strokeOpacity = 1;

  constructor() {
    this.id = 'shape_' + ID++;
  }

  getLocalToDeviceMatrix() {
    const { x, y, rotation, scaleX, scaleY } = this.transform;

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return [
      cos * scaleX,
      -sin * scaleY,
      x,

      sin * scaleX,
      cos * scaleY,
      y,
    ];
  }

  getDeviceToLocalMatrix() {
    const m = this.getLocalToDeviceMatrix();

    const a = m[0];
    const b = m[1];
    const c = m[2];

    const d = m[3];
    const e = m[4];
    const f = m[5];

    const det = a * e - b * d;

    if (Math.abs(det) < 0.000001) {
      return [1, 0, 0, 0, 1, 0];
    }

    const invDet = 1 / det;

    return [
      e * invDet,
      -b * invDet,
      (b * f - e * c) * invDet,

      -d * invDet,
      a * invDet,
      (d * c - a * f) * invDet,
    ];
  }

  transformPointToDevice(px: number, py: number) {
    const m = this.getLocalToDeviceMatrix();

    return {
      x: m[0] * px + m[1] * py + m[2],
      y: m[3] * px + m[4] * py + m[5],
    };
  }

  transformPointToLocal(px: number, py: number) {
    const m = this.getDeviceToLocalMatrix();

    return {
      x: m[0] * px + m[1] * py + m[2],
      y: m[3] * px + m[4] * py + m[5],
    };
  }

  getCenter() {
    const b = this.getBounds();

    return {
      x: (b.minX + b.maxX) / 2,
      y: (b.minY + b.maxY) / 2,
    };
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number) {
    const localBounds = this.getLocalBounds();

    const oldW = localBounds.maxX - localBounds.minX;
    const oldH = localBounds.maxY - localBounds.minY;

    const newW = maxX - minX;
    const newH = maxY - minY;

    if (oldW > 0) this.transform.scaleX *= newW / oldW;
    if (oldH > 0) this.transform.scaleY *= newH / oldH;

    this.transform.x = (minX + maxX) / 2;
    this.transform.y = (minY + maxY) / 2;
  }

  setBounds(minX: number, minY: number, maxX: number, maxY: number) {
    this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
  }

  clone(): this {
    return Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      JSON.parse(JSON.stringify(this))
    );
  }

  abstract drawRaster(r: RasterRenderer): void;
  abstract hitTest(px: number, py: number): boolean;
  abstract getBounds(): Bounds;
  abstract getLocalBounds(): Bounds;
  abstract toJSON(): any;
}