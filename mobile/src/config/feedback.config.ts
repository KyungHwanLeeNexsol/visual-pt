// SPEC-UI-001: 피드백 메시지 및 디바운스 설정

import type { FormErrorType } from '../types/feedback.types';

// 동일 에러 타입의 음성 피드백 재재생 방지 시간 (ms)
export const FEEDBACK_DEBOUNCE_MS = 2000;

// @MX:ANCHOR: 에러 타입별 한국어 피드백 메시지 매핑
// @MX:REASON: FeedbackGenerator.errorToMessage 에서 직접 참조
export const FEEDBACK_MESSAGES: Record<FormErrorType, { text: string; speechText: string }> = {
  KNEE_ANGLE_OUT_OF_RANGE: {
    text: '무릎을 더 펴세요',
    speechText: '무릎을 더 펴세요',
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
};

// 각도 품질 점수 임계값 (visibility 기반)
export const ANGLE_QUALITY_SCORE_THRESHOLDS = {
  GOOD: 0.7,    // 신뢰할 수 있는 각도
  WARNING: 0.4, // 부분적으로 보임
  POOR: 0.0,    // 거부
};
