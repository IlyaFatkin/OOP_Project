import { Shape } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';

export type PathMode = 'polyline' | 'bezier' | 'catmull';
export type Point = { x: number; y: number };

type CubicSegment = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
};

export class PathBezier extends Shape {
  points: Point[];
  mode: PathMode;
  closed: boolean;
  steps: number;

  constructor(
    points: Point[] = [],
    mode: PathMode = 'polyline',
    closed = false,
    steps = 40
  ) {
    super();

    this.points = points.map((p) => ({ x: p.x, y: p.y }));
    this.mode = mode;
    this.closed = closed;
    this.steps = steps;
  }

  getControlPoints(): Point[] {
    return this.points.map((p) => ({ x: p.x, y: p.y }));
  }

  setControlPoint(index: number, localPt: Point): void;
  setControlPoint(index: number, x: number, y: number): void;
  setControlPoint(index: number, arg1: Point | number, arg2?: number): void {
    if (index < 0 || index >= this.points.length) return;

    if (typeof arg1 === 'number') {
      this.points[index] = {
        x: arg1,
        y: arg2 ?? this.points[index].y,
      };
    } else {
      this.points[index] = {
        x: arg1.x,
        y: arg1.y,
      };
    }
  }

  addPointLocal(localPt: Point, insertAtIndex?: number): void;
  addPointLocal(x: number, y: number, insertAtIndex?: number): void;
  addPointLocal(arg1: Point | number, arg2?: number, arg3?: number): void {
    const pt =
      typeof arg1 === 'number'
        ? { x: arg1, y: arg2 ?? 0 }
        : { x: arg1.x, y: arg1.y };

    const insertAtIndex = typeof arg1 === 'number' ? arg3 : arg2;

    if (
      insertAtIndex !== undefined &&
      insertAtIndex >= 0 &&
      insertAtIndex <= this.points.length
    ) {
      this.points.splice(insertAtIndex, 0, pt);
    } else {
      this.points.push(pt);
    }
  }

  removePoint(index: number): void {
    if (index >= 0 && index < this.points.length) {
      this.points.splice(index, 1);
    }
  }

  private evalCubic(seg: CubicSegment, t: number): Point {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x:
        mt3 * seg.x0 +
        3 * mt2 * t * seg.x1 +
        3 * mt * t2 * seg.x2 +
        t3 * seg.x3,
      y:
        mt3 * seg.y0 +
        3 * mt2 * t * seg.y1 +
        3 * mt * t2 * seg.y2 +
        t3 * seg.y3,
    };
  }

  catmullToBeziers(): CubicSegment[] {
    const pts = this.points;
    const n = pts.length;

    if (n < 2) return [];

    const beziers: CubicSegment[] = [];

    const get = (i: number): Point => {
      if (this.closed) {
        return pts[(i + n) % n];
      }

      if (i < 0) return pts[0];
      if (i >= n) return pts[n - 1];

      return pts[i];
    };

    const segmentCount = this.closed ? n : n - 1;

    for (let i = 0; i < segmentCount; i++) {
      const p0 = get(i - 1);
      const p1 = get(i);
      const p2 = get(i + 1);
      const p3 = get(i + 2);

      beziers.push({
        x0: p1.x,
        y0: p1.y,
        x1: p1.x + (p2.x - p0.x) / 6,
        y1: p1.y + (p2.y - p0.y) / 6,
        x2: p2.x - (p3.x - p1.x) / 6,
        y2: p2.y - (p3.y - p1.y) / 6,
        x3: p2.x,
        y3: p2.y,
      });
    }

    return beziers;
  }

  private getApproxLocalPoints(): Point[] {
    if (this.points.length === 0) return [];

    if (this.mode === 'polyline') {
      return this.points.map((p) => ({ x: p.x, y: p.y }));
    }

    if (this.mode === 'bezier') {
      const result: Point[] = [];
      const pts = this.points;

      for (let i = 0; i + 3 < pts.length; i += 3) {
        const seg: CubicSegment = {
          x0: pts[i].x,
          y0: pts[i].y,
          x1: pts[i + 1].x,
          y1: pts[i + 1].y,
          x2: pts[i + 2].x,
          y2: pts[i + 2].y,
          x3: pts[i + 3].x,
          y3: pts[i + 3].y,
        };

        for (let s = 0; s <= this.steps; s++) {
          if (result.length > 0 && s === 0) continue;
          result.push(this.evalCubic(seg, s / this.steps));
        }
      }

      return result;
    }

    if (this.mode === 'catmull') {
      const result: Point[] = [];
      const beziers = this.catmullToBeziers();

      for (const seg of beziers) {
        for (let s = 0; s <= this.steps; s++) {
          if (result.length > 0 && s === 0) continue;
          result.push(this.evalCubic(seg, s / this.steps));
        }
      }

      return result;
    }

    return [];
  }

  flattenDevicePoints(): Point[] {
    return this.getApproxLocalPoints().map((p) =>
      this.transformPointToDevice(p.x, p.y)
    );
  }

  drawRaster(r: RasterRenderer) {
    const pts = this.flattenDevicePoints();

    if (pts.length < 2) return;

    if (this.closed) {
      r.strokePolygon(pts, this.strokeStyle, this.strokeWidth);
    } else {
      r.strokePolyline(pts, this.strokeStyle, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const pts = this.flattenDevicePoints();

    if (pts.length < 2) return false;

    const threshold = this.strokeWidth / 2 + 4;
    const count = this.closed ? pts.length : pts.length - 1;

    for (let i = 0; i < count; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];

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
    const pts = this.getApproxLocalPoints();

    if (pts.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    return {
      minX: Math.min(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxX: Math.max(...pts.map((p) => p.x)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }

  getBounds() {
    const pts = this.flattenDevicePoints();

    if (pts.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    return {
      minX: Math.min(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxX: Math.max(...pts.map((p) => p.x)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }

  toJSON() {
    return {
      type: 'pathBezier',
      id: this.id,
      transform: this.transform,
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity,
      points: this.points.map((p) => ({ x: p.x, y: p.y })),
      mode: this.mode,
      closed: this.closed,
      steps: this.steps,
    };
  }
}