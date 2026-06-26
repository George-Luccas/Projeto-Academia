import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore, WorkoutSet } from '@/store/useWorkoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const { height, width } = Dimensions.get('window');

// Lista simples de exercícios para seleção local caso o Supabase não esteja conectado
const fallbackExercises = [
  { id: '1', name: 'Supino Reto com Barra', category: 'Peito' },
  { id: '2', name: 'Desenvolvimento com Halteres', category: 'Ombros' },
  { id: '3', name: 'Tríceps Corda na Polia', category: 'Braços' },
  { id: '4', name: 'Puxada Alta na Polia (Lat Pulldown)', category: 'Costas' },
  { id: '5', name: 'Rosca Direta com Barra W', category: 'Braços' },
  { id: '6', name: 'Prancha Abdominal Isométrica', category: 'Core' },
  { id: '7', name: 'Agachamento Livre com Barra', category: 'Pernas' },
  { id: '8', name: 'Cadeira Extensora', category: 'Pernas' },
  { id: '9', name: 'Mesa Flexora', category: 'Pernas' },
];

export default function ActiveWorkoutOverlay() {
  const { user } = useAuthStore();
  const {
    activeWorkout,
    restTimerActive,
    restTimerRemaining,
    restTimerExerciseName,
    tickWorkoutTimer,
    tickRestTimer,
    stopRestTimer,
    adjustRestTimer,
    updateSet,
    toggleSetComplete,
    addSetToActiveExercise,
    removeSetFromActiveExercise,
    removeExerciseFromActive,
    addExerciseToActive,
    finishWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Efeito global de Tick para o Treino e Cronômetro de Descanso
  useEffect(() => {
    let interval: any;
    if (activeWorkout) {
      interval = setInterval(() => {
        tickWorkoutTimer();
        if (restTimerActive && restTimerRemaining > 0) {
          tickRestTimer();
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeWorkout, restTimerActive, restTimerRemaining]);

  if (!activeWorkout) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h > 0 ? h : null,
      m.toString().padStart(h > 0 ? 2 : 1, '0'),
      s.toString().padStart(2, '0'),
    ]
      .filter((x) => x !== null)
      .join(':');
  };

  const handleFinish = async () => {
    if (!user?.id) {
      Alert.alert('Aviso', 'Faça login para salvar o treino.');
      return;
    }

    setFinishing(true);
    try {
      const result = await finishWorkout(user.id);
      if (result) {
        setIsExpanded(false);
        let msg = `Você ganhou +${result.xp} XP!`;
        if (result.leveledUp) {
          msg += `\n\n🎉 PARABÉNS! Você subiu para o Nível ${result.newLevel}!`;
        }
        Alert.alert('Treino Concluído!', msg);
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o treino.');
    } finally {
      setFinishing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Treino?',
      'Você perderá todos os registros deste treino ativo.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            setIsExpanded(false);
          },
        },
      ]
    );
  };

  return (
    <>
      {/* 1. BARRA MINIMIZADA INFERIOR */}
      {!isExpanded && (
        <TouchableOpacity
          style={styles.minimizedBar}
          activeOpacity={0.9}
          onPress={() => setIsExpanded(true)}
        >
          <View style={styles.minimizedContent}>
            <View style={styles.minimizedLeft}>
              <Ionicons name="barbell" size={20} color={Colors.dark.accent} style={styles.spinningIcon} />
              <View>
                <ThemedText style={styles.minimizedTitle}>{activeWorkout.name}</ThemedText>
                <ThemedText style={styles.minimizedTimer}>{formatTime(activeWorkout.durationSeconds)}</ThemedText>
              </View>
            </View>

            <View style={styles.minimizedRight}>
              {restTimerActive && restTimerRemaining > 0 && (
                <View style={styles.minimizedRestTimer}>
                  <Ionicons name="timer" size={16} color="#3B82F6" />
                  <ThemedText style={styles.minimizedRestText}>{restTimerRemaining}s</ThemedText>
                </View>
              )}
              <TouchableOpacity style={styles.minimizedFinishBtn} onPress={handleFinish}>
                <ThemedText style={styles.minimizedFinishText}>Finalizar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* 2. TELA CHEIA EXPANDIDA (MODAL) */}
      <Modal visible={isExpanded} animationType="slide" transparent={false}>
        <ThemedView style={styles.expandedContainer}>
          <SafeAreaView style={styles.expandedSafeArea}>
            {/* Header */}
            <View style={styles.expandedHeader}>
              <TouchableOpacity onPress={() => setIsExpanded(false)}>
                <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <ThemedText type="subtitle" style={styles.expandedTitle}>
                  {activeWorkout.name}
                </ThemedText>
                <ThemedText style={styles.expandedDuration}>
                  Tempo: {formatTime(activeWorkout.durationSeconds)}
                </ThemedText>
              </View>
              <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} disabled={finishing}>
                {finishing ? (
                  <ActivityIndicator color="#09090B" size="small" />
                ) : (
                  <ThemedText style={styles.finishBtnText}>Finalizar</ThemedText>
                )}
              </TouchableOpacity>
            </View>

            {/* Widget do Cronômetro de Descanso */}
            {restTimerActive && restTimerRemaining > 0 && (
              <View style={styles.restTimerCard}>
                <View style={styles.restTimerHeader}>
                  <Ionicons name="timer" size={20} color="#3B82F6" />
                  <ThemedText style={styles.restTimerTitle}>
                    Descansando de: {restTimerExerciseName}
                  </ThemedText>
                </View>
                <ThemedText style={styles.restTimerCountdown}>{restTimerRemaining}s</ThemedText>
                <View style={styles.restTimerControls}>
                  <TouchableOpacity style={styles.restTimerBtn} onPress={() => adjustRestTimer(-30)}>
                    <ThemedText style={styles.restTimerBtnText}>-30s</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.restTimerBtn, styles.restTimerSkipBtn]} onPress={stopRestTimer}>
                    <ThemedText style={styles.restTimerBtnText}>Pular</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.restTimerBtn} onPress={() => adjustRestTimer(30)}>
                    <ThemedText style={styles.restTimerBtnText}>+30s</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Lista de Exercícios Ativos */}
            <ScrollView contentContainerStyle={styles.workoutScroll} keyboardShouldPersistTaps="handled">
              {activeWorkout.exercises.length === 0 ? (
                <View style={styles.emptyWorkoutView}>
                  <Ionicons name="fitness" size={48} color="#27272A" />
                  <ThemedText style={styles.emptyWorkoutText}>
                    Nenhum exercício adicionado. Toque no botão abaixo para adicionar!
                  </ThemedText>
                </View>
              ) : (
                activeWorkout.exercises.map((ex, exIdx) => (
                  <View key={`${ex.id}-${exIdx}`} style={styles.exerciseCard}>
                    {/* Header do Exercício */}
                    <View style={styles.exerciseHeader}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.exerciseName}>{ex.name}</ThemedText>
                        <ThemedText style={styles.exerciseCategory}>{ex.category}</ThemedText>
                      </View>
                      <TouchableOpacity onPress={() => removeExerciseFromActive(exIdx)}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Tabela de Séries */}
                    <View style={styles.setsTableHeader}>
                      <ThemedText style={[styles.columnLabel, { width: 40 }]}>SÉRIE</ThemedText>
                      <ThemedText style={[styles.columnLabel, { flex: 1 }]}>ANTERIOR</ThemedText>
                      <ThemedText style={[styles.columnLabel, { width: 70, textAlign: 'center' }]}>KG</ThemedText>
                      <ThemedText style={[styles.columnLabel, { width: 60, textAlign: 'center' }]}>REPS</ThemedText>
                      <ThemedText style={[styles.columnLabel, { width: 40, textAlign: 'right' }]}></ThemedText>
                    </View>

                    {ex.sets.map((set, setIdx) => (
                      <View key={setIdx} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                        <ThemedText style={styles.setNumber}>{setIdx + 1}</ThemedText>
                        <ThemedText style={styles.previousValue}>
                          {set.previousWeight}kg x {set.previousReps}
                        </ThemedText>
                        
                        <TextInput
                          keyboardType="numeric"
                          style={styles.setInput}
                          value={set.weight.toString()}
                          onChangeText={(txt) => {
                            const val = parseFloat(txt) || 0;
                            updateSet(exIdx, setIdx, { weight: val });
                          }}
                        />

                        <TextInput
                          keyboardType="numeric"
                          style={styles.setInput}
                          value={set.reps.toString()}
                          onChangeText={(txt) => {
                            const val = parseInt(txt) || 0;
                            updateSet(exIdx, setIdx, { reps: val });
                          }}
                        />

                        <TouchableOpacity 
                          style={[styles.checkbox, set.completed && styles.checkboxCompleted]}
                          onPress={() => toggleSetComplete(exIdx, setIdx)}
                        >
                          {set.completed && <Ionicons name="checkmark" size={16} color="#09090B" />}
                        </TouchableOpacity>
                      </View>
                    ))}

                    <View style={styles.exerciseActions}>
                      <TouchableOpacity 
                        style={styles.addSetBtn}
                        onPress={() => addSetToActiveExercise(exIdx)}
                      >
                        <Ionicons name="add" size={16} color="#A1A1AA" />
                        <ThemedText style={styles.addSetText}>Série</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeSetBtn}
                        onPress={() => removeSetFromActiveExercise(exIdx, ex.sets.length - 1)}
                      >
                        <Ionicons name="remove" size={16} color="#A1A1AA" />
                        <ThemedText style={styles.removeSetText}>Série</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              {/* Botões do Rodapé de Execução */}
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={[styles.footerBtn, styles.addExerciseBtn]}
                  onPress={() => setShowAddExerciseModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#09090B" />
                  <ThemedText style={styles.addExerciseBtnText}>Adicionar Exercício</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.footerBtn, styles.cancelBtn]}
                  onPress={handleCancel}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                  <ThemedText style={styles.cancelBtnText}>Cancelar Treino</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>

      {/* 3. MODAL DE SELEÇÃO DE EXERCÍCIOS PARA ADICIONAR */}
      <Modal visible={showAddExerciseModal} animationType="slide">
        <ThemedView style={styles.modalSelectContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalSelectHeader}>
              <ThemedText type="subtitle" style={{ color: '#FFFFFF' }}>Selecionar Exercício</ThemedText>
              <TouchableOpacity onPress={() => setShowAddExerciseModal(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: Spacing.four }}>
              {fallbackExercises.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.selectItem}
                  onPress={() => {
                    addExerciseToActive(item);
                    setShowAddExerciseModal(false);
                  }}
                >
                  <View>
                    <ThemedText style={styles.selectItemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.selectItemCategory}>{item.category}</ThemedText>
                  </View>
                  <Ionicons name="add-circle" size={24} color={Colors.dark.accent} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  minimizedBar: {
    position: 'absolute',
    bottom: 50, // Logo acima da barra de navegação principal
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#1E1E24',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    zIndex: 999,
  },
  minimizedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minimizedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spinningIcon: {
    marginRight: 4,
  },
  minimizedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  minimizedTimer: {
    fontSize: 12,
    color: Colors.dark.accent,
  },
  minimizedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  minimizedRestTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  minimizedRestText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  minimizedFinishBtn: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 6,
  },
  minimizedFinishText: {
    color: '#09090B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandedContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  expandedSafeArea: {
    flex: 1,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  expandedTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  expandedDuration: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  finishBtn: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 6,
  },
  finishBtnText: {
    color: '#09090B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  restTimerCard: {
    backgroundColor: '#1E293B',
    margin: Spacing.four,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  restTimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  restTimerTitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  restTimerCountdown: {
    fontSize: 32,
    fontWeight: '800',
    color: '#38BDF8',
    marginVertical: Spacing.one,
  },
  restTimerControls: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  restTimerBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 6,
  },
  restTimerSkipBtn: {
    backgroundColor: '#EF4444',
  },
  restTimerBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  workoutScroll: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  emptyWorkoutView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.three,
  },
  emptyWorkoutText: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    maxWidth: 260,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.four,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseCategory: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  setsTableHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
    paddingHorizontal: 4,
  },
  columnLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(212, 255, 19, 0.05)',
  },
  setNumber: {
    width: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  previousValue: {
    flex: 1,
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  setInput: {
    width: 60,
    height: 32,
    backgroundColor: '#09090B',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272A',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 4,
    fontSize: 14,
  },
  checkbox: {
    width: 32,
    height: 32,
    backgroundColor: '#27272A',
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Colors.dark.accent,
  },
  exerciseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addSetText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  removeSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeSetText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  footerButtons: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  footerBtn: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  addExerciseBtn: {
    backgroundColor: Colors.dark.accent,
  },
  addExerciseBtnText: {
    color: '#09090B',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalSelectContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  selectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  selectItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectItemCategory: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
