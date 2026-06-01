// SPEC-UI-001: mathHelpers 순수 함수 TDD 명세 테스트

import {
  calculateAngle,
  euclideanDistance,
  clamp,
  isInRange,
  type Point2D,
} from '../../utils/mathHelpers';

describe('calculateAngle', () => {
  it('수직선 위의 3점 (180도 직선) 은 약 180도를 반환한다', () => {
    // A-B-C 가 일직선이면 angle at B = 180
    const a: Point2D = { x: 0, y: 0 };
    const b: Point2D = { x: 1, y: 0 };
    const c: Point2D = { x: 2, y: 0 };
    expect(calculateAngle(a, b, c)).toBeCloseTo(180, 0);
  });

  it('직각(90도) 을 올바르게 계산한다', () => {
    // A=(0,1) B=(0,0) C=(1,0) → angle at B = 90
    const a: Point2D = { x: 0, y: 1 };
    const b: Point2D = { x: 0, y: 0 };
    const c: Point2D = { x: 1, y: 0 };
    expect(calculateAngle(a, b, c)).toBeCloseTo(90, 0);
  });

  it('45도 각도를 올바르게 계산한다', () => {
    // A=(0,1) B=(0,0) C=(1,1) → angle at B = 45
    const a: Point2D = { x: 0, y: 1 };
    const b: Point2D = { x: 0, y: 0 };
    const c: Point2D = { x: 1, y: 1 };
    expect(calculateAngle(a, b, c)).toBeCloseTo(45, 0);
  });

  it('알려진 좌표로 60도를 계산한다', () => {
    // 정삼각형의 한 꼭지각 = 60도
    const a: Point2D = { x: 0, y: 0 };
    const b: Point2D = { x: 1, y: 0 };
    const c: Point2D = { x: 0.5, y: Math.sqrt(3) / 2 };
    expect(calculateAngle(a, b, c)).toBeCloseTo(60, 0);
  });

  it('모든 점이 같을 때 (엣지 케이스) 크래시 없이 처리한다', () => {
    const p: Point2D = { x: 0, y: 0 };
    expect(() => calculateAngle(p, p, p)).not.toThrow();
  });

  it('반환값은 0 이상 180 이하여야 한다', () => {
    const a: Point2D = { x: -1, y: -1 };
    const b: Point2D = { x: 0, y: 0 };
    const c: Point2D = { x: 1, y: -1 };
    const angle = calculateAngle(a, b, c);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });
});

describe('euclideanDistance', () => {
  it('같은 점 사이의 거리는 0이다', () => {
    const p: Point2D = { x: 3, y: 4 };
    expect(euclideanDistance(p, p)).toBe(0);
  });

  it('원점에서 (3,4) 까지의 거리는 5이다', () => {
    const origin: Point2D = { x: 0, y: 0 };
    const p: Point2D = { x: 3, y: 4 };
    expect(euclideanDistance(origin, p)).toBeCloseTo(5, 5);
  });

  it('대칭적이다: dist(a,b) === dist(b,a)', () => {
    const a: Point2D = { x: 1, y: 2 };
    const b: Point2D = { x: 4, y: 6 };
    expect(euclideanDistance(a, b)).toBeCloseTo(euclideanDistance(b, a), 10);
  });
});

describe('clamp', () => {
  it('값이 범위 내이면 그대로 반환한다', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('최솟값보다 작으면 최솟값을 반환한다', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('최댓값보다 크면 최댓값을 반환한다', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('경계값(min) 은 그대로 반환한다', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('경계값(max) 은 그대로 반환한다', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('isInRange', () => {
  it('범위 내 값은 true를 반환한다', () => {
    expect(isInRange(5, 0, 10)).toBe(true);
  });

  it('범위 외 값(작음)은 false를 반환한다', () => {
    expect(isInRange(-1, 0, 10)).toBe(false);
  });

  it('범위 외 값(큼)은 false를 반환한다', () => {
    expect(isInRange(11, 0, 10)).toBe(false);
  });

  it('경계값 min은 true(포함)이다', () => {
    expect(isInRange(0, 0, 10)).toBe(true);
  });

  it('경계값 max는 true(포함)이다', () => {
    expect(isInRange(10, 0, 10)).toBe(true);
  });
});
