// SPEC-UI-001: usePoseDetection 훅 단위 테스트 (Phase C)

// PoseEstimationService mock
jest.mock('../../services/PoseEstimationService', () => ({
  PoseEstimationService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    isInitialized: jest.fn().mockReturnValue(false),
  })),
}));

// react-native-mediapipe 네이티브 모듈 mock
jest.mock(
  'react-native-mediapipe',
  () => ({
    usePoseLandmarker: jest.fn(() => ({
      detect: jest.fn(),
      isModelLoaded: false,
    })),
    PoseLandmarker: {
      createFromOptions: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockResolvedValue(undefined),
    },
  }),
  { virtual: true },
);

// react-native-reanimated mock
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'), {
  virtual: true,
});

import { renderHook, act } from '@testing-library/react-native';
import { usePoseDetection } from '../../hooks/usePoseDetection';

describe('usePoseDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('초기 상태: latestPose=null, isProcessing=false', () => {
    const { result } = renderHook(() => usePoseDetection());

    expect(result.current.latestPose).toBeNull();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.fps).toBe(0);
  });

  it('startDetection() 호출 후 isProcessing이 true가 된다', async () => {
    const { result } = renderHook(() => usePoseDetection());

    await act(async () => {
      result.current.startDetection('squat');
      await Promise.resolve();
    });

    expect(result.current.isProcessing).toBe(true);
  });

  it('stopDetection() 호출 후 isProcessing이 false가 된다', async () => {
    const { result } = renderHook(() => usePoseDetection());

    await act(async () => {
      result.current.startDetection('squat');
      await Promise.resolve();
    });

    await act(async () => {
      result.current.stopDetection();
      await Promise.resolve();
    });

    expect(result.current.isProcessing).toBe(false);
  });

  it('startDetection()과 stopDetection() 함수가 존재한다', () => {
    const { result } = renderHook(() => usePoseDetection());

    expect(typeof result.current.startDetection).toBe('function');
    expect(typeof result.current.stopDetection).toBe('function');
  });
});
