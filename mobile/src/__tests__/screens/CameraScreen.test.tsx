// SPEC-UI-002: CameraScreen 통합 테스트 (N4 리팩터 — 라우트 파라미터 기반)

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { CameraScreen } from '../../screens/CameraScreen';

// 네이티브 모듈 모킹
// Camera는 React 컴포넌트(함수)이면서 static 메서드를 갖는 형태로 모킹해야 함
// jest.mock 팩토리는 호이스팅되므로 내부에서 직접 정의
jest.mock('react-native-vision-camera', () => {
  const MockCamera = Object.assign(jest.fn(() => null), {
    getCameraPermissionStatus: jest.fn().mockReturnValue('not-determined'),
    requestCameraPermission: jest.fn().mockResolvedValue('granted'),
  });
  return {
    Camera: MockCamera,
    useCameraDevice: jest.fn().mockReturnValue({ id: 'back', position: 'back' }),
    // useFrameProcessor: 테스트 환경에서는 워크릿 미지원 — 빈 프로세서 함수 반환
    useFrameProcessor: jest.fn().mockReturnValue(jest.fn()),
  };
}, { virtual: true });

jest.mock('react-native-mediapipe', () => ({
  usePoseLandmarker: jest.fn(() => ({
    detect: jest.fn(),
    isModelLoaded: true,
  })),
}), { virtual: true });

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    default: ({ children, ...props }: any) => React.createElement('Svg', props, children),
    Svg: ({ children, ...props }: any) => React.createElement('Svg', props, children),
    Circle: (props: any) => React.createElement('Circle', props),
    Line: (props: any) => React.createElement('Line', props),
    G: ({ children, ...props }: any) => React.createElement('G', props, children),
  };
}, { virtual: true });

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'), { virtual: true });

jest.mock('expo-speech', () => ({
  speak: jest.fn().mockResolvedValue(undefined),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
  stop: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}), { virtual: true });

// workoutStore 모킹 — selectExercise/startSession/endSession 호출 검증
const mockStartSession = jest.fn();
const mockEndSession = jest.fn();
const mockSelectExercise = jest.fn();
const mockSetActive = jest.fn();

jest.mock('../../store/workoutStore', () => ({
  useWorkoutStore: jest.fn(() => ({
    selectedExercise: null,
    isSessionActive: false,
    startSession: mockStartSession,
    endSession: mockEndSession,
    selectExercise: mockSelectExercise,
    updateAngles: jest.fn(),
  })),
}));

jest.mock('../../store/feedbackStore', () => ({
  useFeedbackStore: jest.fn(() => ({
    setErrors: jest.fn(),
    addMessage: jest.fn(),
    setActive: mockSetActive,
  })),
}));

// usePoseDetection 모킹 — startDetection/stopDetection 호출 검증
const mockStartDetection = jest.fn();
const mockStopDetection = jest.fn();

jest.mock('../../hooks/usePoseDetection', () => ({
  usePoseDetection: jest.fn(() => ({
    latestPose: null,
    isProcessing: false,
    fps: 0,
    startDetection: mockStartDetection,
    stopDetection: mockStopDetection,
    onPoseDetected: jest.fn(),
  })),
  // createPoseCallback: 하위 호환성 유지 export — CameraScreen에서는 더 이상 사용하지 않음
  createPoseCallback: jest.fn(() => jest.fn()),
}));

// SessionAnalyticsService 모킹 — CameraScreen이 사용하는 분석 서비스
jest.mock('../../services/SessionAnalyticsService', () => ({
  SessionAnalyticsService: jest.fn().mockImplementation(() => ({
    startSession: jest.fn(),
    addSnapshot: jest.fn(),
    endSession: jest.fn().mockReturnValue({
      exercise: 'squat',
      totalReps: 0,
      avgAngles: {},
      errorFrequency: {},
      sessionDurationMs: 0,
      snapshotCount: 0,
    }),
    reset: jest.fn(),
  })),
}));

// 네비게이션 mock props 헬퍼
const mockNavigation = {
  navigate: jest.fn(),
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
} as any;

const mockRouteWithExercise = {
  key: 'Camera-1',
  name: 'Camera' as const,
  params: { exercise: 'squat' as const },
};

const mockRouteWithoutExercise = {
  key: 'Camera-2',
  name: 'Camera' as const,
  params: {} as any,
};

describe('CameraScreen (SPEC-UI-002 N4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 기본: 권한 없음 상태
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockResolvedValue('not-determined');
  });

  // ─── 기존 테스트 (navigation props 추가) ─────────────────────────────

  it('권한 없을 때 권한 요청 화면을 렌더링한다', async () => {
    const { getByTestId, getByText } = render(
      <CameraScreen navigation={mockNavigation} route={mockRouteWithExercise} />,
    );
    await act(async () => {});
    expect(getByTestId('permission-screen')).toBeTruthy();
    expect(getByText('카메라 접근 권한이 필요합니다')).toBeTruthy();
  });

  it('법적 면책 고지 텍스트가 표시된다', async () => {
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockReturnValue('granted');

    const { getByText } = render(
      <CameraScreen navigation={mockNavigation} route={mockRouteWithExercise} />,
    );
    await act(async () => {});
    expect(getByText('⚠ 의료·재활 진단 도구가 아닙니다')).toBeTruthy();
  });

  // ─── N4 신규 테스트 ───────────────────────────────────────────────────

  it('AC-N4: 마운트 시 route.params.exercise로 자동 세션 시작', async () => {
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockResolvedValue('granted');

    render(
      <CameraScreen navigation={mockNavigation} route={mockRouteWithExercise} />,
    );
    await act(async () => {});

    expect(mockSelectExercise).toHaveBeenCalledWith('squat');
    expect(mockStartSession).toHaveBeenCalledTimes(1);
    expect(mockStartDetection).toHaveBeenCalledWith('squat');
  });

  it('AC-N4: route.params.exercise 없으면 navigation.goBack 호출', async () => {
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockResolvedValue('granted');

    render(
      <CameraScreen navigation={mockNavigation} route={mockRouteWithoutExercise} />,
    );
    await act(async () => {});

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    expect(mockStartSession).not.toHaveBeenCalled();
    expect(mockStartDetection).not.toHaveBeenCalled();
  });

  it('AC-N4: 언마운트 시 세션·추론 정리', async () => {
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockResolvedValue('granted');

    const { unmount } = render(
      <CameraScreen navigation={mockNavigation} route={mockRouteWithExercise} />,
    );
    await act(async () => {});

    unmount();

    expect(mockEndSession).toHaveBeenCalledTimes(1);
    expect(mockStopDetection).toHaveBeenCalledTimes(1);
  });

  it('start-session-button이 존재하지 않는다 (수동 시작 버튼 제거)', async () => {
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockResolvedValue('granted');

    const { queryByTestId } = render(
      <CameraScreen navigation={mockNavigation} route={mockRouteWithExercise} />,
    );
    await act(async () => {});

    expect(queryByTestId('start-session-button')).toBeNull();
  });
});
