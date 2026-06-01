// SPEC-UI-002: 운동 메타데이터 — 이름, 설명, 이미지 키
import type { ExerciseType } from '../types/pose.types';

export interface ExerciseMeta {
  id: ExerciseType;
  name: string;
  description: string;
  // 향후 이미지 에셋 키로 사용
  imageKey: string;
  targetMuscles: string[];
}

// @MX:ANCHOR: EXERCISE_CATALOG는 HomeScreen, WorkoutSelectionScreen에서 참조되는 단일 진실 공급원
// @MX:REASON: 운동 목록 변경 시 이 배열만 수정하면 모든 화면에 자동 반영됨
export const EXERCISE_CATALOG: ExerciseMeta[] = [
  {
    id: 'squat',
    name: '스쿼트',
    description:
      '대퇴사두근과 둔근을 강화하는 기본 하체 운동입니다. 발과 어깨 너비로 서서 무릎이 발끝 방향으로 향하게 앉아주세요.',
    imageKey: 'squat',
    targetMuscles: ['대퇴사두근', '둔근', '햄스트링'],
  },
  {
    id: 'deadlift',
    name: '데드리프트',
    description:
      '전신 근력을 강화하는 복합 운동입니다. 척추를 중립으로 유지하며 엉덩이 힌지 동작으로 바벨을 들어올리세요.',
    imageKey: 'deadlift',
    targetMuscles: ['햄스트링', '둔근', '등 전체', '코어'],
  },
];
