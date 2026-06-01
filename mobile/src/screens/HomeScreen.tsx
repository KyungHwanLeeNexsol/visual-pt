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

// @MX:NOTE: 2D 카메라 한계 및 의료기기 아님 고지는 법적 요구사항 — 절대 제거 금지
export function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} testID="home-title">Visual PT</Text>
        <Text style={styles.tagline}>집에서도 전문가 수준의 운동 폼 교정을</Text>

        {/* MVP 운동 목록 */}
        <View style={styles.exerciseList} testID="exercise-list">
          {EXERCISE_CATALOG.map((ex) => (
            <Text key={ex.id} style={styles.exerciseItem}>{ex.name}</Text>
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
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  tagline: { fontSize: 16, color: '#BDBDBD', lineHeight: 24 },
  exerciseList: { gap: 8 },
  exerciseItem: { fontSize: 16, color: '#9E9E9E' },
  startButton: {
    backgroundColor: '#1976D2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  disclaimer: {
    fontSize: 11,
    color: '#616161',
    lineHeight: 18,
    textAlign: 'center',
  },
});
