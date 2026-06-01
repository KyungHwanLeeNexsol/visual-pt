// SPEC-UI-001: M2 관절 각도 벡터 수학 유틸

export interface Point2D {
  x: number;
  y: number;
}

/**
 * 점 A-B-C 에서 꼭짓점 B 의 각도를 도(degree) 단위로 계산한다.
 * 내적(dot product) / 코사인 법칙 방식 사용.
 * 모든 점이 동일한 경우 0을 반환한다.
 */
export function calculateAngle(a: Point2D, b: Point2D, c: Point2D): number {
  // 벡터 BA, 벡터 BC
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dotProduct = baX * bcX + baY * bcY;
  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

  // 영벡터 방지 (모든 점이 동일한 경우)
  if (magBA === 0 || magBC === 0) {
    return 0;
  }

  // 부동소수점 오차로 인한 [-1, 1] 범위 초과 방지
  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magBA * magBC)));
  const angleRad = Math.acos(cosAngle);
  return (angleRad * 180) / Math.PI;
}

/**
 * 두 점 사이의 유클리드 거리를 계산한다.
 */
export function euclideanDistance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 값을 [min, max] 범위로 제한한다.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 값이 [min, max] 범위 내에 있는지 확인한다 (경계값 포함).
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
