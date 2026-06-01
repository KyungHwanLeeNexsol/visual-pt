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
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 24, gap: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'column',
    gap: 12,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { fontSize: 48 },
  cardContent: { gap: 6 },
  exerciseName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  exerciseDesc: { fontSize: 14, color: '#BDBDBD', lineHeight: 20 },
  muscles: { fontSize: 12, color: '#757575' },
  selectButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
