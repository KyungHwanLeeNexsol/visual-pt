// SPEC-UI-001 / SPEC-UI-002: M1 포즈 감지 훅 (PoseEstimationService + 프레임 프로세서 연결)

import { useState, useCallback, useRef } from 'react';
import { runOnJS } from 'react-native-reanimated';
import type { PoseResult, ExerciseType, Keypoint } from '../types/pose.types';
import { PoseEstimationService } from '../services/PoseEstimationService';

export interface UsePoseDetectionResult {
  latestPose: PoseResult | null;
  isProcessing: boolean;
  fps: number;
  startDetection: (exercise: ExerciseType) => void;
  stopDetection: () => void;
  // N5: 프레임 프로세서에서 호출하는 콜백 (runOnJS로 JS 스레드에 결과 전달)
  onPoseDetected: (landmarks: Keypoint[], timestamp: number) => void;
}

// @MX:ANCHOR: 포즈 감지 훅 — CameraScreen 파이프라인의 중심
// @MX:REASON: CameraScreen에서 참조; 실제 앱에서 핵심 데이터 흐름을 관리
// @MX:SPEC: SPEC-UI-001, SPEC-UI-002
export function usePoseDetection(): UsePoseDetectionResult {
  const [latestPose, setLatestPose] = useState<PoseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fps, setFps] = useState(0);
  const serviceRef = useRef<PoseEstimationService>(new PoseEstimationService());
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // N5: 프레임 프로세서 → JS 스레드 결과 수신
  const onPoseDetected = useCallback((landmarks: Keypoint[], timestamp: number) => {
    const now = timestamp;
    frameCountRef.current += 1;

    // FPS 계산 (1초마다 갱신)
    if (lastFrameTimeRef.current > 0) {
      const elapsed = now - lastFrameTimeRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
    } else {
      lastFrameTimeRef.current = now;
    }

    setLatestPose({ landmarks, timestamp });
  }, []);

  const startDetection = useCallback((exercise: ExerciseType) => {
    setIsProcessing(true);
    lastFrameTimeRef.current = 0;
    frameCountRef.current = 0;
    serviceRef.current.initialize(exercise).catch(() => {
      // 네이티브 미지원 환경(테스트)에서는 무시
    });
  }, []);

  const stopDetection = useCallback(() => {
    setIsProcessing(false);
    setLatestPose(null);
    setFps(0);
    serviceRef.current.destroy().catch(() => {
      // 네이티브 미지원 환경에서는 무시
    });
  }, []);

  return {
    latestPose,
    isProcessing,
    fps,
    startDetection,
    stopDetection,
    onPoseDetected,
  };
}

// N5: 프레임 프로세서 워크릿에서 사용하는 runOnJS 래퍼 팩토리
// useFrameProcessor 내부에서 호출: runOnJS(createPoseCallback(onPoseDetected))(landmarks, ts)
export function createPoseCallback(
  onPoseDetected: (landmarks: Keypoint[], timestamp: number) => void,
) {
  return runOnJS(onPoseDetected);
}
