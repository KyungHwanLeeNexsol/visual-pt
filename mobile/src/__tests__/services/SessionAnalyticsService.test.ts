// SPEC-ENHANCE-001 E2: SessionAnalyticsService 단위 테스트

import { SessionAnalyticsService } from '../../services/SessionAnalyticsService';
import type { SessionSummary } from '../../services/SessionAnalyticsService';
import type { JointAngles } from '../../types/pose.types';
import type { FormError } from '../../types/feedback.types';

// 테스트 헬퍼: 특정 각도로 FormError 생성
function makeError(type: FormError['type']): FormError {
  return {
    type,
    joint: 'leftKnee',
    currentValue: 80,
    expectedRange: [90, 170],
    message: '테스트 오류',
  };
}

// 스쿼트 1렙 시뮬레이션: top → descend → bottom → ascend → top
function buildSquatRepAngles(): Array<{ angles: JointAngles; ts: number }> {
  return [
    { angles: { leftKnee: 160 }, ts: 0 },   // 시작(top)
    { angles: { leftKnee: 130 }, ts: 100 },  // 경계(top)
    { angles: { leftKnee: 110 }, ts: 200 },  // 내려가는 중
    { angles: { leftKnee: 90 }, ts: 300 },   // bottom 진입
    { angles: { leftKnee: 80 }, ts: 400 },   // bottom
    { angles: { leftKnee: 110 }, ts: 500 },  // 올라가는 중
    { angles: { leftKnee: 135 }, ts: 600 },  // top 복귀(rep 완료)
  ];
}

// 데드리프트 1렙 시뮬레이션
function buildDeadliftRepAngles(): Array<{ angles: JointAngles; ts: number }> {
  return [
    { angles: { leftHip: 110 }, ts: 0 },   // 시작(top)
    { angles: { leftHip: 100 }, ts: 100 },  // 경계(top)
    { angles: { leftHip: 80 }, ts: 200 },   // 내려가는 중
    { angles: { leftHip: 55 }, ts: 300 },   // bottom 진입
    { angles: { leftHip: 45 }, ts: 400 },   // bottom
    { angles: { leftHip: 80 }, ts: 500 },   // 올라가는 중
    { angles: { leftHip: 105 }, ts: 600 },  // top 복귀(rep 완료)
  ];
}

describe('SessionAnalyticsService', () => {
  let service: SessionAnalyticsService;

  beforeEach(() => {
    service = new SessionAnalyticsService();
  });

  // ─── 초기화 ────────────────────────────────────────────────────────────

  describe('startSession', () => {
    it('startSession 호출 시 서비스가 분석 상태가 된다', () => {
      expect(() => service.startSession('squat', 1000)).not.toThrow();
    });
  });

  // ─── 스냅샷 누적 ────────────────────────────────────────────────────────

  describe('addSnapshot', () => {
    it('addSnapshot 호출 시 데이터가 누적된다 (snapshotCount 증가)', () => {
      service.startSession('squat', 0);
      service.addSnapshot({ leftKnee: 90 }, [], 100);
      service.addSnapshot({ leftKnee: 95 }, [], 200);

      const summary = service.endSession(500);
      expect(summary.snapshotCount).toBe(2);
    });

    it('스냅샷 없이 endSession 호출 시 snapshotCount는 0이다', () => {
      service.startSession('squat', 0);
      const summary = service.endSession(1000);
      expect(summary.snapshotCount).toBe(0);
    });
  });

  // ─── 세션 시간 계산 ─────────────────────────────────────────────────────

  describe('sessionDurationMs', () => {
    it('endSession(endTime) - startSession(startTime) = sessionDurationMs', () => {
      service.startSession('squat', 1000);
      const summary = service.endSession(6000);
      expect(summary.sessionDurationMs).toBe(5000);
    });
  });

  // ─── 렙 카운트: 스쿼트 ──────────────────────────────────────────────────

  describe('totalReps — 스쿼트', () => {
    it('스쿼트 1렙 시뮬레이션 시 totalReps = 1', () => {
      service.startSession('squat', 0);
      buildSquatRepAngles().forEach(({ angles, ts }) => {
        service.addSnapshot(angles, [], ts);
      });
      const summary = service.endSession(700);
      expect(summary.totalReps).toBe(1);
    });

    it('스쿼트 3렙 시뮬레이션 시 totalReps = 3', () => {
      service.startSession('squat', 0);
      const oneRep = buildSquatRepAngles();
      for (let i = 0; i < 3; i++) {
        const offset = i * 700;
        // 렙 사이 리셋: 마지막 top 상태를 다음 렙의 시작으로 재사용
        const startIdx = i === 0 ? 0 : 1; // 첫 렙 이후는 top 중복 방지
        oneRep.slice(startIdx).forEach(({ angles, ts }) => {
          service.addSnapshot(angles, [], ts + offset);
        });
      }
      const summary = service.endSession(2100);
      expect(summary.totalReps).toBe(3);
    });

    it('bottom 없이 top만 있는 경우 렙 카운트 안 함', () => {
      service.startSession('squat', 0);
      // top 상태만 반복
      [160, 155, 158, 162].forEach((knee, i) => {
        service.addSnapshot({ leftKnee: knee }, [], i * 100);
      });
      const summary = service.endSession(400);
      expect(summary.totalReps).toBe(0);
    });

    it('bottom 도달했지만 top 복귀 전 세션 종료 시 렙 카운트 안 함 (부분 렙 제외)', () => {
      service.startSession('squat', 0);
      // top → bottom (복귀 없음)
      [160, 110, 80].forEach((knee, i) => {
        service.addSnapshot({ leftKnee: knee }, [], i * 100);
      });
      const summary = service.endSession(300);
      expect(summary.totalReps).toBe(0);
    });
  });

  // ─── 렙 카운트: 데드리프트 ─────────────────────────────────────────────

  describe('totalReps — 데드리프트', () => {
    it('데드리프트 1렙 시뮬레이션 시 totalReps = 1', () => {
      service.startSession('deadlift', 0);
      buildDeadliftRepAngles().forEach(({ angles, ts }) => {
        service.addSnapshot(angles, [], ts);
      });
      const summary = service.endSession(700);
      expect(summary.totalReps).toBe(1);
    });
  });

  // ─── 평균 각도 ────────────────────────────────────────────────────────

  describe('avgAngles', () => {
    it('2개 스냅샷의 leftKnee 평균을 계산한다', () => {
      service.startSession('squat', 0);
      service.addSnapshot({ leftKnee: 90 }, [], 100);
      service.addSnapshot({ leftKnee: 110 }, [], 200);
      const summary = service.endSession(300);
      expect(summary.avgAngles.leftKnee).toBeCloseTo(100, 1);
    });

    it('다중 관절 각도의 평균을 각각 계산한다', () => {
      service.startSession('squat', 0);
      service.addSnapshot({ leftKnee: 90, rightKnee: 85 }, [], 100);
      service.addSnapshot({ leftKnee: 110, rightKnee: 95 }, [], 200);
      const summary = service.endSession(300);
      expect(summary.avgAngles.leftKnee).toBeCloseTo(100, 1);
      expect(summary.avgAngles.rightKnee).toBeCloseTo(90, 1);
    });

    it('스냅샷이 없으면 avgAngles는 빈 객체이다', () => {
      service.startSession('squat', 0);
      const summary = service.endSession(1000);
      expect(Object.keys(summary.avgAngles)).toHaveLength(0);
    });
  });

  // ─── 오류 빈도 ────────────────────────────────────────────────────────

  describe('errorFrequency', () => {
    it('단일 오류 타입 발생 횟수를 집계한다', () => {
      service.startSession('squat', 0);
      service.addSnapshot({ leftKnee: 90 }, [makeError('KNEE_ANGLE_OUT_OF_RANGE')], 100);
      service.addSnapshot({ leftKnee: 95 }, [makeError('KNEE_ANGLE_OUT_OF_RANGE')], 200);
      const summary = service.endSession(300);
      expect(summary.errorFrequency['KNEE_ANGLE_OUT_OF_RANGE']).toBe(2);
    });

    it('복수 오류 타입을 각각 집계한다', () => {
      service.startSession('squat', 0);
      service.addSnapshot({ leftKnee: 90 }, [makeError('KNEE_ANGLE_OUT_OF_RANGE'), makeError('SPINE_MISALIGNMENT')], 100);
      service.addSnapshot({ leftKnee: 95 }, [makeError('SPINE_MISALIGNMENT')], 200);
      const summary = service.endSession(300);
      expect(summary.errorFrequency['KNEE_ANGLE_OUT_OF_RANGE']).toBe(1);
      expect(summary.errorFrequency['SPINE_MISALIGNMENT']).toBe(2);
    });

    it('오류가 없으면 errorFrequency는 빈 객체이다', () => {
      service.startSession('squat', 0);
      service.addSnapshot({ leftKnee: 90 }, [], 100);
      const summary = service.endSession(200);
      expect(Object.keys(summary.errorFrequency)).toHaveLength(0);
    });
  });

  // ─── exercise 반환 ────────────────────────────────────────────────────

  describe('exercise 반환', () => {
    it('startSession에 전달한 exercise가 summary.exercise에 반환된다 (squat)', () => {
      service.startSession('squat', 0);
      const summary = service.endSession(1000);
      expect(summary.exercise).toBe('squat');
    });

    it('startSession에 전달한 exercise가 summary.exercise에 반환된다 (deadlift)', () => {
      service.startSession('deadlift', 0);
      const summary = service.endSession(1000);
      expect(summary.exercise).toBe('deadlift');
    });
  });

  // ─── reset ────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('reset 후 startSession/endSession 재호출 시 이전 데이터가 초기화된다', () => {
      service.startSession('squat', 0);
      service.addSnapshot({ leftKnee: 90 }, [makeError('KNEE_ANGLE_OUT_OF_RANGE')], 100);
      service.endSession(200);

      service.reset();
      service.startSession('deadlift', 1000);
      const summary = service.endSession(2000);

      expect(summary.snapshotCount).toBe(0);
      expect(summary.totalReps).toBe(0);
      expect(Object.keys(summary.errorFrequency)).toHaveLength(0);
      expect(summary.exercise).toBe('deadlift');
    });
  });
});
