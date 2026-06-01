// SPEC-UI-001: 운동 세션 상태 (Zustand)

import { create } from 'zustand';
import type { ExerciseType, JointAngles } from '../types/pose.types';

interface WorkoutState {
  selectedExercise: ExerciseType | null;
  isSessionActive: boolean;
  sessionStartTime: number | null;
  currentAngles: JointAngles | null;

  selectExercise: (exercise: ExerciseType) => void;
  startSession: () => void;
  endSession: () => void;
  updateAngles: (angles: JointAngles) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  selectedExercise: null,
  isSessionActive: false,
  sessionStartTime: null,
  currentAngles: null,

  selectExercise: (exercise: ExerciseType): void => {
    set({ selectedExercise: exercise });
  },

  startSession: (): void => {
    set({
      isSessionActive: true,
      sessionStartTime: Date.now(),
    });
  },

  endSession: (): void => {
    set({
      isSessionActive: false,
      sessionStartTime: null,
      currentAngles: null,
    });
  },

  updateAngles: (angles: JointAngles): void => {
    set({ currentAngles: angles });
  },
}));
