import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import CircularProgress from '@/components/CircularProgress';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { profile, user } = useAuthStore();
  const {
    todayLog,
    targetCalories,
    targetWater,
    targetProtein,
    targetCarbs,
    targetFat,
    fetchTodayLog,
    logWater,
  } = useNutritionStore();

  useEffect(() => {
    if (user?.id) {
      fetchTodayLog(user.id);
    }
  }, [user]);

  const handleAddWater = (amountMl: number) => {
    if (user?.id) {
      logWater(user.id, amountMl);
    }
  };

  // Nível e XP calculados
  const currentLvl = profile?.level || 1;
  const currentXp = profile?.xp || 0;
  const xpInCurrentLvl = currentXp % 500;
  const xpProgressPercent = (xpInCurrentLvl / 500) * 100;

  // Estatísticas de progresso
  const caloriesPercent = Math.min(todayLog.calories / targetCalories, 1);
  const waterPercent = Math.min(todayLog.water_ml / targetWater, 1);
  const workoutPercent = 0; // Será preenchido quando criarmos a store de treinos

  // Macros progress
  const proteinPercent = Math.min(todayLog.protein / targetProtein, 1);
  const carbsPercent = Math.min(todayLog.carbs / targetCarbs, 1);
  const fatPercent = Math.min(todayLog.fat / targetFat, 1);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Cabeçalho do Perfil */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.welcomeText}>Olá,</ThemedText>
              <ThemedText type="subtitle" style={styles.userName}>
                {profile?.full_name || 'Atleta'}
              </ThemedText>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={20} color="#FF9500" />
              <ThemedText style={styles.streakText}>
                {profile?.daily_streak || 0} dias
              </ThemedText>
            </View>
          </View>

          {/* Gamificação / Card de Nível */}
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <ThemedText style={styles.levelBadgeText}>LVL {currentLvl}</ThemedText>
              </View>
              <ThemedText style={styles.xpText}>
                {xpInCurrentLvl} / 500 XP
              </ThemedText>
            </View>
            <View style={styles.xpProgressBarBackground}>
              <View style={[styles.xpProgressBarActive, { width: `${xpProgressPercent}%` }]} />
            </View>
            <ThemedText style={styles.levelCaption}>
              Faltam {500 - xpInCurrentLvl} XP para subir de nível! Finalize treinos para ganhar XP.
            </ThemedText>
          </View>

          {/* Ações Rápidas */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => router.push('/workouts')}
            >
              <Ionicons name="play" size={22} color="#09090B" />
              <ThemedText style={styles.primaryActionText}>Iniciar Treino</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryActionButton]}
              onPress={() => router.push('/chat')}
            >
              <Ionicons name="chatbubbles" size={22} color="#D4FF13" />
              <ThemedText style={styles.secondaryActionText}>Falar com Coach IA</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Círculos de Resumo Diário */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            RESUMO DIÁRIO
          </ThemedText>
          
          <View style={styles.progressGrid}>
            
            {/* Círculo de Treino */}
            <View style={styles.progressCard}>
              <CircularProgress
                size={80}
                strokeWidth={8}
                progress={workoutPercent}
                color={Colors.dark.accent}
                backgroundColor="#27272A"
              >
                <View style={styles.circleInner}>
                  <Ionicons name="barbell" size={24} color={Colors.dark.accent} />
                </View>
              </CircularProgress>
              <ThemedText style={styles.progressLabel}>Treino</ThemedText>
              <ThemedText style={styles.progressSubLabel}>
                {workoutPercent > 0 ? 'Concluído' : 'Pendente'}
              </ThemedText>
            </View>

            {/* Círculo de Calorias */}
            <View style={styles.progressCard}>
              <CircularProgress
                size={80}
                strokeWidth={8}
                progress={caloriesPercent}
                color="#EF4444"
                backgroundColor="#27272A"
              >
                <View style={styles.circleInner}>
                  <ThemedText style={styles.caloriesNumber}>
                    {todayLog.calories}
                  </ThemedText>
                </View>
              </CircularProgress>
              <ThemedText style={styles.progressLabel}>Calorias</ThemedText>
              <ThemedText style={styles.progressSubLabel}>
                meta {targetCalories}
              </ThemedText>
            </View>

            {/* Círculo de Água */}
            <View style={styles.progressCard}>
              <CircularProgress
                size={80}
                strokeWidth={8}
                progress={waterPercent}
                color="#3B82F6"
                backgroundColor="#27272A"
              >
                <View style={styles.circleInner}>
                  <Ionicons name="water" size={24} color="#3B82F6" />
                </View>
              </CircularProgress>
              <ThemedText style={styles.progressLabel}>Água</ThemedText>
              <ThemedText style={styles.progressSubLabel}>
                {todayLog.water_ml}ml
              </ThemedText>
            </View>

          </View>

          {/* Seção de Macronutrientes */}
          <View style={styles.nutritionSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="smallBold" style={styles.nutritionTitle}>
                MACRONUTRIENTES
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/nutrition')}>
                <ThemedText style={styles.detailLink}>Detalhes</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.macroCard}>
              {/* Proteína */}
              <View style={styles.macroRow}>
                <View style={styles.macroTextRow}>
                  <ThemedText style={styles.macroName}>Proteína</ThemedText>
                  <ThemedText style={styles.macroValues}>
                    {todayLog.protein}g / {targetProtein}g
                  </ThemedText>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barActive, { backgroundColor: '#10B981', width: `${proteinPercent * 100}%` }]} />
                </View>
              </View>

              {/* Carboidratos */}
              <View style={styles.macroRow}>
                <View style={styles.macroTextRow}>
                  <ThemedText style={styles.macroName}>Carboidratos</ThemedText>
                  <ThemedText style={styles.macroValues}>
                    {todayLog.carbs}g / {targetCarbs}g
                  </ThemedText>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barActive, { backgroundColor: '#F59E0B', width: `${carbsPercent * 100}%` }]} />
                </View>
              </View>

              {/* Gorduras */}
              <View style={styles.macroRow}>
                <View style={styles.macroTextRow}>
                  <ThemedText style={styles.macroName}>Gordura</ThemedText>
                  <ThemedText style={styles.macroValues}>
                    {todayLog.fat}g / {targetFat}g
                  </ThemedText>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barActive, { backgroundColor: '#EF4444', width: `${fatPercent * 100}%` }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Registro Rápido de Água */}
          <View style={styles.waterLogSection}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              REGISTRO RÁPIDO DE ÁGUA (Meta {targetWater}ml)
            </ThemedText>
            <View style={styles.waterButtonsRow}>
              <TouchableOpacity 
                style={styles.waterQuickButton}
                onPress={() => handleAddWater(250)}
              >
                <Ionicons name="water-outline" size={18} color="#3B82F6" />
                <ThemedText style={styles.waterButtonText}>+250 ml</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.waterQuickButton}
                onPress={() => handleAddWater(500)}
              >
                <Ionicons name="water" size={18} color="#3B82F6" />
                <ThemedText style={styles.waterButtonText}>+500 ml</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

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
  scrollContainer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    gap: Spacing.one,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  levelCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.four,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  levelBadge: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelBadgeText: {
    color: '#09090B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  xpText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  xpProgressBarBackground: {
    height: 8,
    backgroundColor: '#27272A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  xpProgressBarActive: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
  },
  levelCaption: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  primaryActionButton: {
    backgroundColor: Colors.dark.accent,
  },
  primaryActionText: {
    color: '#09090B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryActionButton: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  secondaryActionText: {
    color: Colors.dark.accent,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: Spacing.two,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.five,
  },
  progressCard: {
    width: (width - Spacing.four * 2 - Spacing.three * 2) / 3,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  circleInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriesNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: Spacing.two,
  },
  progressSubLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  nutritionSection: {
    marginBottom: Spacing.five,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  nutritionTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  detailLink: {
    fontSize: 13,
    color: Colors.dark.accent,
    fontWeight: '600',
  },
  macroCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.three,
  },
  macroRow: {
    gap: Spacing.one,
  },
  macroTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroName: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  macroValues: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  barBg: {
    height: 6,
    backgroundColor: '#27272A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barActive: {
    height: '100%',
    borderRadius: 3,
  },
  waterLogSection: {
    marginBottom: Spacing.four,
  },
  waterButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  waterQuickButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#18181B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  waterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
