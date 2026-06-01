// SPEC-UI-001: useFeedback 훅 단위 테스트 (Phase C)

// AudioFeedbackService mock
const mockPlayFeedback = jest.fn().mockResolvedValue(true);
jest.mock('../../services/AudioFeedbackService', () => ({
  AudioFeedbackService: jest.fn().mockImplementation(() => ({
    playFeedback: mockPlayFeedback,
    resetDebounce: jest.fn(),
    isDebounced: jest.fn().mockReturnValue(false),
  })),
}));

// expo-speech mock (AudioFeedbackService 내부에서 사용)
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
  stop: jest.fn(),
}));

import { renderHook, act } from '@testing-library/react-native';
import { useFeedback } from '../../hooks/useFeedback';
import type { FormError } from '../../types/feedback.types';

// 테스트용 FormError 팩토리
function makeFormError(type: FormError['type'] = 'KNEE_ANGLE_OUT_OF_RANGE'): FormError {
  return {
    type,
    joint: 'leftKnee',
    currentValue: 50,
    expectedRange: [70, 170],
    message: '무릎을 더 펴세요',
  };
}

describe('useFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayFeedback.mockResolvedValue(true);
  });

  it('초기 상태: currentMessage=null, isDisplaying=false', () => {
    const { result } = renderHook(() => useFeedback());

    expect(result.current.currentMessage).toBeNull();
    expect(result.current.isDisplaying).toBe(false);
  });

  it('triggerFeedback에 에러 배열을 전달하면 currentMessage가 업데이트된다', async () => {
    const { result } = renderHook(() => useFeedback());
    const errors = [makeFormError('KNEE_ANGLE_OUT_OF_RANGE')];

    await act(async () => {
      result.current.triggerFeedback(errors, 'squat');
      await Promise.resolve();
    });

    expect(result.current.currentMessage).not.toBeNull();
  });

  it('triggerFeedback에 빈 배열을 전달하면 currentMessage가 null이 된다', async () => {
    const { result } = renderHook(() => useFeedback());

    // 먼저 에러 설정
    await act(async () => {
      result.current.triggerFeedback([makeFormError()], 'squat');
      await Promise.resolve();
    });

    // 빈 배열로 클리어
    await act(async () => {
      result.current.triggerFeedback([], 'squat');
      await Promise.resolve();
    });

    expect(result.current.currentMessage).toBeNull();
  });

  it('에러가 있을 때 AudioFeedbackService.playFeedback이 호출된다', async () => {
    const { result } = renderHook(() => useFeedback());
    const errors = [makeFormError('SPINE_MISALIGNMENT')];

    await act(async () => {
      result.current.triggerFeedback(errors, 'squat');
      await Promise.resolve();
    });

    expect(mockPlayFeedback).toHaveBeenCalled();
  });

  it('triggerFeedback 함수가 존재한다', () => {
    const { result } = renderHook(() => useFeedback());
    expect(typeof result.current.triggerFeedback).toBe('function');
  });
});
