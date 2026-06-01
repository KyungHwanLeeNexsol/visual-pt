// SPEC-UI-001: 피드백 이력 + 디바운스 상태 (Zustand)

import { create } from 'zustand';
import type { FeedbackMessage, FormError } from '../types/feedback.types';

// 메시지 이력 최대 보관 개수
const MAX_MESSAGES = 10;

interface FeedbackState {
  currentErrors: FormError[];
  lastMessages: FeedbackMessage[];
  isActive: boolean;

  setErrors: (errors: FormError[]) => void;
  addMessage: (message: FeedbackMessage) => void;
  clearMessages: () => void;
  setActive: (active: boolean) => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  currentErrors: [],
  lastMessages: [],
  isActive: false,

  setErrors: (errors: FormError[]): void => {
    set({ currentErrors: errors });
  },

  addMessage: (message: FeedbackMessage): void => {
    set((state) => {
      const updated = [...state.lastMessages, message];
      // MAX_MESSAGES 초과 시 가장 오래된 메시지 제거
      const trimmed = updated.length > MAX_MESSAGES ? updated.slice(updated.length - MAX_MESSAGES) : updated;
      return { lastMessages: trimmed };
    });
  },

  clearMessages: (): void => {
    set({ lastMessages: [] });
  },

  setActive: (active: boolean): void => {
    set({ isActive: active });
  },
}));
