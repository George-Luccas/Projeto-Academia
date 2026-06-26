import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import LineChart, { DataPoint } from '@/components/ui/LineChart';

const { width } = Dimensions.get('window');

interface ProgressPhoto {
  id: string;
  uri: string;
  date: string;
  weight: number;
}

// Dados simulados de evolução para o gráfico
const mockWeightData: DataPoint[] = [
  { label: 'Mar', value: 80.2 },
  { label: 'Abr', value: 79.5 },
  { label: 'Mai', value: 78.9 },
  { label: 'Jun', value: 77.4 },
];

const mockBenchPressData: DataPoint[] = [
  { label: 'Mar', value: 80 },
  { label: 'Abr', value: 85 },
  { label: 'Mai', value: 90 },
  { label: 'Jun', value: 95 },
];

// Fotos padrão de demonstração comercial
const demoPhotos: ProgressPhoto[] = [
  {
    id: 'demo-1',
    uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=300&auto=format&fit=crop',
    date: '10 de Março',
    weight: 80.2,
  },
  {
    id: 'demo-2',
    uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop',
    date: '15 de Junho',
    weight: 77.4,
  },
];

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const { logs, fetchLogs } = useWorkoutStore();
  const [activeSubTab, setActiveSubTab] = useState<'evolucao' | 'historico'>('evolucao');
  const [photos, setPhotos] = useState<ProgressPhoto[]>(demoPhotos);

  useEffect(() => {
    if (user?.id) {
      fetchLogs(user.id);
    }
  }, [user]);

  const handlePickImage = async () => {
    // Solicitar permissões de galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para adicioná-las.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        
        // Simular peso associado
        const currentWeight = photos.length > 0 ? photos[photos.length - 1].weight - 0.5 : 78;
        const formattedDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

        const newPhoto: ProgressPhoto = {
          id: Math.random().toString(),
          uri: selectedUri,
          date: formattedDate,
          weight: parseFloat(currentWeight.toFixed(1)),
        };

        setPhotos([...photos, newPhoto]);
        Alert.alert('Sucesso', 'Foto de progresso adicionada!');
      }
    } catch (err) {
      console.error('Erro ao escolher imagem:', err);
      Alert.alert('Erro', 'Não foi possível carregar a imagem.');
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Se os logs do Supabase estiverem vazios, injetamos logs simulados de demonstração
  const displayLogs = logs.length > 0 ? logs : [
    {
      id: 'mock-log-1',
      name: 'Treino A - Peito, Tríceps e Ombros',
      duration_seconds: 2750,
      xp_gained: 140,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-log-2',
      name: 'Treino B - Costas, Bíceps e Abdômen',
      duration_seconds: 3100,
      xp_gained: 160,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Abas Secundárias (Tabs) */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeSubTab === 'evolucao' && styles.tabButtonActive]}
            onPress={() => setActiveSubTab('evolucao')}
          >
            <ThemedText style={[styles.tabButtonText, activeSubTab === 'evolucao' && styles.tabButtonTextActive]}>
              Evolução Física
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeSubTab === 'historico' && styles.tabButtonActive]}
            onPress={() => setActiveSubTab('historico')}
          >
            <ThemedText style={[styles.tabButtonText, activeSubTab === 'historico' && styles.tabButtonTextActive]}>
              Histórico de Treino
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {activeSubTab === 'evolucao' ? (
            // ================= ABA EVOLUÇÃO =================
            <View style={styles.subTabContent}>
              
              {/* Gráfico de Peso */}
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="scale" size={18} color="#D4FF13" />
                  <ThemedText style={styles.chartTitle}>Evolução de Peso Corporal (kg)</ThemedText>
                </View>
                <LineChart data={mockWeightData} />
              </View>

              {/* Gráfico de Carga de 1RM */}
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="trending-up" size={18} color="#D4FF13" />
                  <ThemedText style={styles.chartTitle}>1RM Estimado - Supino Reto (kg)</ThemedText>
                </View>
                <LineChart data={mockBenchPressData} color="#10B981" gradientColor="#10B981" />
              </View>

              {/* Fotos de Evolução */}
              <View style={styles.photosSection}>
                <View style={styles.photosHeader}>
                  <ThemedText type="subtitle" style={styles.photosTitle}>
                    Fotos de Progresso
                  </ThemedText>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                    <Ionicons name="camera" size={18} color="#09090B" />
                    <ThemedText style={styles.uploadBtnText}>Adicionar</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.photosGrid}>
                  {photos.map((item, idx) => (
                    <View key={item.id} style={styles.photoContainer}>
                      <Image source={{ uri: item.uri }} style={styles.progressImage} />
                      <View style={styles.photoOverlay}>
                        <ThemedText style={styles.photoDate}>{item.date}</ThemedText>
                        <ThemedText style={styles.photoWeight}>{item.weight} kg</ThemedText>
                      </View>
                      <View style={styles.beforeAfterBadge}>
                        <ThemedText style={styles.beforeAfterText}>
                          {idx === 0 ? 'ANTES' : 'DEPOIS'}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

            </View>
          ) : (
            // ================= ABA HISTÓRICO =================
            <View style={styles.subTabContent}>
              <ThemedText type="smallBold" style={styles.logsSubtitle}>
                TREINOS ANTERIORES
              </ThemedText>

              {displayLogs.map((log) => {
                const formattedDate = new Date(log.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logCardHeader}>
                      <View>
                        <ThemedText style={styles.logName}>{log.name}</ThemedText>
                        <ThemedText style={styles.logDate}>{formattedDate}</ThemedText>
                      </View>
                      <View style={styles.xpBadge}>
                        <ThemedText style={styles.xpBadgeText}>+{log.xp_gained} XP</ThemedText>
                      </View>
                    </View>

                    <View style={styles.logCardStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={16} color={Colors.dark.textSecondary} />
                        <ThemedText style={styles.statText}>
                          {formatDuration(log.duration_seconds)}
                        </ThemedText>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="checkmark-circle-outline" size={16} color={Colors.dark.textSecondary} />
                        <ThemedText style={styles.statText}>Completo</ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    backgroundColor: Colors.dark.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.dark.accent,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.dark.accent,
  },
  scrollContainer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  subTabContent: {
    gap: Spacing.four,
  },
  chartCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  photosSection: {
    marginTop: Spacing.two,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  photosTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  uploadBtnText: {
    color: '#09090B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  photoContainer: {
    flex: 1,
    height: 180,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    position: 'relative',
  },
  progressImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
  },
  photoDate: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
  },
  photoWeight: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  beforeAfterBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(9, 9, 11, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#27272A',
  },
  beforeAfterText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.dark.accent,
  },
  logsSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
  },
  logCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.three,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  logName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logDate: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  xpBadgeText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  logCardStats: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
});
