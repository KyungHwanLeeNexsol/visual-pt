// SPEC-UI-001: M3 폼 오류 → 피드백 메시지 생성 서비스

import type { FormError, FeedbackMessage } from '../types/feedback.types';
import type { ExerciseType } from '../types/pose.types';
import { FEEDBACK_MESSAGES } from '../config/feedback.config';

// @MX:ANCHOR: 에러를 사용자 피드백으로 변환하는 핵심 서비스
// @MX:REASON: AudioFeedbackService, FeedbackStore 에서 참조 (fan_in >= 2)
export class FeedbackGenerator {
  /**
   * FormError 배열을 FeedbackMessage 배열로 변환한다.
   */
  generateMessages(errors: FormError[], exercise: ExerciseType): FeedbackMessage[] {
    void exercise; // Phase D 에서 운동별 맞춤 메시지 확장 예정
    return errors.map((error) => this.errorToMessage(error));
  }

  /**
   * 단일 FormError 를 FeedbackMessage 로 변환한다.
   */
  errorToMessage(error: FormError): FeedbackMessage {
    const messageTemplate = FEEDBACK_MESSAGES[error.type];
    return {
      id: `feedback-${error.type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      errorType: error.type,
      text: messageTemplate.text,
      speechText: messageTemplate.speechText,
      severity: this.resolveSeverity(error),
      timestamp: Date.now(),
    };
  }

  // 에러 타입에 따른 심각도 결정
  private resolveSeverity(error: FormError): 'warning' | 'error' {
    switch (error.type) {
      case 'SPINE_MISALIGNMENT':
        return 'error'; // 부상 위험 높음
      default:
        return 'warning';
    }
  }
}
