// SPEC-UI-001: CameraGuideOverlay 컴포넌트 테스트 (AC-8, AC-9)

import React from 'react';
import { render } from '@testing-library/react-native';
import { CameraGuideOverlay } from '../../components/CameraGuideOverlay';

describe('CameraGuideOverlay (AC-8, AC-9)', () => {
  it('AC-8: isVisible=true일 때 가이드가 렌더링된다', () => {
    const { toJSON } = render(
      <CameraGuideOverlay isVisible={true} angleQuality="good" />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('isVisible=false일 때 null을 반환한다', () => {
    const { toJSON } = render(
      <CameraGuideOverlay isVisible={false} angleQuality="good" />,
    );
    expect(toJSON()).toBeNull();
  });

  it('AC-9: angleQuality=poor 일 때 재배치 경고를 표시한다', () => {
    const { getByText } = render(
      <CameraGuideOverlay isVisible={true} angleQuality="poor" />,
    );
    // 재배치 경고 메시지가 구체적으로 표시되어야 함
    const output = getByText(/재배치/i);
    expect(output).toBeTruthy();
  });

  it('AC-9: angleQuality=warning 일 때 재배치 경고를 표시한다', () => {
    const { getByText } = render(
      <CameraGuideOverlay isVisible={true} angleQuality="warning" />,
    );
    const output = getByText(/재배치/i);
    expect(output).toBeTruthy();
  });

  it('angleQuality=good 일 때 경고를 표시하지 않는다', () => {
    const { queryByText } = render(
      <CameraGuideOverlay isVisible={true} angleQuality="good" />,
    );
    // "재배치" 경고 텍스트가 없어야 함
    const warningText = queryByText(/재배치/i);
    expect(warningText).toBeNull();
  });

  it('isVisible=true일 때 "측면 45도, 골반 높이" 위치 안내 텍스트를 표시한다', () => {
    const { getByText } = render(
      <CameraGuideOverlay isVisible={true} angleQuality="good" />,
    );
    expect(getByText(/측면.*45도|골반.*높이|45도.*측면/i)).toBeTruthy();
  });

  it('onDismiss 콜백이 있을 때 에러 없이 렌더링된다', () => {
    const onDismiss = jest.fn();
    expect(() => {
      render(
        <CameraGuideOverlay isVisible={true} angleQuality="good" onDismiss={onDismiss} />,
      );
    }).not.toThrow();
  });
});
