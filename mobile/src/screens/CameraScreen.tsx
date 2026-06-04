// SPEC-UI-001 / SPEC-UI-002: 실시간 자세 추정 메인 화면 (M1~M5 통합 + 실제 카메라 연결)
// SPEC-ENHANCE-001 E2: 세션 분석 통합 — SessionAnalyticsService로 렙/각도/오류 추적

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
} from 'react-native-vision-camera';

import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useJointAngles } from '../hooks/useJointAngles';
import { useFeedback } from '../hooks/useFeedback';
import { useWorkoutStore } from '../store/workoutStore';
import { useFeedbackStore } from '../store/feedbackStore';
import { SessionAnalyticsService } from '../services/SessionAnalyticsService';

import { CameraOverlay } from '../components/CameraOverlay';
import { FeedbackBadge } from '../components/FeedbackBadge';
import { CameraGuideOverlay, type AngleQuality } from '../components/CameraGuideOverlay';
import { JointAngleDisplay } from '../components/JointAngleDisplay';

import { VISIBILITY_THRESHOLD } from '../config/pose.config';
import type { CameraScreenProps } from '../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// @MX:ANCHOR: 실시간 자세 추정 파이프라인의 최상위 통합 컴포넌트
// @MX:REASON: M1~M5 전체 파이프라인이 이 화면에서 결합됨 (SPEC-UI-001, SPEC-UI-002)
// @MX:SPEC: SPEC-UI-001, SPEC-UI-002
export function CameraScreen({ route, navigation }: CameraScreenProps): React.JSX.Element {
  const { hasPermission, isPermissionLoading, requestPermission } = useCamera();
  const device = useCameraDevice('back');
  const { latestPose, isProcessing, fps, startDetection, stopDetection } = usePoseDetection();
  const { currentMessage, triggerFeedback } = useFeedback();
  const { isSessionActive, startSession, endSession, selectExercise } = useWorkoutStore();
  const { setErrors, addMessage, setActive } = useFeedbackStore();

  // M5: 카메라 배치 가이드 — 진입 시 즉시 표시 (AC-8)
  const [showGuide, setShowGuide] = useState(true);

  // M5: 가시성 점수로 앵글 품질 판정 — latestPose 파생 값
  const angleQuality = useMemo((): AngleQuality => {
    if (!latestPose?.landmarks) return 'good';
    const keyLandmarks = [11, 12, 23, 24, 25, 26, 27, 28]; // 핵심 관절
    const visibilities = keyLandmarks.map((i) => latestPose.landmarks[i]?.visibility ?? 0);
    const avgVisibility = visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
    if (avgVisibility >= 0.7) return 'good';
    if (avgVisibility >= VISIBILITY_THRESHOLD) return 'warning';
    return 'poor';
  }, [latestPose]);
  const [showDebugAngles, setShowDebugAngles] = useState(false);

  // E2: 세션 분석 서비스 (싱글톤 아님 — 컴포넌트 생명주기에 바인딩)
  const analyticsServiceRef = useRef<SessionAnalyticsService>(new SessionAnalyticsService());

  const exercise = route.params?.exercise ?? null;

  const { angles, errors } = useJointAngles(
    latestPose?.landmarks ?? null,
    exercise,
  );

  // SPEC-UI-002 N4: 마운트 시 자동 세션 시작, 언마운트 시 정리
  // SPEC-ENHANCE-001 E2: 세션 분석 서비스 시작
  useEffect(() => {
    if (!exercise) {
      navigation.goBack();
      return;
    }

    selectExercise(exercise);
    startSession();
    setActive(true);
    startDetection(exercise);

    // E2: 세션 분석 시작
    analyticsServiceRef.current.startSession(exercise, Date.now());

    return () => {
      // 언마운트 시 세션·추론 정리
      endSession();
      setActive(false);
      stopDetection();
    };
    // 마운트 시 1회만 실행 — deps 의도적으로 비움
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // M3: 폼 오류 감지 시 피드백 트리거
  useEffect(() => {
    if (errors.length > 0 && exercise) {
      triggerFeedback(errors, exercise);
      setErrors(errors);
    } else {
      setErrors([]);
    }
  }, [errors, exercise, triggerFeedback, setErrors]);

  // E2: 각도 스냅샷 누적 — angles가 변경될 때마다 세션 분석 서비스에 추가
  useEffect(() => {
    if (angles && exercise) {
      analyticsServiceRef.current.addSnapshot(angles, errors, Date.now());
    }
    // errors 최신값을 함께 캡처하기 위해 deps에 포함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angles]);

  // M3: 피드백 메시지를 feedbackStore에 저장
  useEffect(() => {
    if (currentMessage) {
      addMessage(currentMessage);
    }
  }, [currentMessage, addMessage]);

  // 세션 종료: 분석 요약 계산 후 SessionSummaryScreen으로 이동
  // SPEC-ENHANCE-001 E2: goBack() 대신 navigate로 요약 화면 전환
  const handleEndSession = useCallback(() => {
    endSession();
    setActive(false);
    stopDetection();

    // E2: 세션 분석 완료 후 요약 화면으로 이동
    const summary = analyticsServiceRef.current.endSession(Date.now());
    navigation.navigate('SessionSummaryScreen', { summary });
  }, [endSession, setActive, stopDetection, navigation]);

  // N5: 포즈 감지 연결 예정 — 현재 카메라 피드만 표시 (MVP 빌드)
  // TODO: react-native-mediapipe 안정화 후 실제 포즈 감지로 교체
  const isModelLoaded = false; // 항상 false — 포즈 감지 미연결

  // 권한 상태 조회 중 — 네이티브 응답 전에 Camera를 렌더링하면 실기기 크래시 발생
  if (isPermissionLoading) {
    return (
      <View style={styles.permissionContainer} testID="permission-loading-screen">
        <Text style={styles.permissionText}>카메라 초기화 중...</Text>
      </View>
    );
  }

  // 권한 미허용 또는 카메라 디바이스 없음 — graceful fallback (N5 Unwanted)
  if (!hasPermission || !device) {
    return (
      <View style={styles.permissionContainer} testID="permission-screen">
        <Text style={styles.permissionText}>
          {!hasPermission ? '카메라 접근 권한이 필요합니다' : '카메라를 찾을 수 없습니다'}
        </Text>
        {!hasPermission && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>권한 허용</Text>
          </TouchableOpacity>
        )}
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

      {/* N5: 실제 카메라 피드 (react-native-vision-camera) */}
      <Camera
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={isSessionActive}
        testID="camera-view"
      />

      {/* 모델 로딩 중 오버레이 — isModelLoaded가 false일 때 표시 */}
      {!isModelLoaded && (
        <View style={styles.modelLoadingOverlay} pointerEvents="none">
          <Text style={styles.modelLoadingText}>모델 로딩 중...</Text>
        </View>
      )}

      {/* FPS 디버그 표시 */}
      {isProcessing && (
        <View style={styles.fpsOverlay} pointerEvents="none">
          <Text style={styles.fpsText}>{fps} FPS</Text>
        </View>
      )}

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

      {/* 세션 종료 버튼 (세션 활성 시에만 표시) */}
      <View style={styles.controlsContainer}>
        {isSessionActive && (
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
          ⚠ 의료·재활 진단 도구가 아닙니다
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
  stopButton: {
    backgroundColor: '#FF2D2D',
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
  modelLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modelLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fpsOverlay: {
    position: 'absolute',
    top: 160,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fpsText: {
    color: '#39FF14',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: 'monospace',
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
    left: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: '#1A0000',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  disclaimerBannerText: {
    color: '#FF6B6B',
    fontSize: 11,
  },
});
