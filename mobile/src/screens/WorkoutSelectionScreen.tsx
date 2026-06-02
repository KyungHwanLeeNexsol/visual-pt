// SPEC-UI-002: N3 운동 선택 화면 — 스쿼트/데드리프트 카드
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WorkoutSelectionScreenProps } from '../navigation/types';
import { EXERCISE_CATALOG } from '../config/exercise.catalog';
import { useWorkoutStore } from '../store/workoutStore';
import { Colors } from '../theme/colors';

export function WorkoutSelectionScreen({ navigation }: WorkoutSelectionScreenProps): React.JSX.Element {
  const { selectExercise } = useWorkoutStore();

  const handleSelectExercise = (exerciseId: 'squat' | 'deadlift'): void => {
    selectExercise(exerciseId);
    navigation.navigate('Camera', { exercise: exerciseId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>운동 선택</Text>

        {EXERCISE_CATALOG.map((ex) => (
          <View key={ex.id} style={styles.card} testID={`exercise-card-${ex.id}`}>
            <View style={styles.imagePlaceholder} testID={`exercise-image-${ex.id}`}>
              <Text style={styles.imagePlaceholderText}>{ex.name[0]}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseDesc}>{ex.description}</Text>
              <Text style={styles.muscles}>{ex.targetMuscles.join(' · ')}</Text>
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => handleSelectExercise(ex.id)}
              testID={`start-button-${ex.id}`}
            >
              <Text style={styles.selectButtonText}>시작</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { padding: 20, gap: 14, paddingTop: 32, paddingBottom: 32 },

  header: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  // 운동 카드 — 왼쪽 액센트 보더 (토스 스타일)
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'column',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    // 왼쪽 액센트 선
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },

  // 운동 이미지 플레이스홀더 — 더 진하고 임팩트 있게
  imagePlaceholder: {
    height: 110,
    backgroundColor: Colors.bgAccentDim,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accentDim,
  },
  imagePlaceholderText: {
    fontSize: 52,
  },

  cardContent: { gap: 6 },
  exerciseName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  exerciseDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  muscles: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },

  // 시작 버튼 — 네온 그린
  selectButton: {
    backgroundColor: Colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
});
