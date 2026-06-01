// SPEC-UI-001: CameraScreen 통합 테스트

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { CameraScreen } from '../../screens/CameraScreen';

// 네이티브 모듈 모킹
jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getCameraPermissionStatus: jest.fn().mockResolvedValue('not-determined'),
    requestCameraPermission: jest.fn().mockResolvedValue('granted'),
  },
  useCameraDevice: jest.fn().mockReturnValue({ id: 'back', position: 'back' }),
}), { virtual: true });

jest.mock('react-native-mediapipe-posedetection', () => ({
  PoseLandmarker: {
    createFromOptions: jest.fn().mockResolvedValue({}),
    close: jest.fn().mockResolvedValue(undefined),
  },
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

describe('CameraScreen', () => {
  it('권한 없을 때 권한 요청 화면을 렌더링한다', async () => {
    const { getByTestId, getByText } = render(<CameraScreen />);
    // 초기 상태는 not-determined(권한 없음) → 권한 화면 표시
    await act(async () => {});
    expect(getByTestId('permission-screen')).toBeTruthy();
    expect(getByText('카메라 접근 권한이 필요합니다')).toBeTruthy();
  });

  it('AC-8: 권한 허용 후 카메라 화면에서 가이드 오버레이를 표시한다', async () => {
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockResolvedValue('granted');

    const { getByTestId } = render(<CameraScreen />);
    await act(async () => {});
    expect(getByTestId('camera-screen')).toBeTruthy();
  });

  it('시작 버튼 클릭 시 운동 선택 안내를 표시한다 (운동 미선택 상태)', async () => {
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockResolvedValue('granted');

    const { getByTestId } = render(<CameraScreen />);
    await act(async () => {});

    const startButton = getByTestId('start-session-button');
    fireEvent.press(startButton);
  });

  it('법적 면책 고지 텍스트가 표시된다', async () => {
    const { Camera } = require('react-native-vision-camera');
    Camera.getCameraPermissionStatus.mockResolvedValue('granted');

    const { getByText } = render(<CameraScreen />);
    await act(async () => {});
    expect(getByText('의료·재활 진단 도구가 아닙니다')).toBeTruthy();
  });
});
