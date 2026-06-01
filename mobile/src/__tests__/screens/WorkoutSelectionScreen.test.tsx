// SPEC-UI-002: N3 운동 선택 화면 테스트

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

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutSelectionScreen } from '../../screens/WorkoutSelectionScreen';

// mock navigation prop
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
} as any;

describe('WorkoutSelectionScreen (AC-N3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC-N3: 스쿼트 카드를 렌더링한다', () => {
    const { getByTestId } = render(
      <WorkoutSelectionScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('exercise-card-squat')).toBeTruthy();
  });

  it('AC-N3: 데드리프트 카드를 렌더링한다', () => {
    const { getByTestId } = render(
      <WorkoutSelectionScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('exercise-card-deadlift')).toBeTruthy();
  });

  it('AC-N3: 스쿼트 카드에 이미지 플레이스홀더가 표시된다', () => {
    const { getByTestId } = render(
      <WorkoutSelectionScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('exercise-image-squat')).toBeTruthy();
  });

  it('AC-N3: 데드리프트 카드에 이미지 플레이스홀더가 표시된다', () => {
    const { getByTestId } = render(
      <WorkoutSelectionScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('exercise-image-deadlift')).toBeTruthy();
  });

  it('AC-N3: 스쿼트 시작 버튼 클릭 시 Camera 화면으로 이동하고 exercise=squat를 전달한다', () => {
    const { getByTestId } = render(
      <WorkoutSelectionScreen navigation={mockNavigation} route={{} as any} />,
    );
    fireEvent.press(getByTestId('start-button-squat'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Camera', { exercise: 'squat' });
  });

  it('AC-N3: 데드리프트 시작 버튼 클릭 시 Camera 화면으로 이동하고 exercise=deadlift를 전달한다', () => {
    const { getByTestId } = render(
      <WorkoutSelectionScreen navigation={mockNavigation} route={{} as any} />,
    );
    fireEvent.press(getByTestId('start-button-deadlift'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Camera', { exercise: 'deadlift' });
  });
});
