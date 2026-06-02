// SPEC-UI-001: M3 폼 오류 → 피드백 메시지 생성 서비스
// SPEC-ENHANCE-001 E1: 운동별 + 방향성 피드백 메시지 구현

import type { FormError, FeedbackMessage } from '../types/feedback.types';
import type { ExerciseType } from '../types/pose.types';
import { getFeedbackMessage, resolveDirection } from '../config/feedback.config';

// @MX:ANCHOR: 에러를 사용자 피드백으로 변환하는 핵심 서비스
// @MX:REASON: AudioFeedbackService, FeedbackStore 에서 참조 (fan_in >= 2)
export class FeedbackGenerator {
  /**
   * FormError 배열을 FeedbackMessage 배열로 변환한다.
   * 운동 종류와 현재 값의 방향에 따라 맞춤 메시지를 생성한다.
   */
  generateMessages(errors: FormError[], exercise: ExerciseType): FeedbackMessage[] {
    return errors.map((error) => this.errorToDirectionalMessage(error, exercise));
  }

  /**
   * 단일 FormError 를 FeedbackMessage 로 변환한다.
   * 하위 호환성을 위해 exercise 없이 호출 시 general 방향으로 처리된다.
   */
  errorToMessage(error: FormError): FeedbackMessage {
    // 기본 exercise 로 squat 사용 (하위 호환성 유지)
    return this.errorToDirectionalMessage(error, 'squat');
  }

  // 운동 종류 + 방향성을 고려한 메시지 변환
  private errorToDirectionalMessage(error: FormError, exercise: ExerciseType): FeedbackMessage {
    // currentValue 와 expectedRange 로 방향 결정
    const direction = resolveDirection(error.currentValue, error.expectedRange);
    const messageTemplate = getFeedbackMessage(error.type, exercise, direction);

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
