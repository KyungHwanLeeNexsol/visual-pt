// SPEC-UI-001: FeedbackBadge 컴포넌트 테스트 (AC-5)

import React from 'react';
import { render } from '@testing-library/react-native';
import { FeedbackBadge } from '../../components/FeedbackBadge';
import type { FeedbackMessage } from '../../types/feedback.types';

function makeFeedbackMessage(overrides?: Partial<FeedbackMessage>): FeedbackMessage {
  return {
    id: 'test-id',
    errorType: 'KNEE_ANGLE_OUT_OF_RANGE',
    text: '무릎을 더 펴세요',
    speechText: '무릎을 더 펴세요',
    severity: 'warning',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('FeedbackBadge (AC-5)', () => {
  it('visible=false일 때 null을 반환한다', () => {
    const message = makeFeedbackMessage();
    const { toJSON } = render(<FeedbackBadge message={message} visible={false} />);
    expect(toJSON()).toBeNull();
  });

  it('message=null일 때 null을 반환한다', () => {
    const { toJSON } = render(<FeedbackBadge message={null} visible={true} />);
    expect(toJSON()).toBeNull();
  });

  it('AC-5: visible=true이고 message가 있을 때 message.text를 표시한다', () => {
    const message = makeFeedbackMessage({ text: '무릎을 더 펴세요' });
    const { getByText } = render(<FeedbackBadge message={message} visible={true} />);
    expect(getByText('무릎을 더 펴세요')).toBeTruthy();
  });

  it('message와 visible이 모두 있을 때 컴포넌트가 렌더링된다', () => {
    const message = makeFeedbackMessage({ text: '척추를 중립으로 유지하세요' });
    const { getByText } = render(<FeedbackBadge message={message} visible={true} />);
    expect(getByText('척추를 중립으로 유지하세요')).toBeTruthy();
  });

  it('message가 null이고 visible=false일 때도 null을 반환한다', () => {
    const { toJSON } = render(<FeedbackBadge message={null} visible={false} />);
    expect(toJSON()).toBeNull();
  });
});
