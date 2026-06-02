// SPEC-ENHANCE-001 E2: 세션 종료 후 분석 요약 화면
// SPEC-ENHANCE-001 E3: AI 코칭 통합

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { SessionSummaryScreenProps } from '../navigation/types';
import type { FormErrorType } from '../types/feedback.types';
import { AICoachingService } from '../services/AICoachingService';
import type { CoachingResult } from '../services/AICoachingService';
import { API_BASE_URL } from '../config/api.config';

// AI 코칭 서비스 인스턴스 생성
const aiCoachingService = new AICoachingService(API_BASE_URL);

// 오류 타입 → 한국어 이름 매핑
const ERROR_TYPE_LABELS: Record<FormErrorType, string> = {
  KNEE_ANGLE_OUT_OF_RANGE: '무릎 각도 범위 이탈',
  SPINE_MISALIGNMENT: '척추 정렬 불량',
  SHOULDER_IMBALANCE: '어깨 불균형',
  HIP_ALIGNMENT: '엉덩이 정렬 불량',
  TORSO_ANGLE_OUT_OF_RANGE: '몸통 각도 범위 이탈',
};

// 운동 유형 → 한국어 이름 매핑
const EXERCISE_LABELS = {
  squat: '스쿼트',
  deadlift: '데드리프트',
} as const;

// 밀리초를 MM:SS 포맷으로 변환
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// @MX:ANCHOR: [AUTO] 세션 완료 후 요약 정보를 표시하는 화면 컴포넌트
// @MX:REASON: [AUTO] RootNavigator, CameraScreen(navigate 호출), types.ts가 이 컴포넌트에 의존
export function SessionSummaryScreen({ route, navigation }: SessionSummaryScreenProps): React.JSX.Element {
  const { summary } = route.params;

  // AI 코칭 결과 상태
  const [coachingResult, setCoachingResult] = useState<CoachingResult | null>(null);
  const [isLoadingCoaching, setIsLoadingCoaching] = useState<boolean>(true);

  // 화면 마운트 시 AI 코칭 요청
  useEffect(() => {
    let isMounted = true;

    const fetchCoaching = async (): Promise<void> => {
      const result = await aiCoachingService.getCoaching(summary);
      if (isMounted) {
        setCoachingResult(result);
        setIsLoadingCoaching(false);
      }
    };

    void fetchCoaching();

    return () => {
      isMounted = false;
    };
  }, [summary]);

  // 오류 빈도 상위 3개 추출: 빈도 내림차순 정렬 후 슬라이스
  const topErrors = Object.entries(summary.errorFrequency)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 3) as Array<[FormErrorType, number]>;

  const exerciseLabel = EXERCISE_LABELS[summary.exercise];
  const durationFormatted = formatDuration(summary.sessionDurationMs);

  // 평균 무릎 각도 (소수점 1자리)
  const avgKnee = summary.avgAngles.leftKnee !== undefined
    ? Math.round(summary.avgAngles.leftKnee)
    : null;

  // 평균 힙 각도 (소수점 1자리)
  const avgHip = summary.avgAngles.leftHip !== undefined
    ? Math.round(summary.avgAngles.leftHip)
    : null;

  // WorkoutSelection 화면으로 돌아가기
  const handleGoBack = (): void => {
    navigation.navigate('WorkoutSelection');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>세션 요약</Text>
        <Text style={styles.exerciseName}>{exerciseLabel}</Text>
      </View>

      {/* 핵심 통계 카드 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.totalReps}</Text>
          <Text style={styles.statLabel}>총 렙수</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{durationFormatted}</Text>
          <Text style={styles.statLabel}>운동 시간</Text>
        </View>
      </View>

      {/* 평균 각도 섹션 */}
      {(avgKnee !== null || avgHip !== null) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>평균 각도</Text>
          {avgKnee !== null && (
            <View style={styles.angleRow}>
              <Text style={styles.angleLabel}>무릎 각도</Text>
              <Text style={styles.angleValue}>{avgKnee}°</Text>
            </View>
          )}
          {avgHip !== null && (
            <View style={styles.angleRow}>
              <Text style={styles.angleLabel}>힙 각도</Text>
              <Text style={styles.angleValue}>{avgHip}°</Text>
            </View>
          )}
        </View>
      )}

      {/* 상위 오류 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>주요 폼 오류</Text>
        {topErrors.length === 0 ? (
          <Text style={styles.noErrorText}>오류 없음 — 훌륭한 자세입니다!</Text>
        ) : (
          topErrors.map(([type, count]) => (
            <View key={type} style={styles.errorRow}>
              <Text style={styles.errorLabel}>{ERROR_TYPE_LABELS[type]}</Text>
              <Text style={styles.errorCount}>{count}회</Text>
            </View>
          ))
        )}
      </View>

      {/* E3 AI 코칭 섹션 */}
      <View style={styles.aiSection}>
        <Text style={styles.aiTitle}>AI 코칭</Text>
        {isLoadingCoaching ? (
          // 로딩 중: 분석 중 표시
          <View style={styles.aiLoadingContainer}>
            <ActivityIndicator size="small" color="#9E9E9E" />
            <Text style={styles.aiPlaceholder}>AI 코칭 분석 중...</Text>
          </View>
        ) : coachingResult !== null ? (
          // 결과 표시: AI 또는 규칙 기반
          <View>
            <Text style={styles.aiMessage}>{coachingResult.message}</Text>
            <Text
              style={[
                styles.aiSourceLabel,
                coachingResult.isFromAI ? styles.aiSourceLabelAI : styles.aiSourceLabelFallback,
              ]}
            >
              {coachingResult.isFromAI ? '(Gemini AI 코칭)' : '(규칙 기반 피드백)'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 운동 선택으로 돌아가기 버튼 */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>운동 선택으로 돌아가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 48,
  },
  headerTitle: {
    color: '#9E9E9E',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  section: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#9E9E9E',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  angleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  angleLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  angleValue: {
    color: '#4FC3F7',
    fontSize: 16,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  errorLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  errorCount: {
    color: '#EF5350',
    fontSize: 14,
    fontWeight: '600',
  },
  noErrorText: {
    color: '#66BB6A',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  aiSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
  },
  aiTitle: {
    color: '#9E9E9E',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  aiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  aiPlaceholder: {
    color: '#616161',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aiMessage: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  aiSourceLabel: {
    fontSize: 12,
  },
  aiSourceLabelAI: {
    // Gemini AI 응답: 파란색
    color: '#1976D2',
  },
  aiSourceLabelFallback: {
    // 규칙 기반 폴백: 회색
    color: '#616161',
  },
  backButton: {
    backgroundColor: '#1976D2',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
