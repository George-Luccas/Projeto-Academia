import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function NutritionScreen() {
  const { user } = useAuthStore();
  const {
    todayLog,
    targetCalories,
    targetWater,
    targetProtein,
    targetCarbs,
    targetFat,
    logWater,
    logMacros,
  } = useNutritionStore();

  const [meals, setMeals] = useState<MealItem[]>([
    { id: '1', name: 'Omelete de 3 ovos com queijo', calories: 340, protein: 24, carbs: 3, fat: 26 },
    { id: '2', name: 'Arroz integral, feijão e frango grelhado', calories: 520, protein: 42, carbs: 65, fat: 8 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleAddFood = () => {
    if (!foodName || !calories) {
      Alert.alert('Erro', 'Nome do alimento e calorias são obrigatórios.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Aviso', 'Faça login para salvar seus registros.');
      return;
    }

    const calVal = parseInt(calories) || 0;
    const protVal = parseInt(protein) || 0;
    const carbVal = parseInt(carbs) || 0;
    const fatVal = parseInt(fat) || 0;

    // Adiciona na store global
    logMacros(user.id, calVal, protVal, carbVal, fatVal);

    // Adiciona na lista local de refeições da tela
    const newMeal: MealItem = {
      id: Math.random().toString(),
      name: foodName,
      calories: calVal,
      protein: protVal,
      carbs: carbVal,
      fat: fatVal,
    };

    setMeals([...meals, newMeal]);

    // Limpa campos e fecha modal
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setModalVisible(false);

    Alert.alert('Sucesso', 'Alimento adicionado ao seu diário!');
  };

  const handleAddWater = (amount: number) => {
    if (user?.id) {
      logWater(user.id, amount);
    }
  };

  // Calcular sobras e percentuais
  const remainingCalories = Math.max(targetCalories - todayLog.calories, 0);
  const calPercent = Math.min((todayLog.calories / targetCalories) * 100, 100);
  const waterPercent = Math.min((todayLog.water_ml / targetWater) * 100, 100);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Card Resumo de Calorias */}
          <View style={styles.calCard}>
            <ThemedText style={styles.calCardTitle}>DIÁRIO CALÓRICO</ThemedText>
            <View style={styles.calRow}>
              <View style={styles.calCol}>
                <ThemedText style={styles.calNumber}>{targetCalories}</ThemedText>
                <ThemedText style={styles.calLabel}>Meta</ThemedText>
              </View>
              <ThemedText style={styles.calOperator}>-</ThemedText>
              <View style={styles.calCol}>
                <ThemedText style={styles.calNumber}>{todayLog.calories}</ThemedText>
                <ThemedText style={styles.calLabel}>Consumido</ThemedText>
              </View>
              <StandardEqualText />
              <View style={styles.calCol}>
                <ThemedText style={[styles.calNumber, { color: Colors.dark.accent }]}>
                  {remainingCalories}
                </ThemedText>
                <ThemedText style={styles.calLabel}>Restantes</ThemedText>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarActive, { width: `${calPercent}%` }]} />
            </View>
          </View>

          {/* Widget de Hidratação */}
          <View style={styles.waterWidget}>
            <View style={styles.waterHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="water" size={20} color="#3B82F6" />
                <ThemedText style={styles.waterTitle}>Registro de Hidratação</ThemedText>
              </View>
              <ThemedText style={styles.waterFraction}>
                {todayLog.water_ml} / {targetWater} ml
              </ThemedText>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarActive, { backgroundColor: '#3B82F6', width: `${waterPercent}%` }]} />
            </View>
            <View style={styles.waterButtons}>
              <TouchableOpacity style={styles.waterBtn} onPress={() => handleAddWater(250)}>
                <ThemedText style={styles.waterBtnText}>+250ml</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waterBtn} onPress={() => handleAddWater(500)}>
                <ThemedText style={styles.waterBtnText}>+500ml</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Listagem de Refeições */}
          <View style={styles.mealsHeader}>
            <ThemedText type="subtitle" style={styles.mealsTitle}>
              Alimentos do Dia
            </ThemedText>
            <TouchableOpacity style={styles.addFoodBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={20} color={Colors.dark.accent} />
              <ThemedText style={styles.addFoodText}>Alimento</ThemedText>
            </TouchableOpacity>
          </View>

          {meals.length === 0 ? (
            <View style={styles.emptyView}>
              <ThemedText style={styles.emptyText}>Nenhum alimento registrado hoje.</ThemedText>
            </View>
          ) : (
            meals.map((meal) => (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealInfo}>
                  <ThemedText style={styles.mealName}>{meal.name}</ThemedText>
                  <ThemedText style={styles.mealMacros}>
                    P: {meal.protein}g  •  C: {meal.carbs}g  •  G: {meal.fat}g
                  </ThemedText>
                </View>
                <ThemedText style={styles.mealCalories}>{meal.calories} kcal</ThemedText>
              </View>
            ))
          )}

        </ScrollView>
      </SafeAreaView>

      {/* MODAL DE ADICIONAR ALIMENTO */}
      <Modal visible={modalVisible} animationType="slide">
        <ThemedView style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={{ color: '#FFFFFF' }}>Logar Alimento</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <ThemedText style={styles.label}>Nome do Alimento</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Ex: Peito de Frango Grelhado"
                placeholderTextColor="#71717A"
                value={foodName}
                onChangeText={setFoodName}
              />

              <ThemedText style={styles.label}>Calorias (kcal)</ThemedText>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Ex: 165"
                placeholderTextColor="#71717A"
                value={calories}
                onChangeText={setCalories}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.label}>Proteína (g)</ThemedText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Ex: 31"
                    placeholderTextColor="#71717A"
                    value={protein}
                    onChangeText={setProtein}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.label}>Carbos (g)</ThemedText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Ex: 0"
                    placeholderTextColor="#71717A"
                    value={carbs}
                    onChangeText={setCarbs}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.label}>Gordura (g)</ThemedText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Ex: 3"
                    placeholderTextColor="#71717A"
                    value={fat}
                    onChangeText={setFat}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveFoodBtn} onPress={handleAddFood}>
                <ThemedText style={styles.saveFoodBtnText}>Salvar no Diário</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

// Pequeno helper para renderizar sinal de igual respeitando regras de tags
function StandardEqualText() {
  return <ThemedText style={styles.calOperator}>=</ThemedText>;
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
  calCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.four,
  },
  calCardTitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: Spacing.three,
  },
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  calCol: {
    alignItems: 'center',
  },
  calNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  calOperator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#27272A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
  },
  waterWidget: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.five,
    gap: Spacing.two,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  waterFraction: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  waterButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  waterBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBtnText: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  mealsTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addFoodText: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  mealCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  mealMacros: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyView: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalContent: {
    padding: Spacing.four,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  input: {
    height: 50,
    backgroundColor: '#18181B',
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#27272A',
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  saveFoodBtn: {
    height: 52,
    backgroundColor: Colors.dark.accent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  saveFoodBtnText: {
    color: '#09090B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
