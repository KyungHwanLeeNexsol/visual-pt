// SPEC-UI-001: M2/M3 피드백 타입 계약

export type FormErrorType =
  | 'KNEE_ANGLE_OUT_OF_RANGE'
  | 'SPINE_MISALIGNMENT'
  | 'SHOULDER_IMBALANCE'
  | 'HIP_ALIGNMENT';

export interface FormError {
  type: FormErrorType;
  joint: string;                    // 예: 'leftKnee'
  currentValue: number;             // 현재 각도
  expectedRange: [number, number];  // [최솟값, 최댓값]
  message: string;                  // 한국어 피드백 텍스트
}

export interface FeedbackMessage {
  id: string;
  errorType: FormErrorType;
  text: string;        // 화면 표시용 한국어 텍스트
  speechText: string;  // TTS용 한국어 텍스트
  severity: 'warning' | 'error';
  timestamp: number;
}
