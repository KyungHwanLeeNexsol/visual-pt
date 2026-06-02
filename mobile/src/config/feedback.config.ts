// SPEC-UI-001: 피드백 메시지 및 디바운스 설정
// SPEC-ENHANCE-001 E1: 운동별 + 방향성 메시지 시스템으로 확장

import type { FormErrorType } from '../types/feedback.types';
import type { ExerciseType } from '../types/pose.types';

// 동일 에러 타입의 음성 피드백 재재생 방지 시간 (ms)
export const FEEDBACK_DEBOUNCE_MS = 2000;

// 방향성 타입: 현재 값이 최솟값 미만, 최댓값 초과, 또는 일반
export type FeedbackDirection = 'tooLow' | 'tooHigh' | 'general';

// 메시지 맵 키: "에러타입:운동:방향" 형식
function makeKey(
  errorType: FormErrorType,
  exercise: ExerciseType,
  direction: FeedbackDirection,
): string {
  return `${errorType}:${exercise}:${direction}`;
}

// @MX:ANCHOR: 에러 타입별 한국어 피드백 메시지 매핑 (운동별 + 방향성 확장)
// @MX:REASON: FeedbackGenerator.generateMessages 에서 직접 참조 (fan_in >= 2)
const DIRECTIONAL_MESSAGES: Map<string, { text: string; speechText: string }> = new Map([
  // 스쿼트 무릎 각도
  [makeKey('KNEE_ANGLE_OUT_OF_RANGE', 'squat', 'tooLow'),
    { text: '무릎을 더 구부리세요', speechText: '무릎을 더 구부리세요' }],
  [makeKey('KNEE_ANGLE_OUT_OF_RANGE', 'squat', 'tooHigh'),
    { text: '무릎을 더 펴세요', speechText: '무릎을 더 펴세요' }],

  // 데드리프트 무릎 각도
  [makeKey('KNEE_ANGLE_OUT_OF_RANGE', 'deadlift', 'tooLow'),
    { text: '무릎을 살짝 굽히세요', speechText: '무릎을 살짝 굽히세요' }],
  [makeKey('KNEE_ANGLE_OUT_OF_RANGE', 'deadlift', 'tooHigh'),
    { text: '무릎 각도를 유지하세요', speechText: '무릎 각도를 유지하세요' }],

  // 스쿼트 척추 정렬 (general — 방향 무관)
  [makeKey('SPINE_MISALIGNMENT', 'squat', 'general'),
    { text: '척추를 중립으로 유지하세요', speechText: '척추를 중립으로 유지하세요' }],
  [makeKey('SPINE_MISALIGNMENT', 'squat', 'tooLow'),
    { text: '척추를 중립으로 유지하세요', speechText: '척추를 중립으로 유지하세요' }],
  [makeKey('SPINE_MISALIGNMENT', 'squat', 'tooHigh'),
    { text: '척추를 중립으로 유지하세요', speechText: '척추를 중립으로 유지하세요' }],

  // 데드리프트 척추 정렬 (general)
  [makeKey('SPINE_MISALIGNMENT', 'deadlift', 'general'),
    { text: '등을 편평하게 유지하세요', speechText: '등을 편평하게 유지하세요' }],
  [makeKey('SPINE_MISALIGNMENT', 'deadlift', 'tooLow'),
    { text: '등을 편평하게 유지하세요', speechText: '등을 편평하게 유지하세요' }],
  [makeKey('SPINE_MISALIGNMENT', 'deadlift', 'tooHigh'),
    { text: '등을 편평하게 유지하세요', speechText: '등을 편평하게 유지하세요' }],

  // 스쿼트/데드리프트 어깨 수평 (general)
  [makeKey('SHOULDER_IMBALANCE', 'squat', 'general'),
    { text: '어깨를 수평으로 유지하세요', speechText: '어깨를 수평으로 유지하세요' }],
  [makeKey('SHOULDER_IMBALANCE', 'squat', 'tooLow'),
    { text: '어깨를 수평으로 유지하세요', speechText: '어깨를 수평으로 유지하세요' }],
  [makeKey('SHOULDER_IMBALANCE', 'squat', 'tooHigh'),
    { text: '어깨를 수평으로 유지하세요', speechText: '어깨를 수평으로 유지하세요' }],
  [makeKey('SHOULDER_IMBALANCE', 'deadlift', 'general'),
    { text: '어깨를 수평으로 유지하세요', speechText: '어깨를 수평으로 유지하세요' }],
  [makeKey('SHOULDER_IMBALANCE', 'deadlift', 'tooLow'),
    { text: '어깨를 수평으로 유지하세요', speechText: '어깨를 수평으로 유지하세요' }],
  [makeKey('SHOULDER_IMBALANCE', 'deadlift', 'tooHigh'),
    { text: '어깨를 수평으로 유지하세요', speechText: '어깨를 수평으로 유지하세요' }],

  // 스쿼트 엉덩이 각도
  [makeKey('HIP_ALIGNMENT', 'squat', 'tooLow'),
    { text: '엉덩이를 더 낮추세요', speechText: '엉덩이를 더 낮추세요' }],
  [makeKey('HIP_ALIGNMENT', 'squat', 'tooHigh'),
    { text: '엉덩이 위치를 조정하세요', speechText: '엉덩이 위치를 조정하세요' }],
  [makeKey('HIP_ALIGNMENT', 'squat', 'general'),
    { text: '엉덩이 위치를 교정하세요', speechText: '엉덩이 위치를 교정하세요' }],

  // 데드리프트 엉덩이 (general — 힌지 동작 강조)
  [makeKey('HIP_ALIGNMENT', 'deadlift', 'general'),
    { text: '엉덩이 힌지 동작을 확인하세요', speechText: '엉덩이 힌지 동작을 확인하세요' }],
  [makeKey('HIP_ALIGNMENT', 'deadlift', 'tooLow'),
    { text: '엉덩이 힌지 동작을 확인하세요', speechText: '엉덩이 힌지 동작을 확인하세요' }],
  [makeKey('HIP_ALIGNMENT', 'deadlift', 'tooHigh'),
    { text: '엉덩이 힌지 동작을 확인하세요', speechText: '엉덩이 힌지 동작을 확인하세요' }],

  // 데드리프트 몸통 각도 (deadlift 전용)
  [makeKey('TORSO_ANGLE_OUT_OF_RANGE', 'deadlift', 'tooLow'),
    { text: '몸통을 더 세우세요', speechText: '몸통을 더 세우세요' }],
  [makeKey('TORSO_ANGLE_OUT_OF_RANGE', 'deadlift', 'tooHigh'),
    { text: '상체를 더 숙이세요', speechText: '상체를 더 숙이세요' }],
  [makeKey('TORSO_ANGLE_OUT_OF_RANGE', 'deadlift', 'general'),
    { text: '몸통 각도를 확인하세요', speechText: '몸통 각도를 확인하세요' }],
]);

/**
 * 에러 타입, 운동 종류, 방향성으로 메시지를 조회한다.
 * 매칭 우선순위: 방향 특정 → general → 기본값
 */
export function getFeedbackMessage(
  errorType: FormErrorType,
  exercise: ExerciseType,
  direction: FeedbackDirection,
): { text: string; speechText: string } {
  // 1. 방향 특정 메시지 조회
  const specific = DIRECTIONAL_MESSAGES.get(makeKey(errorType, exercise, direction));
  if (specific) return specific;

  // 2. general 메시지로 폴백
  const general = DIRECTIONAL_MESSAGES.get(makeKey(errorType, exercise, 'general'));
  if (general) return general;

  // 3. 기본 안전 폴백
  return { text: '자세를 교정하세요', speechText: '자세를 교정하세요' };
}

/**
 * currentValue 와 expectedRange 로 방향을 결정한다.
 * currentValue 가 정의되지 않거나 범위 내에 있으면 'general' 반환
 */
export function resolveDirection(
  currentValue: number | undefined,
  expectedRange: [number, number],
): FeedbackDirection {
  if (currentValue === undefined) return 'general';
  const [min, max] = expectedRange;
  if (currentValue < min) return 'tooLow';
  if (currentValue > max) return 'tooHigh';
  return 'general';
}

// 하위 호환성: 기존 코드가 FEEDBACK_MESSAGES[type] 형태로 접근하는 경우를 위해 유지
// JointAngleCalculator.detectErrors 에서 message 필드 초기화에 사용됨
export const FEEDBACK_MESSAGES: Record<FormErrorType, { text: string; speechText: string }> = {
  KNEE_ANGLE_OUT_OF_RANGE: {
    text: '무릎 각도를 교정하세요',
    speechText: '무릎 각도를 교정하세요',
  },
  SPINE_MISALIGNMENT: {
    text: '척추를 중립으로 유지하세요',
    speechText: '척추를 중립으로 유지하세요',
  },
  SHOULDER_IMBALANCE: {
    text: '어깨를 수평으로 유지하세요',
    speechText: '어깨를 수평으로 유지하세요',
  },
  HIP_ALIGNMENT: {
    text: '엉덩이 위치를 교정하세요',
    speechText: '엉덩이 위치를 교정하세요',
  },
  TORSO_ANGLE_OUT_OF_RANGE: {
    text: '몸통 각도를 확인하세요',
    speechText: '몸통 각도를 확인하세요',
  },
};

// 각도 품질 점수 임계값 (visibility 기반)
export const ANGLE_QUALITY_SCORE_THRESHOLDS = {
  GOOD: 0.7,    // 신뢰할 수 있는 각도
  WARNING: 0.4, // 부분적으로 보임
  POOR: 0.0,    // 거부
};
