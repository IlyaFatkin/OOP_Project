import { useEffect, useRef, useState } from 'react';
import { RasterRenderer, type RGBA } from '../lib/raster/RasterRenderer';
import { Rect } from '../lib/shapes/Rect';
import { Line } from '../lib/shapes/Line';
import { Oval } from '../lib/shapes/Oval';
import { Triangle } from '../lib/shapes/Triangle';
import { QuadraticBezier } from '../lib/shapes/QuadraticBezier';
import { CubicBezier } from '../lib/shapes/CubicBezier';
import { PathBezier } from '../lib/shapes/PathBezier';

type Point = { x: number; y: number };
type Tool = 'select' | 'rect' | 'oval' | 'line' | 'triangle' | 'quadratic' | 'cubic' | 'path';


const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 700;

const white: RGBA = { r: 255, g: 255, b: 255, a: 255 };
const black: RGBA = { r: 0, g: 0, b: 0, a: 255 };
const orange: RGBA = { r: 255, g: 140, b: 0, a: 255 };
const selectBlue: RGBA = { r: 59, g: 130, b: 246, a: 255 };
const handleRed: RGBA = { r: 239, g: 68, b: 68, a: 255 };

function shapeFromJSON(data: any): any {
  let shape: any = null;

  if (data.type === 'rect') {
    shape = new Rect(data.w, data.h);
  } else if (data.type === 'line') {
    shape = new Line(data.x1, data.y1, data.x2, data.y2);
  } else if (data.type === 'oval') {
    shape = new Oval(data.rx, data.ry);
  } else if (data.type === 'triangle') {
    shape = new Triangle(data.x1, data.y1, data.x2, data.y2, data.x3, data.y3);
  } else if (data.type === 'quadraticBezier') {
    shape = new QuadraticBezier(data.x0, data.y0, data.x1, data.y1, data.x2, data.y2, data.steps ?? 40);
  } else if (data.type === 'cubicBezier') {
    shape = new CubicBezier(data.x0, data.y0, data.x1, data.y1, data.x2, data.y2, data.x3, data.y3, data.steps ?? 40);
  } else if (data.type === 'pathBezier') {
    shape = new PathBezier(data.points ?? [], data.mode ?? 'polyline', data.closed ?? false, data.steps ?? 40);
  }

  if (shape && data.transform) {
    shape.transform = data.transform;
  }
  if (shape && data.fillStyle) {
    shape.fillStyle = data.fillStyle;
  }
  if (shape && data.strokeStyle) {
    shape.strokeStyle = data.strokeStyle;
  }
  if (shape && data.strokeWidth !== undefined) {
    shape.strokeWidth = data.strokeWidth;
  }
  if (shape && data.id) {
    shape.id = data.id;
  }

  return shape;
}

function serializeShape(shape: any): any {
  const base = shape.toJSON?.() ?? {};
  return {
    ...base,
    id: shape.id,
    transform: shape.transform,
    fillStyle: shape.fillStyle,
    strokeStyle: shape.strokeStyle,
    strokeWidth: shape.strokeWidth,
  };
}

function createDemoShapes(): any[] {
  const rect = new Rect(140, 100);
  rect.transform = { x: 250, y: 200, rotation: 0, scaleX: 1, scaleY: 1 };
  rect.fillStyle = { r: 255, g: 150, b: 150, a: 255 };
  rect.strokeStyle = black;
  rect.strokeWidth = 2;

  const oval = new Oval(70, 50);
  oval.transform = { x: 500, y: 200, rotation: 0, scaleX: 1, scaleY: 1 };
  oval.fillStyle = { r: 100, g: 200, b: 100, a: 255 };
  oval.strokeStyle = black;
  oval.strokeWidth = 2;

  const line = new Line(-100, 0, 100, 0);
  line.transform = { x: 750, y: 200, rotation: 0.3, scaleX: 1, scaleY: 1 };
  line.strokeStyle = { r: 0, g: 200, b: 0, a: 255 };
  line.strokeWidth = 6;

  const triangle = new Triangle(-70, 60, 70, 60, 0, -70);
  triangle.transform = { x: 1000, y: 200, rotation: 0, scaleX: 1, scaleY: 1 };
  triangle.fillStyle = { r: 255, g: 200, b: 0, a: 255 };
  triangle.strokeStyle = black;
  triangle.strokeWidth = 2;

  const quadPoints = [
    { x: -100, y: 0 },
    { x: 0, y: -120 },
    { x: 100, y: 0 }
  ];
  const quad = new PathBezier(quadPoints, 'catmull', false, 40);
  quad.transform = { x: 250, y: 450, rotation: 0, scaleX: 1, scaleY: 1 };
  quad.strokeStyle = { r: 200, g: 0, b: 200, a: 255 };
  quad.strokeWidth = 3;

  const cubicPoints = [
    { x: -120, y: 0 },
    { x: -50, y: -120 },
    { x: 50, y: 120 },
    { x: 120, y: 0 }
  ];
  const cubic = new PathBezier(cubicPoints, 'catmull', false, 40);
  cubic.transform = { x: 600, y: 450, rotation: 0, scaleX: 1, scaleY: 1 };
  cubic.strokeStyle = { r: 0, g: 80, b: 220, a: 255 };
  cubic.strokeWidth = 3;

  const path = new PathBezier(
    [{ x: 0, y: -55 }, { x: 50, y: -20 }, { x: 60, y: 25 }, { x: 20, y: 60 }, { x: -40, y: 40 }, { x: -60, y: -20 }],
    'catmull', true
  );
  path.transform = { x: 1000, y: 450, rotation: 0, scaleX: 1, scaleY: 1 };
  path.strokeStyle = { r: 255, g: 100, b: 0, a: 255 };
  path.strokeWidth = 3;

  return [rect, oval, line, triangle, quad, cubic, path];
}

type CanvasSceneProps = {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  saveSignal: number;
  onSaveComplete: (shapes: any[], lineAlg: string) => void;
  initialShapes?: any[] | null;
  onSelectionChange?: (shape: any | null) => void;
};

export default function CanvasScene({ 
  tool, 
  onToolChange, 
  saveSignal, 
  onSaveComplete, 
  initialShapes,
  onSelectionChange
}: CanvasSceneProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  const shapesRef = useRef<any[]>([]);
  const selectedShapeRef = useRef<any | null>(null);
  const hoverShapeRef = useRef<any | null>(null);
  const dragRef = useRef<any>(null);
  const zoomRef = useRef(1);
  const [, forceUpdate] = useState({});
  const [lineAlg, setLineAlg] = useState('bresenham');
  const saveHandledRef = useRef(0);

  const updateSelection = (shape: any | null) => {
    selectedShapeRef.current = shape;
    if (onSelectionChange) onSelectionChange(shape);
  };

  useEffect(() => {
    if (initialShapes && initialShapes.length > 0) {
      const restored = initialShapes
        .map((item: any) => shapeFromJSON(item))
        .filter(Boolean);
      if (restored.length > 0) {
        shapesRef.current = restored;
      } else {
        shapesRef.current = createDemoShapes();
      }
    } else {
      shapesRef.current = createDemoShapes();
    }
  }, [initialShapes]);

  useEffect(() => {
    if (saveSignal > 0 && saveHandledRef.current !== saveSignal) {
      saveHandledRef.current = saveSignal;
      const shapesData = shapesRef.current.map(shape => serializeShape(shape));
      onSaveComplete(shapesData, lineAlg);
    }
  }, [saveSignal, lineAlg, onSaveComplete]);

  useEffect(() => {
    const r = rendererRef.current;
    if (r) {
      r.setLineAlgorithm(lineAlg as any);
    }
  }, [lineAlg]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const findShape = (p: Point): any | null => {
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      if (shapesRef.current[i].hitTest(p.x, p.y)) return shapesRef.current[i];
    }
    return null;
  };

  const findControlPoint = (p: Point) => {
    const r = rendererRef.current;
    if (!r) return null;
    const threshold = 10 * r.dpr;
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];
      if (!shape.getControlPoints || !shape.setControlPoint) continue;
      const points = shape.getControlPoints();
      for (let j = 0; j < points.length; j++) {
        const device = shape.transformPointToDevice(points[j].x, points[j].y);
        if (Math.hypot(p.x - device.x, p.y - device.y) <= threshold) {
          return { shape, index: j };
        }
      }
    }
    return null;
  };

  const findResizeHandle = (p: Point) => {
    const r = rendererRef.current;
    const selected = selectedShapeRef.current;
    if (!r || !selected) return null;
    const b = selected.getBounds();
    const handles = [
      { x: b.minX, y: b.minY, opp: { x: b.maxX, y: b.maxY } },
      { x: b.maxX, y: b.minY, opp: { x: b.minX, y: b.maxY } },
      { x: b.maxX, y: b.maxY, opp: { x: b.minX, y: b.minY } },
      { x: b.minX, y: b.maxY, opp: { x: b.maxX, y: b.minY } },
    ];
    for (const h of handles) {
      if (Math.hypot(p.x - h.x, p.y - h.y) <= 11 * r.dpr) {
        return { shape: selected, opposite: h.opp };
      }
    }
    return null;
  };

  const findRotateHandle = (p: Point) => {
    const r = rendererRef.current;
    const selected = selectedShapeRef.current;
    if (!r || !selected) return null;
    const b = selected.getBounds();
    const center = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
    const handle = { x: center.x, y: b.minY - 38 };
    if (Math.hypot(p.x - handle.x, p.y - handle.y) > 13 * r.dpr) return null;
    return {
      shape: selected,
      center,
      startAngle: Math.atan2(p.y - center.y, p.x - center.x),
      startRotation: selected.transform.rotation,
    };
  };

  const resizeShape = (shape: any, opposite: Point, current: Point) => {
    const minSize = 20;
    let minX = Math.min(opposite.x, current.x);
    let maxX = Math.max(opposite.x, current.x);
    let minY = Math.min(opposite.y, current.y);
    let maxY = Math.max(opposite.y, current.y);
    
    if (maxX - minX < minSize) {
      const mid = (minX + maxX) / 2;
      minX = mid - minSize / 2;
      maxX = mid + minSize / 2;
    }
    if (maxY - minY < minSize) {
      const mid = (minY + maxY) / 2;
      minY = mid - minSize / 2;
      maxY = mid + minSize / 2;
    }
    
    shape.setBounds?.(minX, minY, maxX, maxY);
    
    if (shape.transform.scaleX < 0.05) shape.transform.scaleX = 0.05;
    if (shape.transform.scaleY < 0.05) shape.transform.scaleY = 0.05;
  };

  const drawSelection = (r: RasterRenderer) => {
    const selected = selectedShapeRef.current;
    if (!selected) return;
    const b = selected.getBounds();
    r.strokePolygon(
      [{ x: b.minX, y: b.minY }, { x: b.maxX, y: b.minY }, { x: b.maxX, y: b.maxY }, { x: b.minX, y: b.maxY }],
      selectBlue, 2 * r.dpr
    );
    const rad = 6 * r.dpr;
    const handles = [
      { x: b.minX, y: b.minY }, { x: b.maxX, y: b.minY },
      { x: b.maxX, y: b.maxY }, { x: b.minX, y: b.maxY }
    ];
    for (const h of handles) {
      r.fillCircle(h.x, h.y, rad + 2, white);
      r.fillCircle(h.x, h.y, rad, handleRed);
    }
    const center = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
    const rotateHandle = { x: center.x, y: b.minY - 38 };
    r.strokeLine(center.x, b.minY, rotateHandle.x, rotateHandle.y, selectBlue, 1 * r.dpr);
    r.fillCircle(rotateHandle.x, rotateHandle.y, rad + 3, white);
    r.fillCircle(rotateHandle.x, rotateHandle.y, rad + 1, selectBlue);
  };

  const drawControlPoints = (r: RasterRenderer) => {
    const selected = selectedShapeRef.current;
    if (!selected?.getControlPoints) return;
    const rad = 5 * r.dpr;
    for (const pt of selected.getControlPoints()) {
      const device = selected.transformPointToDevice(pt.x, pt.y);
      r.fillCircle(device.x, device.y, rad + 2, white);
      r.fillCircle(device.x, device.y, rad, orange);
    }
  };

  const drawHover = (r: RasterRenderer) => {
    const hover = hoverShapeRef.current;
    if (!hover || hover === selectedShapeRef.current) return;
    const b = hover.getBounds();
    r.strokePolygon(
      [{ x: b.minX, y: b.minY }, { x: b.maxX, y: b.minY }, { x: b.maxX, y: b.maxY }, { x: b.minX, y: b.maxY }],
      { r: 59, g: 130, b: 246, a: 100 }, 2 * r.dpr
    );
  };

  const createRectAt = (p: Point) => {
    const rect = new Rect(140, 100);
    rect.transform = { x: p.x, y: p.y, rotation: 0, scaleX: 1, scaleY: 1 };
    rect.fillStyle = { r: 255, g: 150, b: 150, a: 255 };
    rect.strokeStyle = black;
    rect.strokeWidth = 2;
    shapesRef.current.push(rect);
    updateSelection(rect);
  };

  const createOvalAt = (p: Point) => {
    const oval = new Oval(70, 50);
    oval.transform = { x: p.x, y: p.y, rotation: 0, scaleX: 1, scaleY: 1 };
    oval.fillStyle = { r: 100, g: 200, b: 100, a: 255 };
    oval.strokeStyle = black;
    oval.strokeWidth = 2;
    shapesRef.current.push(oval);
    updateSelection(oval);
  };

  const createLineAt = (p: Point) => {
    const line = new Line(-100, 0, 100, 0);
    line.transform = { x: p.x, y: p.y, rotation: 0, scaleX: 1, scaleY: 1 };
    line.strokeStyle = { r: 0, g: 200, b: 0, a: 255 };
    line.strokeWidth = 4;
    shapesRef.current.push(line);
    updateSelection(line);
  };

  const createTriangleAt = (p: Point) => {
    const tri = new Triangle(-70, 60, 70, 60, 0, -70);
    tri.transform = { x: p.x, y: p.y, rotation: 0, scaleX: 1, scaleY: 1 };
    tri.fillStyle = { r: 255, g: 200, b: 0, a: 255 };
    tri.strokeStyle = black;
    tri.strokeWidth = 2;
    shapesRef.current.push(tri);
    updateSelection(tri);
  };

  const createQuadraticAt = (p: Point) => {
    const points = [
      { x: -100, y: 0 },
      { x: 0, y: -120 },
      { x: 100, y: 0 }
    ];
    const path = new PathBezier(points, 'catmull', false, 40);
    path.transform = { x: p.x, y: p.y, rotation: 0, scaleX: 1, scaleY: 1 };
    path.strokeStyle = { r: 200, g: 0, b: 200, a: 255 };
    path.strokeWidth = 3;
    shapesRef.current.push(path);
    updateSelection(path);
  };

  const createCubicAt = (p: Point) => {
    const points = [
      { x: -120, y: 0 },
      { x: -50, y: -120 },
      { x: 50, y: 120 },
      { x: 120, y: 0 }
    ];
    const path = new PathBezier(points, 'catmull', false, 40);
    path.transform = { x: p.x, y: p.y, rotation: 0, scaleX: 1, scaleY: 1 };
    path.strokeStyle = { r: 0, g: 80, b: 220, a: 255 };
    path.strokeWidth = 3;
    shapesRef.current.push(path);
    updateSelection(path);
  };

  const createPathAt = (p: Point) => {
    const path = new PathBezier(
      [{ x: 0, y: -55 }, { x: 50, y: -20 }, { x: 60, y: 25 }, { x: 20, y: 60 }, { x: -40, y: 40 }, { x: -60, y: -20 }],
      'catmull', true
    );
    path.transform = { x: p.x, y: p.y, rotation: 0, scaleX: 1, scaleY: 1 };
    path.strokeStyle = { r: 255, g: 100, b: 0, a: 255 };
    path.strokeWidth = 3;
    shapesRef.current.push(path);
    updateSelection(path);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + viewport.scrollLeft;
    const mouseY = e.clientY - rect.top + viewport.scrollTop;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.max(0.5, Math.min(3, zoomRef.current * factor));
    const ratio = nextZoom / zoomRef.current;
    zoomRef.current = nextZoom;
    requestAnimationFrame(() => {
      viewport.scrollLeft = mouseX * ratio - (e.clientX - rect.left);
      viewport.scrollTop = mouseY * ratio - (e.clientY - rect.top);
    });
    forceUpdate({});
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new RasterRenderer(canvas);
    renderer.setLineAlgorithm(lineAlg as any);
    rendererRef.current = renderer;
    const resizeObserver = new ResizeObserver(() => renderer.resize());
    resizeObserver.observe(canvas);
    let raf = 0;
    const frame = () => {
      const r = rendererRef.current;
      if (r && r.width > 0 && r.height > 0) {
        r.beginFrame(true);
        
        for (const shape of shapesRef.current) shape.drawRaster(r);
        
        drawHover(r);
        drawSelection(r);
        drawControlPoints(r);

        const w = r.width;
        
        const thinLine = new Line(w - 350, 100, w - 150, 200);
        thinLine.strokeStyle = { r: 128, g: 0, b: 128, a: 255 };
        thinLine.strokeWidth = 1;
        thinLine.drawRaster(r);

        const polyline1 = new Line(w - 350, 250, w - 250, 280);
        polyline1.strokeStyle = { r: 0, g: 200, b: 0, a: 255 };
        polyline1.strokeWidth = 4;
        polyline1.drawRaster(r);

        const polyline2 = new Line(w - 250, 280, w - 170, 250);
        polyline2.strokeStyle = { r: 0, g: 200, b: 0, a: 255 };
        polyline2.strokeWidth = 4;
        polyline2.drawRaster(r);

        const polyline3 = new Line(w - 170, 250, w - 90, 290);
        polyline3.strokeStyle = { r: 0, g: 200, b: 0, a: 255 };
        polyline3.strokeWidth = 4;
        polyline3.drawRaster(r);

        const blueCircle = new Oval(50, 50);
        blueCircle.fillStyle = { r: 0, g: 0, b: 255, a: 255 };
        blueCircle.strokeStyle = black;
        blueCircle.strokeWidth = 2;
        blueCircle.transform = { x: w - 150, y: 400, rotation: 0, scaleX: 1, scaleY: 1 };
        blueCircle.drawRaster(r);

        const redTransparent = new Oval(50, 50);
        redTransparent.fillStyle = { r: 255, g: 0, b: 0, a: 128 };
        redTransparent.strokeStyle = black;
        redTransparent.strokeWidth = 2;
        redTransparent.transform = { x: w - 120, y: 430, rotation: 0, scaleX: 1, scaleY: 1 };
        redTransparent.drawRaster(r);

        r.commit();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      renderer.dispose();
    };
    
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPoint(e);
    const rotate = findRotateHandle(p);
    if (rotate) { dragRef.current = { type: 'rotate', ...rotate }; return; }
    const resize = findResizeHandle(p);
    if (resize) { dragRef.current = { type: 'resize', ...resize }; return; }
    const control = findControlPoint(p);
    if (control) {
      updateSelection(control.shape);
      dragRef.current = { type: 'control', shape: control.shape, index: control.index };
      return;
    }
    const shape = findShape(p);
    if (shape) {
      updateSelection(shape);
      if (tool === 'select') dragRef.current = { type: 'shape', shape, lastPoint: p };
      return;
    }
    if (tool !== 'select') {
      if (tool === 'rect') createRectAt(p);
      if (tool === 'oval') createOvalAt(p);
      if (tool === 'line') createLineAt(p);
      if (tool === 'triangle') createTriangleAt(p);
      if (tool === 'quadratic') createQuadraticAt(p);
      if (tool === 'cubic') createCubicAt(p);
      if (tool === 'path') createPathAt(p);
      onToolChange('select');
      return;
    }
    updateSelection(null);
    dragRef.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const p = getCanvasPoint(e);
    if (!drag) { hoverShapeRef.current = findShape(p); return; }
    if (drag.type === 'control') {
      const local = drag.shape.transformPointToLocal(p.x, p.y);
      drag.shape.setControlPoint?.(drag.index, local.x, local.y);
      shapesRef.current = [...shapesRef.current];
      forceUpdate({});
      return;
    }
    if (drag.type === 'resize') { resizeShape(drag.shape, drag.opposite, p); return; }
    if (drag.type === 'rotate') {
      const angle = Math.atan2(p.y - drag.center.y, p.x - drag.center.x);
      drag.shape.transform.rotation = drag.startRotation + angle - drag.startAngle;
      return;
    }
    if (drag.type === 'shape') {
      const dx = p.x - drag.lastPoint.x;
      const dy = p.y - drag.lastPoint.y;
      drag.shape.transform.x += dx;
      drag.shape.transform.y += dy;
      drag.lastPoint = p;
    }
  };

  const handleMouseUp = () => { dragRef.current = null; };

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-white">
      <div className="p-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2 shrink-0">
        <button onClick={() => { setLineAlg('bresenham'); forceUpdate({}); }} className={`px-3 py-1 rounded-xl transition-all ${lineAlg === 'bresenham' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Брезенхем</button>
        <button onClick={() => { setLineAlg('wu'); forceUpdate({}); }} className={`px-3 py-1 rounded-xl transition-all ${lineAlg === 'wu' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Ву</button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button onClick={() => { zoomRef.current = Math.max(0.5, zoomRef.current - 0.1); forceUpdate({}); }} className="px-3 py-1 rounded-xl bg-gray-200">-</button>
        <span className="text-sm text-gray-700 w-14 text-center">{Math.round(zoomRef.current * 100)}%</span>
        <button onClick={() => { zoomRef.current = Math.min(3, zoomRef.current + 0.1); forceUpdate({}); }} className="px-3 py-1 rounded-xl bg-gray-200">+</button>
        <span className="ml-4 text-sm text-gray-500">Ctrl + колесо — масштаб</span>
      </div>
      <div ref={viewportRef} className="flex-1 min-h-0 overflow-auto bg-white" onWheel={handleWheel}>
        <div className="relative m-4" style={{ width: WORLD_WIDTH * zoomRef.current, height: WORLD_HEIGHT * zoomRef.current }}>
          <canvas
            ref={canvasRef}
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            className="absolute left-0 top-0 cursor-crosshair bg-white rounded-xl border border-gray-200 shadow-lg"
            style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT, transform: `scale(${zoomRef.current})`, transformOrigin: 'top left' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
}