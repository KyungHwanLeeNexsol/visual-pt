// SPEC-UI-001: M3 피드백 + 디바운스 훅

import { useState, useCallback, useRef } from 'react';
import type { FeedbackMessage, FormError } from '../types/feedback.types';
import type { ExerciseType } from '../types/pose.types';
import { FeedbackGenerator } from '../services/FeedbackGenerator';
import { AudioFeedbackService } from '../services/AudioFeedbackService';

export interface UseFeedbackResult {
  currentMessage: FeedbackMessage | null;
  isDisplaying: boolean;
  triggerFeedback: (errors: FormError[], exercise: ExerciseType) => void;
}

export function useFeedback(): UseFeedbackResult {
  const [currentMessage, setCurrentMessage] = useState<FeedbackMessage | null>(null);
  const generatorRef = useRef(new FeedbackGenerator());
  const audioServiceRef = useRef(new AudioFeedbackService());

  const triggerFeedback = useCallback((errors: FormError[], exercise: ExerciseType) => {
    if (errors.length === 0) {
      setCurrentMessage(null);
      return;
    }

    const messages = generatorRef.current.generateMessages(errors, exercise);
    if (messages.length === 0) {
      setCurrentMessage(null);
      return;
    }

    // 가장 심각한 메시지를 선택 (error > warning)
    const selected =
      messages.find((m) => m.severity === 'error') ?? messages[0];
    setCurrentMessage(selected);

    // 음성 피드백 재생 (디바운스 적용)
    audioServiceRef.current.playFeedback(selected).catch(() => {
      // 음성 재생 실패 시 무시
    });
  }, []);

  return {
    currentMessage,
    isDisplaying: currentMessage !== null,
    triggerFeedback,
  };
}
