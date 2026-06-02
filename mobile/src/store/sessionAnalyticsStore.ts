// SPEC-ENHANCE-001 E2: 세션 분석 결과 상태 관리 (Zustand, 인메모리 전용)

import { create } from 'zustand';
import type { SessionSummary } from '../services/SessionAnalyticsService';

// 세션 분석 스토어 상태 인터페이스
interface SessionAnalyticsState {
  currentSummary: SessionSummary | null;
  isAnalyzing: boolean;
  setSummary: (summary: SessionSummary) => void;
  setAnalyzing: (analyzing: boolean) => void;
  reset: () => void;
}

// @MX:ANCHOR: [AUTO] 세션 완료 후 요약 데이터를 SessionSummaryScreen으로 전달하는 상태 브리지
// @MX:REASON: [AUTO] CameraScreen(쓰기), SessionSummaryScreen(읽기), 테스트가 이 스토어에 의존
export const useSessionAnalyticsStore = create<SessionAnalyticsState>((set) => ({
  currentSummary: null,
  isAnalyzing: false,

  setSummary: (summary: SessionSummary): void => {
    set({ currentSummary: summary });
  },

  setAnalyzing: (analyzing: boolean): void => {
    set({ isAnalyzing: analyzing });
  },

  reset: (): void => {
    set({ currentSummary: null, isAnalyzing: false });
  },
}));
