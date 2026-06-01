// SPEC-UI-001: workoutStore Zustand 단위 테스트

import { act } from '@testing-library/react-native';

describe('workoutStore', () => {
  let useWorkoutStore: typeof import('../../store/workoutStore').useWorkoutStore;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require('../../store/workoutStore') as {
        useWorkoutStore: typeof import('../../store/workoutStore').useWorkoutStore;
      };
      useWorkoutStore = module.useWorkoutStore;
    });
  });

  describe('초기 상태', () => {
    it('selectedExercise 초기값은 null이다', () => {
      expect(useWorkoutStore.getState().selectedExercise).toBeNull();
    });

    it('isSessionActive 초기값은 false이다', () => {
      expect(useWorkoutStore.getState().isSessionActive).toBe(false);
    });

    it('sessionStartTime 초기값은 null이다', () => {
      expect(useWorkoutStore.getState().sessionStartTime).toBeNull();
    });

    it('currentAngles 초기값은 null이다', () => {
      expect(useWorkoutStore.getState().currentAngles).toBeNull();
    });
  });

  describe('selectExercise', () => {
    it('selectExercise("squat") 호출 시 selectedExercise 가 "squat"이 된다', () => {
      act(() => {
        useWorkoutStore.getState().selectExercise('squat');
      });
      expect(useWorkoutStore.getState().selectedExercise).toBe('squat');
    });

    it('selectExercise("deadlift") 호출 시 selectedExercise 가 "deadlift"이 된다', () => {
      act(() => {
        useWorkoutStore.getState().selectExercise('deadlift');
      });
      expect(useWorkoutStore.getState().selectedExercise).toBe('deadlift');
    });
  });

  describe('startSession', () => {
    it('startSession 호출 시 isSessionActive 가 true가 된다', () => {
      act(() => {
        useWorkoutStore.getState().startSession();
      });
      expect(useWorkoutStore.getState().isSessionActive).toBe(true);
    });

    it('startSession 호출 시 sessionStartTime 이 기록된다 (null 이 아님)', () => {
      const before = Date.now();
      act(() => {
        useWorkoutStore.getState().startSession();
      });
      const after = Date.now();
      const startTime = useWorkoutStore.getState().sessionStartTime;
      expect(startTime).not.toBeNull();
      expect(startTime!).toBeGreaterThanOrEqual(before);
      expect(startTime!).toBeLessThanOrEqual(after);
    });
  });

  describe('endSession', () => {
    it('endSession 호출 시 isSessionActive 가 false가 된다', () => {
      act(() => {
        useWorkoutStore.getState().startSession();
        useWorkoutStore.getState().endSession();
      });
      expect(useWorkoutStore.getState().isSessionActive).toBe(false);
    });

    it('endSession 호출 시 sessionStartTime 이 null이 된다', () => {
      act(() => {
        useWorkoutStore.getState().startSession();
        useWorkoutStore.getState().endSession();
      });
      expect(useWorkoutStore.getState().sessionStartTime).toBeNull();
    });

    it('endSession 호출 시 currentAngles 가 null이 된다', () => {
      act(() => {
        useWorkoutStore.getState().startSession();
        useWorkoutStore.getState().updateAngles({ leftKnee: 90 });
        useWorkoutStore.getState().endSession();
      });
      expect(useWorkoutStore.getState().currentAngles).toBeNull();
    });
  });

  describe('updateAngles', () => {
    it('updateAngles 호출 시 currentAngles 가 업데이트된다', () => {
      const angles = { leftKnee: 90, rightKnee: 95 };
      act(() => {
        useWorkoutStore.getState().updateAngles(angles);
      });
      expect(useWorkoutStore.getState().currentAngles).toEqual(angles);
    });

    it('부분 각도 업데이트도 정상 동작한다', () => {
      act(() => {
        useWorkoutStore.getState().updateAngles({ leftKnee: 85 });
      });
      expect(useWorkoutStore.getState().currentAngles?.leftKnee).toBe(85);
    });

    it('연속 updateAngles 호출 시 마지막 값으로 덮어써진다', () => {
      act(() => {
        useWorkoutStore.getState().updateAngles({ leftKnee: 90 });
        useWorkoutStore.getState().updateAngles({ leftKnee: 100, rightKnee: 105 });
      });
      expect(useWorkoutStore.getState().currentAngles).toEqual({ leftKnee: 100, rightKnee: 105 });
    });
  });
});
