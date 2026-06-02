// SPEC-ENHANCE-001 E2: sessionAnalyticsStore Zustand 단위 테스트

import { act } from '@testing-library/react-native';
import type { SessionSummary } from '../../services/SessionAnalyticsService';

// 테스트용 더미 SessionSummary
function makeSummary(): SessionSummary {
  return {
    exercise: 'squat',
    totalReps: 5,
    avgAngles: { leftKnee: 95, rightKnee: 90 },
    errorFrequency: { KNEE_ANGLE_OUT_OF_RANGE: 3 },
    sessionDurationMs: 60000,
    snapshotCount: 120,
  };
}

describe('sessionAnalyticsStore', () => {
  let useSessionAnalyticsStore: typeof import('../../store/sessionAnalyticsStore').useSessionAnalyticsStore;

  beforeEach(() => {
    jest.isolateModules(() => {
      const module = require('../../store/sessionAnalyticsStore') as {
        useSessionAnalyticsStore: typeof import('../../store/sessionAnalyticsStore').useSessionAnalyticsStore;
      };
      useSessionAnalyticsStore = module.useSessionAnalyticsStore;
    });
  });

  // ─── 초기 상태 ───────────────────────────────────────────────────────

  describe('초기 상태', () => {
    it('currentSummary 초기값은 null이다', () => {
      expect(useSessionAnalyticsStore.getState().currentSummary).toBeNull();
    });

    it('isAnalyzing 초기값은 false이다', () => {
      expect(useSessionAnalyticsStore.getState().isAnalyzing).toBe(false);
    });
  });

  // ─── setSummary ───────────────────────────────────────────────────────

  describe('setSummary', () => {
    it('setSummary 호출 시 currentSummary에 저장된다', () => {
      const summary = makeSummary();
      act(() => {
        useSessionAnalyticsStore.getState().setSummary(summary);
      });
      expect(useSessionAnalyticsStore.getState().currentSummary).toEqual(summary);
    });

    it('두 번 호출 시 마지막 값으로 덮어써진다', () => {
      const first = makeSummary();
      const second = { ...makeSummary(), totalReps: 10 };
      act(() => {
        useSessionAnalyticsStore.getState().setSummary(first);
        useSessionAnalyticsStore.getState().setSummary(second);
      });
      expect(useSessionAnalyticsStore.getState().currentSummary?.totalReps).toBe(10);
    });
  });

  // ─── setAnalyzing ─────────────────────────────────────────────────────

  describe('setAnalyzing', () => {
    it('setAnalyzing(true) 호출 시 isAnalyzing이 true가 된다', () => {
      act(() => {
        useSessionAnalyticsStore.getState().setAnalyzing(true);
      });
      expect(useSessionAnalyticsStore.getState().isAnalyzing).toBe(true);
    });

    it('setAnalyzing(false) 호출 시 isAnalyzing이 false가 된다', () => {
      act(() => {
        useSessionAnalyticsStore.getState().setAnalyzing(true);
        useSessionAnalyticsStore.getState().setAnalyzing(false);
      });
      expect(useSessionAnalyticsStore.getState().isAnalyzing).toBe(false);
    });
  });

  // ─── reset ────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('reset 호출 시 currentSummary가 null로 초기화된다', () => {
      act(() => {
        useSessionAnalyticsStore.getState().setSummary(makeSummary());
        useSessionAnalyticsStore.getState().reset();
      });
      expect(useSessionAnalyticsStore.getState().currentSummary).toBeNull();
    });

    it('reset 호출 시 isAnalyzing이 false로 초기화된다', () => {
      act(() => {
        useSessionAnalyticsStore.getState().setAnalyzing(true);
        useSessionAnalyticsStore.getState().reset();
      });
      expect(useSessionAnalyticsStore.getState().isAnalyzing).toBe(false);
    });
  });
});
