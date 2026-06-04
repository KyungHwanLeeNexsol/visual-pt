// SPEC-UI-001: useJointAngles 훅 단위 테스트 (Phase C)

import { renderHook } from '@testing-library/react-native';
import type { Keypoint } from '../../types/pose.types';
import { useJointAngles } from '../../hooks/useJointAngles';

// 테스트용 가시적 키포인트 생성 헬퍼
function makeKeypoint(x: number, y: number, visibility = 0.9): Keypoint {
  return { x, y, z: 0, visibility };
}

// 33개 가시적 랜드마크 생성 (MediaPipe 표준 인덱스)
function makeLandmarks(count = 33): Keypoint[] {
  return Array.from({ length: count }, (_, i) =>
    makeKeypoint(0.1 + (i % 5) * 0.1, 0.1 + Math.floor(i / 5) * 0.1),
  );
}

describe('useJointAngles', () => {
  it('landmarks가 null이면 angles는 null이고 errors는 빈 배열이다', () => {
    const { result } = renderHook(() => useJointAngles(null, 'squat'));

    expect(result.current.angles).toBeNull();
    expect(result.current.errors).toEqual([]);
  });

  it('exercise가 null이면 angles는 null이고 errors는 빈 배열이다', () => {
    const landmarks = makeLandmarks();
    const { result } = renderHook(() => useJointAngles(landmarks, null));

    expect(result.current.angles).toBeNull();
    expect(result.current.errors).toEqual([]);
  });

  it('유효한 landmarks가 제공되면 angles 객체를 반환한다', () => {
    const landmarks = makeLandmarks();
    const { result } = renderHook(() => useJointAngles(landmarks, 'squat'));

    // angles가 null이 아닌 객체여야 한다
    expect(result.current.angles).not.toBeNull();
    expect(typeof result.current.angles).toBe('object');
  });

  it('errors 배열을 반환한다 (빈 배열 또는 오류 포함)', () => {
    const landmarks = makeLandmarks();
    const { result } = renderHook(() => useJointAngles(landmarks, 'squat'));

    expect(Array.isArray(result.current.errors)).toBe(true);
  });

  it('landmarks가 변경되면 결과가 재계산된다', () => {
    const landmarks1 = makeLandmarks();
    const { result, rerender } = renderHook(
      ({ lm, ex }: { lm: Keypoint[] | null; ex: 'squat' | 'deadlift' | null }) =>
        useJointAngles(lm, ex),
      { initialProps: { lm: landmarks1 as Keypoint[] | null, ex: 'squat' as 'squat' | 'deadlift' | null } },
    );

    const angles1 = result.current.angles;

    // null로 변경
    rerender({ lm: null, ex: 'squat' });
    expect(result.current.angles).toBeNull();

    // 다시 landmarks 제공
    rerender({ lm: landmarks1, ex: 'squat' });
    // angles1과 동일한 구조여야 함 (값은 같을 수 있음)
    expect(result.current.angles).not.toBeNull();
    void angles1; // lint 경고 방지
  });
});
