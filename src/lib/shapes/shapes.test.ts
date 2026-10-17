import { test, expect } from 'vitest'
import { Triangle } from './Triangle'
import { QuadraticBezier } from './QuadraticBezier'
import { CubicBezier } from './CubicBezier'
import { PathBezier } from './PathBezier'

test('Triangle hitTest inside', () => {
  const t = new Triangle(-50, 50, 50, 50, 0, -50)
  expect(t.hitTest(0, 0)).toBe(true)
})

test('Triangle hitTest outside', () => {
  const t = new Triangle(-50, 50, 50, 50, 0, -50)
  expect(t.hitTest(100, 100)).toBe(false)
})

test('Triangle getLocalBounds', () => {
  const t = new Triangle(-30, 20, 40, 20, 0, -30)
  const b = t.getLocalBounds()
  expect(b.minX).toBe(-30)
  expect(b.maxX).toBe(40)
})

test('QuadraticBezier evalLocal at t=0', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  const pt = q.evalLocal(0)
  expect(pt.x).toBeCloseTo(0, 1)
  expect(pt.y).toBeCloseTo(0, 1)
})

test('QuadraticBezier evalLocal at t=1', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  const pt = q.evalLocal(1)
  expect(pt.x).toBeCloseTo(100, 1)
  expect(pt.y).toBeCloseTo(0, 1)
})

test('QuadraticBezier evalLocal at t=0.5', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  const pt = q.evalLocal(0.5)
  expect(pt.x).toBeCloseTo(50, 1)
  expect(pt.y).toBeCloseTo(50, 1)
})

test('CubicBezier evalLocal at t=0', () => {
  const c = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0)
  const pt = c.evalLocal(0)
  expect(pt.x).toBeCloseTo(0, 1)
  expect(pt.y).toBeCloseTo(0, 1)
})

test('CubicBezier evalLocal at t=1', () => {
  const c = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0)
  const pt = c.evalLocal(1)
  expect(pt.x).toBeCloseTo(100, 1)
  expect(pt.y).toBeCloseTo(0, 1)
})

test('PathBezier polyline mode', () => {
  const p = new PathBezier([
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 50, y: 50 },
  ], 'polyline')
  const pts = p.getControlPoints()
  expect(pts.length).toBe(3)
})

test('PathBezier add and remove point', () => {
  const p = new PathBezier([{ x: 0, y: 0 }], 'polyline')
  p.addPointLocal(10, 10)
  expect(p.getControlPoints().length).toBe(2)
  p.removePoint(0)
  expect(p.getControlPoints().length).toBe(1)
})

test('PathBezier catmull mode creates beziers', () => {
  const p = new PathBezier([
    { x: 0, y: 0 },
    { x: 10, y: 20 },
    { x: 30, y: 10 },
    { x: 40, y: 30 },
  ], 'catmull', false)
  const beziers = p.catmullToBeziers()
  expect(beziers.length).toBeGreaterThan(0)
})