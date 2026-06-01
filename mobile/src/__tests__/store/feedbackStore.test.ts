// SPEC-UI-001: feedbackStore Zustand 단위 테스트

import { act } from '@testing-library/react-native';
import type { FormError, FeedbackMessage } from '../../types/feedback.types';

// Zustand store 는 싱글턴이므로 각 테스트에서 상태를 초기화해야 함
// beforeEach 에서 clearMessages / setActive(false) 로 초기화

describe('feedbackStore', () => {
  // 동적 import 로 각 테스트마다 새 인스턴스를 얻기 위해 jest.isolateModules 사용
  let useFeedbackStore: typeof import('../../store/feedbackStore').useFeedbackStore;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require('../../store/feedbackStore') as {
        useFeedbackStore: typeof import('../../store/feedbackStore').useFeedbackStore;
      };
      useFeedbackStore = module.useFeedbackStore;
    });
  });

  function makeError(type: FormError['type'] = 'KNEE_ANGLE_OUT_OF_RANGE'): FormError {
    return {
      type,
      joint: 'leftKnee',
      currentValue: 60,
      expectedRange: [80, 120],
      message: '테스트 에러',
    };
  }

  function makeMessage(id = 'msg-1'): FeedbackMessage {
    return {
      id,
      errorType: 'KNEE_ANGLE_OUT_OF_RANGE',
      text: '무릎을 더 펴세요',
      speechText: '무릎을 더 펴세요',
      severity: 'warning',
      timestamp: Date.now(),
    };
  }

  describe('setErrors', () => {
    it('setErrors 호출 시 currentErrors 가 업데이트된다', () => {
      const errors = [makeError()];
      act(() => {
        useFeedbackStore.getState().setErrors(errors);
      });
      expect(useFeedbackStore.getState().currentErrors).toEqual(errors);
    });

    it('빈 배열로 setErrors 호출 시 currentErrors 가 비워진다', () => {
      act(() => {
        useFeedbackStore.getState().setErrors([makeError()]);
        useFeedbackStore.getState().setErrors([]);
      });
      expect(useFeedbackStore.getState().currentErrors).toHaveLength(0);
    });

    it('여러 에러로 setErrors 호출 시 모두 저장된다', () => {
      const errors = [makeError('KNEE_ANGLE_OUT_OF_RANGE'), makeError('SPINE_MISALIGNMENT')];
      act(() => {
        useFeedbackStore.getState().setErrors(errors);
      });
      expect(useFeedbackStore.getState().currentErrors).toHaveLength(2);
    });
  });

  describe('addMessage', () => {
    it('addMessage 호출 시 lastMessages 에 추가된다', () => {
      const msg = makeMessage('msg-1');
      act(() => {
        useFeedbackStore.getState().addMessage(msg);
      });
      expect(useFeedbackStore.getState().lastMessages).toContainEqual(msg);
    });

    it('최대 10개 메시지를 유지한다 (11번째 추가 시 가장 오래된 것 제거)', () => {
      act(() => {
        for (let i = 0; i < 11; i++) {
          useFeedbackStore.getState().addMessage(makeMessage(`msg-${i}`));
        }
      });
      const messages = useFeedbackStore.getState().lastMessages;
      expect(messages).toHaveLength(10);
      // 가장 오래된 msg-0 은 제거됨
      expect(messages.some((m) => m.id === 'msg-0')).toBe(false);
      expect(messages.some((m) => m.id === 'msg-10')).toBe(true);
    });

    it('10개 이하면 모두 유지된다', () => {
      act(() => {
        for (let i = 0; i < 5; i++) {
          useFeedbackStore.getState().addMessage(makeMessage(`msg-${i}`));
        }
      });
      expect(useFeedbackStore.getState().lastMessages).toHaveLength(5);
    });
  });

  describe('clearMessages', () => {
    it('clearMessages 호출 시 lastMessages 가 빈 배열이 된다', () => {
      act(() => {
        useFeedbackStore.getState().addMessage(makeMessage('msg-1'));
        useFeedbackStore.getState().addMessage(makeMessage('msg-2'));
        useFeedbackStore.getState().clearMessages();
      });
      expect(useFeedbackStore.getState().lastMessages).toHaveLength(0);
    });
  });

  describe('setActive', () => {
    it('setActive(true) 호출 시 isActive 가 true가 된다', () => {
      act(() => {
        useFeedbackStore.getState().setActive(true);
      });
      expect(useFeedbackStore.getState().isActive).toBe(true);
    });

    it('setActive(false) 호출 시 isActive 가 false가 된다', () => {
      act(() => {
        useFeedbackStore.getState().setActive(true);
        useFeedbackStore.getState().setActive(false);
      });
      expect(useFeedbackStore.getState().isActive).toBe(false);
    });
  });

  describe('초기 상태', () => {
    it('currentErrors 초기값은 빈 배열이다', () => {
      expect(useFeedbackStore.getState().currentErrors).toEqual([]);
    });

    it('lastMessages 초기값은 빈 배열이다', () => {
      expect(useFeedbackStore.getState().lastMessages).toEqual([]);
    });

    it('isActive 초기값은 false이다', () => {
      expect(useFeedbackStore.getState().isActive).toBe(false);
    });
  });
});
