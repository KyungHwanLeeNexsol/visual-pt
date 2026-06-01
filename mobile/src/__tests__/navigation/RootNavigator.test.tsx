// SPEC-UI-002: N1 네비게이터 통합 테스트

// react-navigation 모킹 (virtual: true — 패키지 미설치 상태에서도 동작)
jest.mock(
  '@react-navigation/native-stack',
  () => ({
    createNativeStackNavigator: jest.fn(() => ({
      Navigator: ({ children }: { children: React.ReactNode }) => children,
      Screen: () => null,
    })),
  }),
  { virtual: true },
);

jest.mock(
  '@react-navigation/native',
  () => ({
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
    useNavigation: jest.fn(),
    useRoute: jest.fn(() => ({ params: {} })),
  }),
  { virtual: true },
);

jest.mock(
  'react-native-safe-area-context',
  () => ({
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  }),
  { virtual: true },
);

// 화면 컴포넌트 모킹 (CameraScreen 의존성 없이 테스트)
jest.mock('../../screens/HomeScreen', () => ({
  HomeScreen: () => null,
}));

jest.mock('../../screens/WorkoutSelectionScreen', () => ({
  WorkoutSelectionScreen: () => null,
}));

jest.mock('../../screens/CameraScreen', () => ({
  CameraScreen: () => null,
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { RootNavigator } from '../../navigation/RootNavigator';

describe('RootNavigator (AC-N1)', () => {
  it('RootNavigator가 에러 없이 렌더링된다', () => {
    expect(() => {
      render(<RootNavigator />);
    }).not.toThrow();
  });

  it('createNativeStackNavigator를 사용한다', () => {
    const { createNativeStackNavigator } = require('@react-navigation/native-stack');
    render(<RootNavigator />);
    expect(createNativeStackNavigator).toHaveBeenCalled();
  });
});
