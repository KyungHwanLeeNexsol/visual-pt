// SPEC-ENHANCE-001 E2: 세션 분석 서비스 — 운동 중 각도 스냅샷 수집, 렙 카운트, 세션 요약 계산

import type { ExerciseType, JointAngles } from '../types/pose.types';
import type { FormError, FormErrorType } from '../types/feedback.types';

// 세션 요약 결과 타입
export interface SessionSummary {
  exercise: ExerciseType;
  totalReps: number;
  avgAngles: Partial<JointAngles>;
  errorFrequency: Partial<Record<FormErrorType, number>>;
  sessionDurationMs: number;
  snapshotCount: number;
}

// 서비스 인터페이스 계약
export interface ISessionAnalyticsService {
  startSession(exercise: ExerciseType, startTimeMs: number): void;
  addSnapshot(angles: JointAngles, errors: FormError[], timestampMs: number): void;
  endSession(endTimeMs: number): SessionSummary;
  reset(): void;
}

// 스쿼트 렙 감지 임계값
const SQUAT_BOTTOM_THRESHOLD = 100; // leftKnee < 100 → bottom
const SQUAT_TOP_THRESHOLD = 130;    // leftKnee > 130 → top

// 데드리프트 렙 감지 임계값
const DEADLIFT_BOTTOM_THRESHOLD = 60;  // leftHip < 60 → bottom
const DEADLIFT_TOP_THRESHOLD = 100;    // leftHip > 100 → top

// 렙 감지 상태 머신 상태값
type RepState = 'idle' | 'top' | 'descending' | 'bottom' | 'ascending';

// 각 스냅샷의 내부 저장 형태
interface Snapshot {
  angles: JointAngles;
  errors: FormError[];
  timestampMs: number;
}

// @MX:ANCHOR: [AUTO] 세션 분석 서비스 — CameraScreen에서 useRef로 관리되는 핵심 계산 클래스
// @MX:REASON: [AUTO] CameraScreen, 테스트 코드, sessionAnalyticsStore가 이 클래스에 의존함
export class SessionAnalyticsService implements ISessionAnalyticsService {
  private exercise: ExerciseType | null = null;
  private startTimeMs: number | null = null;
  private snapshots: Snapshot[] = [];

  // 렙 카운트를 위한 상태 머신
  private repState: RepState = 'idle';
  private totalReps: number = 0;

  // 세션 시작: 운동 유형과 시작 시간 기록
  startSession(exercise: ExerciseType, startTimeMs: number): void {
    this.exercise = exercise;
    this.startTimeMs = startTimeMs;
    this.snapshots = [];
    this.repState = 'idle';
    this.totalReps = 0;
  }

  // 스냅샷 추가: 각도와 오류 데이터를 누적하고 렙 감지 상태 머신 갱신
  addSnapshot(angles: JointAngles, errors: FormError[], timestampMs: number): void {
    this.snapshots.push({ angles, errors, timestampMs });
    this.updateRepStateMachine(angles);
  }

  // 세션 종료: 요약 계산 후 반환
  endSession(endTimeMs: number): SessionSummary {
    const exercise = this.exercise ?? 'squat';
    const startTime = this.startTimeMs ?? endTimeMs;
    const sessionDurationMs = endTimeMs - startTime;

    return {
      exercise,
      totalReps: this.totalReps,
      avgAngles: this.calculateAvgAngles(),
      errorFrequency: this.calculateErrorFrequency(),
      sessionDurationMs,
      snapshotCount: this.snapshots.length,
    };
  }

  // 상태 초기화: 새 세션 시작 전 모든 내부 상태 리셋
  reset(): void {
    this.exercise = null;
    this.startTimeMs = null;
    this.snapshots = [];
    this.repState = 'idle';
    this.totalReps = 0;
  }

  // 렙 감지 상태 머신: 운동 유형에 따라 스쿼트/데드리프트 렙 감지
  // @MX:NOTE: [AUTO] idle→top→descending→bottom→ascending→(top=렙완료) 순서로 전이
  private updateRepStateMachine(angles: JointAngles): void {
    if (this.exercise === 'squat') {
      this.updateSquatRepState(angles);
    } else if (this.exercise === 'deadlift') {
      this.updateDeadliftRepState(angles);
    }
  }

  // 스쿼트 렙 상태 머신: leftKnee 각도 기반
  private updateSquatRepState(angles: JointAngles): void {
    const knee = angles.leftKnee;
    if (knee === undefined) return;

    switch (this.repState) {
      case 'idle':
        // idle 상태에서 top 임계값 이상이면 top 상태로 전이
        if (knee > SQUAT_TOP_THRESHOLD) {
          this.repState = 'top';
        }
        break;

      case 'top':
        // top에서 내려가기 시작 (임계값 이하)
        if (knee <= SQUAT_TOP_THRESHOLD) {
          this.repState = 'descending';
        }
        break;

      case 'descending':
        // bottom 임계값 이하에 도달하면 bottom 상태
        if (knee < SQUAT_BOTTOM_THRESHOLD) {
          this.repState = 'bottom';
        }
        break;

      case 'bottom':
        // bottom에서 올라가기 시작
        if (knee >= SQUAT_BOTTOM_THRESHOLD) {
          this.repState = 'ascending';
        }
        break;

      case 'ascending':
        // top 임계값 이상 복귀 시 렙 완료
        if (knee > SQUAT_TOP_THRESHOLD) {
          this.totalReps += 1;
          this.repState = 'top'; // 연속 렙을 위해 top 상태 유지
        }
        break;
    }
  }

  // 데드리프트 렙 상태 머신: leftHip 각도 기반
  private updateDeadliftRepState(angles: JointAngles): void {
    const hip = angles.leftHip;
    if (hip === undefined) return;

    switch (this.repState) {
      case 'idle':
        if (hip > DEADLIFT_TOP_THRESHOLD) {
          this.repState = 'top';
        }
        break;

      case 'top':
        if (hip <= DEADLIFT_TOP_THRESHOLD) {
          this.repState = 'descending';
        }
        break;

      case 'descending':
        if (hip < DEADLIFT_BOTTOM_THRESHOLD) {
          this.repState = 'bottom';
        }
        break;

      case 'bottom':
        if (hip >= DEADLIFT_BOTTOM_THRESHOLD) {
          this.repState = 'ascending';
        }
        break;

      case 'ascending':
        if (hip > DEADLIFT_TOP_THRESHOLD) {
          this.totalReps += 1;
          this.repState = 'top';
        }
        break;
    }
  }

  // 세션 전체 평균 각도 계산: 각 관절별로 스냅샷 평균
  private calculateAvgAngles(): Partial<JointAngles> {
    if (this.snapshots.length === 0) return {};

    // 각 관절의 합계와 카운트를 집계
    const sums: Partial<Record<keyof JointAngles, number>> = {};
    const counts: Partial<Record<keyof JointAngles, number>> = {};

    for (const snapshot of this.snapshots) {
      const { angles } = snapshot;
      (Object.keys(angles) as Array<keyof JointAngles>).forEach((key) => {
        const value = angles[key];
        if (value !== undefined) {
          sums[key] = (sums[key] ?? 0) + value;
          counts[key] = (counts[key] ?? 0) + 1;
        }
      });
    }

    // 평균 계산
    const avg: Partial<JointAngles> = {};
    (Object.keys(sums) as Array<keyof JointAngles>).forEach((key) => {
      const sum = sums[key];
      const count = counts[key];
      if (sum !== undefined && count !== undefined && count > 0) {
        avg[key] = sum / count;
      }
    });

    return avg;
  }

  // 오류 발생 횟수 집계: 각 FormErrorType별 카운트
  private calculateErrorFrequency(): Partial<Record<FormErrorType, number>> {
    const freq: Partial<Record<FormErrorType, number>> = {};

    for (const snapshot of this.snapshots) {
      for (const error of snapshot.errors) {
        freq[error.type] = (freq[error.type] ?? 0) + 1;
      }
    }

    return freq;
  }
}
