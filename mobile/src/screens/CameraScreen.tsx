// SPEC-UI-001: 실시간 자세 추정 메인 화면 (M1~M5 통합)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useJointAngles } from '../hooks/useJointAngles';
import { useFeedback } from '../hooks/useFeedback';
import { useWorkoutStore } from '../store/workoutStore';
import { useFeedbackStore } from '../store/feedbackStore';

import { CameraOverlay } from '../components/CameraOverlay';
import { FeedbackBadge } from '../components/FeedbackBadge';
import { CameraGuideOverlay, type AngleQuality } from '../components/CameraGuideOverlay';
import { JointAngleDisplay } from '../components/JointAngleDisplay';

import { VISIBILITY_THRESHOLD } from '../config/pose.config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// AC-5: 피드백 표시 지속 시간 (ms)
const FEEDBACK_DISPLAY_DURATION_MS = 3000;

// @MX:ANCHOR: 실시간 자세 추정 파이프라인의 최상위 통합 컴포넌트
// @MX:REASON: M1~M5 전체 파이프라인이 이 화면에서 결합됨 (SPEC-UI-001)
// @MX:SPEC: SPEC-UI-001
export function CameraScreen(): React.JSX.Element {
  const { hasPermission, requestPermission } = useCamera();
  const { latestPose, isProcessing, fps, startDetection, stopDetection } = usePoseDetection();
  const { currentMessage, triggerFeedback } = useFeedback();
  const { selectedExercise, isSessionActive, startSession, endSession } = useWorkoutStore();
  const { setErrors, addMessage, setActive } = useFeedbackStore();

  // M5: 카메라 배치 가이드 표시 상태
  const [showGuide, setShowGuide] = useState(true);
  const [angleQuality, setAngleQuality] = useState<AngleQuality>('good');
  const [showDebugAngles, setShowDebugAngles] = useState(false);

  const { angles, errors } = useJointAngles(
    latestPose?.landmarks ?? null,
    selectedExercise,
  );

  // M3: 폼 오류 감지 시 피드백 트리거
  useEffect(() => {
    if (errors.length > 0 && selectedExercise) {
      triggerFeedback(errors, selectedExercise);
      setErrors(errors);
    } else {
      setErrors([]);
    }
  }, [errors, selectedExercise, triggerFeedback, setErrors]);

  // M3: 피드백 메시지를 feedbackStore에 저장
  useEffect(() => {
    if (currentMessage) {
      addMessage(currentMessage);
    }
  }, [currentMessage, addMessage]);

  // M5: 가시성 점수로 앵글 품질 판정
  useEffect(() => {
    if (!latestPose?.landmarks) return;

    const keyLandmarks = [11, 12, 23, 24, 25, 26, 27, 28]; // 핵심 관절
    const visibilities = keyLandmarks.map((i) => latestPose.landmarks[i]?.visibility ?? 0);
    const avgVisibility = visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;

    if (avgVisibility >= 0.7) {
      setAngleQuality('good');
    } else if (avgVisibility >= VISIBILITY_THRESHOLD) {
      setAngleQuality('warning');
    } else {
      setAngleQuality('poor');
    }
  }, [latestPose]);

  // 세션 시작
  const handleStartSession = useCallback(() => {
    if (!selectedExercise) {
      Alert.alert('운동 선택', '운동을 먼저 선택해주세요.');
      return;
    }
    startSession();
    setActive(true);
    startDetection(selectedExercise);
    setShowGuide(false);
  }, [selectedExercise, startSession, setActive, startDetection]);

  // 세션 종료
  const handleEndSession = useCallback(() => {
    endSession();
    setActive(false);
    stopDetection();
    setShowGuide(false);
  }, [endSession, setActive, stopDetection]);

  // 권한 미허용 상태
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer} testID="permission-screen">
        <Text style={styles.permissionText}>카메라 접근 권한이 필요합니다</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimerText}>
          {/* 법적 면책: 2D 카메라 한계 안내 */}
          Visual PT는 2D 카메라 기반 분석으로 정확도에 한계가 있습니다.{'\n'}
          의료·재활 목적의 진단 도구가 아닙니다.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="camera-screen">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 카메라 뷰 영역 (Phase E 실기기 통합 시 Camera 컴포넌트로 교체) */}
      <View style={styles.cameraPlaceholder} testID="camera-view">
        <Text style={styles.cameraPlaceholderText}>
          {isProcessing ? `처리 중 (${fps} FPS)` : '카메라 대기 중'}
        </Text>
      </View>

      {/* M4: 스켈레톤 오버레이 */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <CameraOverlay
          landmarks={latestPose?.landmarks ?? null}
          errors={errors}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
        />
      </View>

      {/* M3: 텍스트 피드백 배지 */}
      <View style={styles.feedbackContainer} pointerEvents="none">
        <FeedbackBadge
          message={currentMessage}
          visible={currentMessage !== null}
        />
      </View>

      {/* 디버그: 관절 각도 표시 (개발용) */}
      {showDebugAngles && (
        <View style={styles.debugContainer} pointerEvents="none">
          <JointAngleDisplay angles={angles} visible={showDebugAngles} />
        </View>
      )}

      {/* 운동 선택 및 세션 컨트롤 */}
      <View style={styles.controlsContainer}>
        {!isSessionActive ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartSession}
            testID="start-session-button"
          >
            <Text style={styles.startButtonText}>
              {selectedExercise
                ? `${selectedExercise === 'squat' ? '스쿼트' : '데드리프트'} 시작`
                : '운동 선택 후 시작'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleEndSession}
            testID="stop-session-button"
          >
            <Text style={styles.stopButtonText}>세션 종료</Text>
          </TouchableOpacity>
        )}

        {/* 디버그 토글 */}
        <TouchableOpacity
          style={styles.debugToggle}
          onPress={() => setShowDebugAngles((prev) => !prev)}
        >
          <Text style={styles.debugToggleText}>각도 {showDebugAngles ? '숨김' : '표시'}</Text>
        </TouchableOpacity>
      </View>

      {/* M5: AC-8 카메라 배치 가이드 (진입 시 표시) */}
      <CameraGuideOverlay
        isVisible={showGuide}
        angleQuality={angleQuality}
        onDismiss={() => setShowGuide(false)}
      />

      {/* 법적 면책 고지 */}
      <View style={styles.disclaimerBanner} pointerEvents="none">
        <Text style={styles.disclaimerBannerText}>
          의료·재활 진단 도구가 아닙니다
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.6,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  debugContainer: {
    position: 'absolute',
    top: 140,
    left: 16,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  startButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  stopButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  debugToggle: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  debugToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimerText: {
    color: '#9E9E9E',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerBanner: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  disclaimerBannerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
});

// 미사용 변수 제거 (Phase E 통합 후 실제 사용)
void FEEDBACK_DISPLAY_DURATION_MS;
