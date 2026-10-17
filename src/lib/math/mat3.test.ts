import { describe, it, expect } from "vitest";
import { mat3, type Mat3 } from "./mat3";

function expectMatCloseTo(actual: Mat3, expected: Mat3) {
  for (let i = 0; i < 9; i++) {
    expect(actual[i]).toBeCloseTo(expected[i], 9);
  }
}

function expectAffine(m: Mat3) {
  expect(m[6]).toBeCloseTo(0);
  expect(m[7]).toBeCloseTo(0);
  expect(m[8]).toBeCloseTo(1);
}

describe("mat3", () => {
  it("identity: full matrix", () => {
    const I = mat3.identity();
    const expected: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    expectMatCloseTo(I, expected);
    expectAffine(I);
  });

  it("translate: exact matrix and transformPoint", () => {
    const tx = 10, ty = -5;
    const T = mat3.translate(tx, ty);
    const expected: Mat3 = [1, 0, tx, 0, 1, ty, 0, 0, 1];
    expectMatCloseTo(T, expected);
    expectAffine(T);
    
    const p = mat3.transformPoint(T, 3, 4);
    expect(p.x).toBeCloseTo(3 + tx);
    expect(p.y).toBeCloseTo(4 + ty);
  });

  it("scale: exact matrix and point behavior", () => {
    const sx = 2, sy = 0.5;
    const S = mat3.scale(sx, sy);
    const expected: Mat3 = [sx, 0, 0, 0, sy, 0, 0, 0, 1];
    expectMatCloseTo(S, expected);
    expectAffine(S);
    
    const p = mat3.transformPoint(S, 4, 6);
    expect(p.x).toBeCloseTo(4 * sx);
    expect(p.y).toBeCloseTo(6 * sy);
  });

  it("rotate: exact matrix and point behavior", () => {
    const I = mat3.rotate(0);
    const expectedIdentity: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    expectMatCloseTo(I, expectedIdentity);
    
    const r90 = mat3.rotate(Math.PI / 2);
    const p = mat3.transformPoint(r90, 1, 0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });

  it("multiply: T * I = T", () => {
    const T = mat3.translate(5, 7);
    const I = mat3.identity();
    const result = mat3.multiply(T, I);
    expectMatCloseTo(result, T);
  });

  it("multiply: I * T = T", () => {
    const T = mat3.translate(5, 7);
    const I = mat3.identity();
    const result = mat3.multiply(I, T);
    expectMatCloseTo(result, T);
  });

  it("invert: translate inverse", () => {
    const T = mat3.translate(10, 20);
    const inv = mat3.invert(T);
    expect(inv).not.toBeNull();
    if (inv) {
      const identity = mat3.multiply(T, inv);
      expect(identity[0]).toBeCloseTo(1);
      expect(identity[4]).toBeCloseTo(1);
      expect(identity[8]).toBeCloseTo(1);
    }
  });

  it("invert: scale zero returns null", () => {
    expect(mat3.invert(mat3.scale(0, 1))).toBeNull();
    expect(mat3.invert(mat3.scale(1, 0))).toBeNull();
  });

  it("fromTransform: matches manual steps", () => {
    const tx = 10, ty = 20;
    const angle = Math.PI / 4;
    const sx = 2, sy = 1.5;
    
    const M = mat3.fromTransform(tx, ty, angle, sx, sy);
    const p = mat3.transformPoint(M, 1, 0);
    
    const scaled = { x: 2, y: 0 };
    const rotated = {
      x: scaled.x * Math.cos(angle) - scaled.y * Math.sin(angle),
      y: scaled.x * Math.sin(angle) + scaled.y * Math.cos(angle)
    };
    const manual = { x: rotated.x + tx, y: rotated.y + ty };
    
    expect(p.x).toBeCloseTo(manual.x);
    expect(p.y).toBeCloseTo(manual.y);
  });
});