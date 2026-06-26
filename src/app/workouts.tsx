import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore, WorkoutTemplate } from '@/store/useWorkoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const { width } = Dimensions.get('window');

export default function WorkoutsScreen() {
  const { user } = useAuthStore();
  const { templates, fetchTemplates, startWorkout, startEmptyWorkout } = useWorkoutStore();
  const [selectedDayIdx, setSelectedDayIdx] = useState(3); // Hoje é o índice central (3)

  useEffect(() => {
    if (user?.id) {
      fetchTemplates(user.id);
    }
  }, [user]);

  // Gerar faixa de 7 dias centralizada no dia atual
  const getWeekDays = () => {
    const days = [];
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        name: weekdayNames[d.getDay()],
        date: d.getDate(),
        isToday: i === 0,
        fullDate: d,
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handleStartTemplate = (template: WorkoutTemplate) => {
    startWorkout(template);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Calendário Semanal Strip */}
        <View style={styles.calendarContainer}>
          <ThemedText type="smallBold" style={styles.calendarTitle}>
            CALENDÁRIO DE TREINOS
          </ThemedText>
          <View style={styles.weekStrip}>
            {weekDays.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCard,
                  day.isToday && styles.dayCardToday,
                  selectedDayIdx === idx && styles.dayCardSelected,
                ]}
                onPress={() => setSelectedDayIdx(idx)}
              >
                <ThemedText
                  style={[
                    styles.dayName,
                    selectedDayIdx === idx && styles.dayTextSelected,
                    day.isToday && !styles.dayCardSelected && styles.dayTextToday,
                  ]}
                >
                  {day.name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.dayDate,
                    selectedDayIdx === idx && styles.dayTextSelected,
                    day.isToday && !styles.dayCardSelected && styles.dayTextToday,
                  ]}
                >
                  {day.date}
                </ThemedText>
                {day.isToday && <View style={styles.todayIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
          <ThemedText style={styles.selectedDayLabel}>
            {selectedDayIdx === 3 ? 'Treinos agendados para Hoje:' : `Programado para ${weekDays[selectedDayIdx].name}, dia ${weekDays[selectedDayIdx].date}:`}
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Sessão rápida de Início Rápido */}
          <View style={styles.quickStartCard}>
            <View>
              <ThemedText style={styles.quickStartTitle}>Treino Vazio</ThemedText>
              <ThemedText style={styles.quickStartSubtitle}>
                Inicie um treino em branco e monte suas séries na hora.
              </ThemedText>
            </View>
            <TouchableOpacity style={styles.playButton} onPress={startEmptyWorkout}>
              <Ionicons name="play" size={24} color="#09090B" />
            </TouchableOpacity>
          </View>

          {/* Listagem de Rotinas */}
          <View style={styles.routinesHeader}>
            <ThemedText type="subtitle" style={styles.routinesTitle}>
              Minhas Rotinas
            </ThemedText>
            <TouchableOpacity style={styles.addRoutineBtn}>
              <Ionicons name="add" size={20} color={Colors.dark.accent} />
              <ThemedText style={styles.addRoutineText}>Nova</ThemedText>
            </TouchableOpacity>
          </View>

          {templates.map((tpl) => (
            <View key={tpl.id} style={styles.routineCard}>
              <View style={styles.routineInfo}>
                <ThemedText style={styles.routineName}>{tpl.name}</ThemedText>
                <ThemedText style={styles.routineDescription}>
                  {tpl.description || 'Nenhuma descrição fornecida.'}
                </ThemedText>
                <ThemedText style={styles.exerciseSummary}>
                  {tpl.exercises.map((e) => e.name).join(' • ')}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={styles.startRoutineBtn}
                onPress={() => handleStartTemplate(tpl)}
              >
                <Ionicons name="play" size={16} color="#09090B" />
                <ThemedText style={styles.startRoutineText}>Iniciar</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  calendarContainer: {
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
  },
  calendarTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  dayCard: {
    width: (width - Spacing.four * 2 - Spacing.two * 6) / 7,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    position: 'relative',
  },
  dayCardToday: {
    borderColor: '#FF9500',
  },
  dayCardSelected: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  dayName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  dayTextSelected: {
    color: '#09090B',
  },
  dayTextToday: {
    color: '#FF9500',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF9500',
  },
  selectedDayLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  scrollContainer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  quickStartCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.five,
  },
  quickStartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  quickStartSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    maxWidth: width * 0.65,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  routinesTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addRoutineText: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  routineCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineInfo: {
    flex: 1,
    marginRight: Spacing.three,
  },
  routineName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  exerciseSummary: {
    fontSize: 11,
    color: Colors.dark.accent,
    fontWeight: '500',
  },
  startRoutineBtn: {
    backgroundColor: Colors.dark.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  startRoutineText: {
    color: '#09090B',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
