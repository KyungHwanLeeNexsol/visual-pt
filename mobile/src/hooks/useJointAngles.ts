// SPEC-UI-001: M2 관절 각도 계산 훅

import { useMemo } from 'react';
import type { JointAngles, ExerciseType } from '../types/pose.types';
import type { FormError } from '../types/feedback.types';
import type { PoseResult } from '../types/pose.types';
import { JointAngleCalculator } from '../services/JointAngleCalculator';

export interface UseJointAnglesResult {
  angles: JointAngles | null;
  errors: FormError[];
}

// 싱글톤 계산기 (렌더 사이클마다 재생성 방지)
const calculator = new JointAngleCalculator();

export function useJointAngles(
  landmarks: PoseResult['landmarks'] | null,
  exercise: ExerciseType | null,
): UseJointAnglesResult {
  return useMemo(() => {
    if (landmarks === null || exercise === null) {
      return { angles: null, errors: [] };
    }

    const angles = calculator.calculateAngles(landmarks, exercise);
    const errors = calculator.detectErrors(angles, exercise);

    return { angles, errors };
  }, [landmarks, exercise]);
}
