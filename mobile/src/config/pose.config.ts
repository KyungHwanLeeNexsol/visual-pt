// SPEC-UI-001: 운동별 관절 각도 임계값 설정

// 키포인트 신뢰도 임계값 — 이 값 미만이면 각도 계산에서 제외
export const VISIBILITY_THRESHOLD = 0.5;

// @MX:ANCHOR: 운동별 관절 각도 범위 설정 — 모든 에러 감지 로직의 기준값
// @MX:REASON: JointAngleCalculator.detectErrors 에서 직접 참조 (fan_in >= 3)
export const POSE_CONFIG = {
  squat: {
    kneeAngle: { min: 80, max: 120 },
    hipAngle: { min: 45, max: 135 },
    spineAngle: { min: 160, max: 180 }, // 중립 = 180에 가까울수록 좋음
    shoulderAngle: { min: 0, max: 30 }, // 수평 유지
  },
  deadlift: {
    spineAngle: { min: 150, max: 180 }, // 중립 = 180에 가까울수록 좋음
    hipAngle: { min: 30, max: 100 },
    kneeAngle: { min: 100, max: 160 },
    shoulderAngle: { min: 0, max: 30 },
  },
} as const;

export type ExerciseConfig = (typeof POSE_CONFIG)[keyof typeof POSE_CONFIG];
