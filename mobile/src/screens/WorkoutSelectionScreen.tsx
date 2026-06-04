// SPEC-UI-002: N3 운동 선택 화면 — 스쿼트/데드리프트 카드
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WorkoutSelectionScreenProps } from '../navigation/types';
import { EXERCISE_CATALOG } from '../config/exercise.catalog';
import { useWorkoutStore } from '../store/workoutStore';
import { Colors } from '../theme/colors';

// 운동별 이모지 매핑
const EXERCISE_EMOJI: Record<string, string> = {
  squat: '🏋️‍♂️',
  deadlift: '💪',
};

const EXERCISE_IMAGES: Record<string, string> = {
  squat: 'https://images.unsplash.com/photo-1670349191471-98a4aa998f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3ODA1NTMwMjZ8&ixlib=rb-4.1.0&q=80&w=1080',
  deadlift: 'https://images.unsplash.com/photo-1758875569256-f37c438cac65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3ODA1NTE5NDZ8&ixlib=rb-4.1.0&q=80&w=1080',
};

const EXERCISE_IMAGE_OPACITY: Record<string, number> = {
  squat: 0.45,
  deadlift: 0.4,
};

const EXERCISE_OVERLAY_COLOR: Record<string, string> = {
  squat: 'rgba(15,15,26,0.67)',
  deadlift: 'rgba(15,15,26,0.70)',
};

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
          <ImageBackground key={ex.id} source={{ uri: EXERCISE_IMAGES[ex.id] ?? '' }} style={styles.card} imageStyle={{ opacity: EXERCISE_IMAGE_OPACITY[ex.id] ?? 0.4 }} resizeMode="cover" testID={`exercise-card-${ex.id}`}>
            <View style={[styles.cardInner, { backgroundColor: EXERCISE_OVERLAY_COLOR[ex.id] ?? 'rgba(15,15,26,0.67)' }]}>
              {/* 상단 행: 이모지 + 운동명 */}
              <View style={styles.topRow}>
                <Text style={styles.emojiText}>{EXERCISE_EMOJI[ex.id] ?? '🏃'}</Text>
                <Text style={styles.exerciseName}>{ex.name}</Text>
              </View>

              {/* 설명 */}
              <Text style={styles.exerciseDesc}>{ex.description}</Text>

              {/* 근육 태그 행 */}
              <View style={styles.tagRow} testID={`exercise-image-${ex.id}`}>
                {ex.targetMuscles.map((muscle) => (
                  <View key={muscle} style={styles.tagPill}>
                    <Text style={styles.tagText}>{muscle}</Text>
                  </View>
                ))}
              </View>

              {/* 시작 버튼 */}
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectExercise(ex.id)}
                testID={`start-button-${ex.id}`}
              >
                <Text style={styles.selectButtonText}>시작</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { padding: 20, gap: 14, paddingTop: 32, paddingBottom: 32 },

  header: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  // 운동 카드 — 왼쪽 액센트 보더 (Pencil 디자인)
  card: {
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#39FF14',
    overflow: 'hidden',
  },

  cardInner: {
    flexDirection: 'column',
    gap: 12,
    padding: 20,
  },

  // 상단 행: 이모지 + 운동명
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiText: {
    fontSize: 36,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  exerciseDesc: {
    fontSize: 13,
    color: '#9DA3B4',
    lineHeight: 19.5,
  },

  // 근육 태그 행
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#0A2200',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '600',
  },

  // 시작 버튼 — 네온 그린
  selectButton: {
    backgroundColor: '#39FF14',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
});
