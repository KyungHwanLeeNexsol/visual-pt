// SPEC-UI-001: JointAngleDisplay 컴포넌트 테스트

import React from 'react';
import { render } from '@testing-library/react-native';
import { JointAngleDisplay } from '../../components/JointAngleDisplay';
import type { JointAngles } from '../../types/pose.types';

describe('JointAngleDisplay', () => {
  it('angles=null일 때 null을 반환한다', () => {
    const { toJSON } = render(<JointAngleDisplay angles={null} />);
    expect(toJSON()).toBeNull();
  });

  it('visible=false일 때 null을 반환한다', () => {
    const angles: JointAngles = { leftKnee: 90, rightKnee: 95 };
    const { toJSON } = render(<JointAngleDisplay angles={angles} visible={false} />);
    expect(toJSON()).toBeNull();
  });

  it('무릎 각도 값이 있을 때 렌더링된다', () => {
    const angles: JointAngles = { leftKnee: 90.5, rightKnee: 95.3 };
    const { toJSON } = render(<JointAngleDisplay angles={angles} />);
    expect(toJSON()).not.toBeNull();
  });

  it('척추 각도가 있을 때 렌더링된다', () => {
    const angles: JointAngles = { spine: 175 };
    const { toJSON } = render(<JointAngleDisplay angles={angles} />);
    expect(toJSON()).not.toBeNull();
  });

  it('visible=true(기본값)이고 angles가 있으면 렌더링된다', () => {
    const angles: JointAngles = { leftKnee: 90 };
    const { toJSON } = render(<JointAngleDisplay angles={angles} visible={true} />);
    expect(toJSON()).not.toBeNull();
  });

  it('모든 각도가 undefined인 angles 객체가 전달되어도 에러 없이 렌더링된다', () => {
    const angles: JointAngles = {};
    expect(() => {
      render(<JointAngleDisplay angles={angles} />);
    }).not.toThrow();
  });
});
