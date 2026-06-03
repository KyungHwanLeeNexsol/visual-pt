// SPEC-UI-002: N2 홈 화면 테스트

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
import { HomeScreen } from '../../screens/HomeScreen';

// mock navigation prop
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
} as any;

describe('HomeScreen (AC-N2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC-N2: "Visual PT" 타이틀을 렌더링한다', () => {
    const { getByTestId } = render(<HomeScreen navigation={mockNavigation} route={{} as any} />);
    const title = getByTestId('home-title');
    expect(title).toBeTruthy();
    expect(title.props.children).toBe('Visual PT');
  });

  it('AC-N2: "운동 시작" 버튼을 렌더링한다', () => {
    const { getByTestId } = render(<HomeScreen navigation={mockNavigation} route={{} as any} />);
    expect(getByTestId('start-workout-button')).toBeTruthy();
  });

  it('AC-N2: 운동 목록에 "스쿼트"와 "데드리프트"가 포함된다', () => {
    const { getByTestId, getByText } = render(
      <HomeScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('exercise-list')).toBeTruthy();
    expect(getByText('스쿼트')).toBeTruthy();
    expect(getByText('데드리프트')).toBeTruthy();
  });

  it('AC-N2: 법적 면책 고지를 렌더링한다', () => {
    const { getByTestId, getByText } = render(
      <HomeScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('legal-disclaimer')).toBeTruthy();
    // Text 컴포넌트 children에 면책 문구 포함 여부 확인
    expect(getByText(/의료 진단을 대체하지 않습니다/)).toBeTruthy();
  });

  it('AC-N2: "운동 시작" 버튼 클릭 시 WorkoutSelection으로 navigate한다', () => {
    const { getByTestId } = render(<HomeScreen navigation={mockNavigation} route={{} as any} />);
    fireEvent.press(getByTestId('start-workout-button'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('WorkoutSelection');
  });
});
