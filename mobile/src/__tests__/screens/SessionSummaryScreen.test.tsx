// SPEC-ENHANCE-001 E2: SessionSummaryScreen 단위 테스트

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SessionSummaryScreen } from '../../screens/SessionSummaryScreen';
import type { SessionSummary } from '../../services/SessionAnalyticsService';

// 네비게이션 모킹
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  setOptions: jest.fn(),
  addListener: jest.fn().mockReturnValue(() => {}),
  removeListener: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
} as any;

// 테스트용 SessionSummary 생성 헬퍼
function makeSummary(overrides?: Partial<SessionSummary>): SessionSummary {
  return {
    exercise: 'squat',
    totalReps: 10,
    avgAngles: { leftKnee: 95, leftHip: 80 },
    errorFrequency: {
      KNEE_ANGLE_OUT_OF_RANGE: 5,
      SPINE_MISALIGNMENT: 3,
      SHOULDER_IMBALANCE: 1,
    },
    sessionDurationMs: 125000, // 2분 5초
    snapshotCount: 250,
    ...overrides,
  };
}

function makeRoute(summary: SessionSummary) {
  return {
    key: 'SessionSummaryScreen-1',
    name: 'SessionSummaryScreen' as const,
    params: { summary },
  } as any;
}

describe('SessionSummaryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── 운동 이름 표시 ────────────────────────────────────────────────────

  describe('운동 이름', () => {
    it('squat일 때 "스쿼트"를 표시한다', () => {
      const summary = makeSummary({ exercise: 'squat' });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/스쿼트/)).toBeTruthy();
    });

    it('deadlift일 때 "데드리프트"를 표시한다', () => {
      const summary = makeSummary({ exercise: 'deadlift' });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/데드리프트/)).toBeTruthy();
    });
  });

  // ─── 총 렙수 표시 ─────────────────────────────────────────────────────

  describe('총 렙수', () => {
    it('totalReps 10을 표시한다', () => {
      const summary = makeSummary({ totalReps: 10 });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/10/)).toBeTruthy();
    });

    it('totalReps 0을 표시한다', () => {
      const summary = makeSummary({ totalReps: 0, sessionDurationMs: 30000 }); // 00:30 — 0과 겹치지 않게
      const { getAllByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      // totalReps 표시 영역에 "0"이 있어야 함 (여러 개 허용 — 숫자 0이 다양하게 나올 수 있음)
      expect(getAllByText('0').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── 세션 시간 표시 ───────────────────────────────────────────────────

  describe('세션 시간 (MM:SS 포맷)', () => {
    it('125000ms를 "02:05"으로 표시한다', () => {
      const summary = makeSummary({ sessionDurationMs: 125000 });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/02:05/)).toBeTruthy();
    });

    it('60000ms를 "01:00"으로 표시한다', () => {
      const summary = makeSummary({ sessionDurationMs: 60000 });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/01:00/)).toBeTruthy();
    });
  });

  // ─── 상위 3 오류 표시 ─────────────────────────────────────────────────

  describe('상위 3 오류', () => {
    it('빈도 높은 상위 3개 오류를 한국어로 표시한다', () => {
      const summary = makeSummary({
        avgAngles: {}, // 평균 각도 섹션 숨김 — "무릎 각도" 중복 방지
        errorFrequency: {
          KNEE_ANGLE_OUT_OF_RANGE: 10,
          SPINE_MISALIGNMENT: 7,
          SHOULDER_IMBALANCE: 3,
        },
      });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      // 각 오류 타입의 한국어 이름이 표시되는지 검증
      expect(getByText(/무릎 각도/)).toBeTruthy();
      expect(getByText(/척추 정렬/)).toBeTruthy();
      expect(getByText(/어깨 불균형/)).toBeTruthy();
    });

    it('오류가 없을 때 오류 섹션에 "없음" 또는 유사한 텍스트를 표시한다', () => {
      const summary = makeSummary({ errorFrequency: {} });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/없음|오류 없음|훌륭/)).toBeTruthy();
    });

    it('오류가 4개 이상일 때 상위 3개만 표시한다 (4번째 이하 미표시)', () => {
      const summary = makeSummary({
        errorFrequency: {
          KNEE_ANGLE_OUT_OF_RANGE: 10,
          SPINE_MISALIGNMENT: 7,
          SHOULDER_IMBALANCE: 4,
          HIP_ALIGNMENT: 2, // 4번째 — 표시 안 됨
        },
      });
      const { queryByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      // HIP_ALIGNMENT(엉덩이 정렬)는 4번째이므로 표시되지 않아야 함
      expect(queryByText(/엉덩이 정렬/)).toBeNull();
    });
  });

  // ─── 평균 각도 표시 ───────────────────────────────────────────────────

  describe('평균 각도', () => {
    it('avgAngles.leftKnee가 있을 때 무릎 각도를 표시한다', () => {
      const summary = makeSummary({ avgAngles: { leftKnee: 95 } });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/95/)).toBeTruthy();
    });

    it('avgAngles.leftHip가 있을 때 힙 각도를 표시한다', () => {
      const summary = makeSummary({ avgAngles: { leftHip: 80 } });
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/80/)).toBeTruthy();
    });
  });

  // ─── AI 코칭 플레이스홀더 ─────────────────────────────────────────────

  describe('AI 코칭 플레이스홀더', () => {
    it('"AI 코칭 분석 중..." 텍스트가 표시된다', () => {
      const summary = makeSummary();
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText(/AI 코칭 분석 중/)).toBeTruthy();
    });
  });

  // ─── 뒤로가기 버튼 ───────────────────────────────────────────────────

  describe('운동 선택으로 돌아가기 버튼', () => {
    it('"운동 선택으로 돌아가기" 버튼이 렌더링된다', () => {
      const summary = makeSummary();
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      expect(getByText('운동 선택으로 돌아가기')).toBeTruthy();
    });

    it('버튼 클릭 시 WorkoutSelection으로 네비게이션한다', () => {
      const summary = makeSummary();
      const { getByText } = render(
        <SessionSummaryScreen navigation={mockNavigation} route={makeRoute(summary)} />,
      );
      fireEvent.press(getByText('운동 선택으로 돌아가기'));
      expect(mockNavigate).toHaveBeenCalledWith('WorkoutSelection');
    });
  });
});
