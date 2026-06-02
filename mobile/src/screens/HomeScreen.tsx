// SPEC-UI-002: N2 홈 화면 — 타이틀, 운동 시작 버튼, 면책 고지
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../navigation/types';
import { EXERCISE_CATALOG } from '../config/exercise.catalog';
import { Colors } from '../theme/colors';

// @MX:NOTE: 2D 카메라 한계 및 의료기기 아님 고지는 법적 요구사항 — 절대 제거 금지
export function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 앱 브랜드 타이틀 — 네온 액센트 포인트 */}
        <View style={styles.brandRow}>
          <Text style={styles.title} testID="home-title">Visual PT</Text>
          <Text style={styles.accentDot}>.</Text>
        </View>
        <Text style={styles.tagline}>집에서도 전문가 수준의 운동 폼 교정을</Text>

        {/* MVP 운동 배지 목록 */}
        <View style={styles.badgeRow} testID="exercise-list">
          {EXERCISE_CATALOG.map((ex) => (
            <View key={ex.id} style={styles.badge}>
              <Text style={styles.badgeText}>{ex.name}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('WorkoutSelection')}
          testID="start-workout-button"
        >
          <Text style={styles.startButtonText}>운동 시작</Text>
        </TouchableOpacity>

        {/* 법적 면책 고지 */}
        <Text style={styles.disclaimer} testID="legal-disclaimer">
          Visual PT는 의료·재활 진단 도구가 아닙니다.{'\n'}
          2D 카메라 분석의 특성상 각도 오차가 발생할 수 있습니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { padding: 24, paddingTop: 40, gap: 24 },

  // 브랜드 타이틀 행
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // 앱 이름 스타일 — 크고 임팩트 있게
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  accentDot: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.accent,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: -8,
  },

  // 운동 미리보기 배지 행
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  // CTA 버튼 — 풀 width 네온 그린
  startButton: {
    backgroundColor: Colors.accent,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  disclaimer: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },

  // 아래 사용하지 않는 스타일 (기존 코드 호환)
  exerciseList: { gap: 8 },
  exerciseItem: { fontSize: 16, color: Colors.textSecondary },
});
