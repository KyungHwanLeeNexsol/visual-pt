// SPEC-UI-001: CameraOverlay 컴포넌트 테스트 (AC-7)

// react-native-svg mock
jest.mock(
  'react-native-svg',
  () => {
    const React = require('react');
    const Svg = ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('Svg', props, children);
    const Circle = (props: Record<string, unknown>) => React.createElement('Circle', props);
    const Line = (props: Record<string, unknown>) => React.createElement('Line', props);
    const G = ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('G', props, children);
    return { default: Svg, Svg, Circle, Line, G };
  },
  { virtual: true },
);

// react-native-reanimated mock
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'), {
  virtual: true,
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { CameraOverlay } from '../../components/CameraOverlay';
import type { FormError } from '../../types/feedback.types';

// 테스트용 랜드마크 생성 헬퍼
function makeLandmarks(count = 33) {
  return Array.from({ length: count }, (_, i) => ({
    x: 0.1 + (i % 5) * 0.1,
    y: 0.1 + Math.floor(i / 5) * 0.1,
    visibility: 0.9,
  }));
}

function makeFormError(): FormError {
  return {
    type: 'KNEE_ANGLE_OUT_OF_RANGE',
    joint: 'leftKnee',
    currentValue: 50,
    expectedRange: [70, 170],
    message: '무릎을 더 펴세요',
  };
}

describe('CameraOverlay (AC-7)', () => {
  it('AC-7: landmarks=null일 때 에러 없이 렌더링된다', () => {
    expect(() => {
      render(
        <CameraOverlay landmarks={null} errors={[]} width={375} height={667} />,
      );
    }).not.toThrow();
  });

  it('랜드마크가 제공될 때 에러 없이 렌더링된다', () => {
    const landmarks = makeLandmarks();
    expect(() => {
      render(
        <CameraOverlay landmarks={landmarks} errors={[]} width={375} height={667} />,
      );
    }).not.toThrow();
  });

  it('에러 없는 관절은 기본 색상(#00FF00 또는 lime)으로 렌더링된다', () => {
    const landmarks = makeLandmarks();
    const { toJSON } = render(
      <CameraOverlay landmarks={landmarks} errors={[]} width={375} height={667} />,
    );
    const json = JSON.stringify(toJSON());
    // 기본 색상이 포함되어야 함
    expect(json).toMatch(/#00FF00|lime|#00ff00/i);
  });

  it('오류가 있는 관절은 에러 색상(#FF0000 또는 red)으로 렌더링된다', () => {
    const landmarks = makeLandmarks();
    const errors = [makeFormError()];
    const { toJSON } = render(
      <CameraOverlay landmarks={landmarks} errors={errors} width={375} height={667} />,
    );
    const json = JSON.stringify(toJSON());
    // 에러 색상이 포함되어야 함
    expect(json).toMatch(/#FF0000|red|#ff0000/i);
  });

  it('SKELETON_CONNECTIONS 상수가 export된다', () => {
    const { SKELETON_CONNECTIONS } = require('../../components/CameraOverlay');
    expect(Array.isArray(SKELETON_CONNECTIONS)).toBe(true);
    expect(SKELETON_CONNECTIONS.length).toBeGreaterThan(0);
    // 각 연결은 [number, number] 형태
    expect(SKELETON_CONNECTIONS[0]).toHaveLength(2);
  });
});
