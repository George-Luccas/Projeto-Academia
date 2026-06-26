import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  xpReward: number;
  unlocked: boolean;
}

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  // Nível e XP calculados
  const currentLvl = profile?.level || 1;
  const currentXp = profile?.xp || 0;
  const xpInCurrentLvl = currentXp % 500;
  const xpProgressPercent = (xpInCurrentLvl / 500) * 100;

  // Lista de conquistas com status de desbloqueio dinâmico baseado no XP (para fins de demonstração comercial)
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Primeira de Muitas',
      description: 'Completou seu primeiro treino.',
      iconName: 'trophy',
      xpReward: 100,
      unlocked: currentXp >= 100,
    },
    {
      id: '2',
      title: 'Ritmo Firme',
      description: 'Finalizou 5 sessões de treino.',
      iconName: 'medal',
      xpReward: 250,
      unlocked: currentXp >= 600,
    },
    {
      id: '3',
      title: 'Foco Total',
      description: 'Alcançou streak de 3 dias seguidos.',
      iconName: 'flame',
      xpReward: 200,
      unlocked: (profile?.daily_streak || 0) >= 3,
    },
    {
      id: '4',
      title: 'Hábito de Ferro',
      description: 'Alcançou streak de 7 dias seguidos.',
      iconName: 'flash',
      xpReward: 400,
      unlocked: (profile?.daily_streak || 0) >= 7,
    },
    {
      id: '5',
      title: 'Quebrando Recordes',
      description: 'Registrou um recorde pessoal (PR).',
      iconName: 'star',
      xpReward: 150,
      unlocked: currentXp >= 300,
    },
    {
      id: '6',
      title: 'Lenda das Cargas',
      description: 'Registrou 10 recordes pessoais.',
      iconName: 'trophy',
      xpReward: 500,
      unlocked: currentXp >= 1500,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Cartão do Perfil do Atleta */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                <ThemedText style={styles.avatarInitial}>
                  {(profile?.full_name || 'A')[0].toUpperCase()}
                </ThemedText>
                <View style={styles.badgeLevelContainer}>
                  <ThemedText style={styles.badgeLevelText}>{currentLvl}</ThemedText>
                </View>
              </View>
              <View style={styles.profileInfo}>
                <ThemedText style={styles.profileName}>
                  {profile?.full_name || 'Membro Hulk Academia'}
                </ThemedText>
                <ThemedText style={styles.profileUsername}>
                  @{profile?.username || 'atleta'}
                </ThemedText>
                <View style={styles.roleTag}>
                  <ThemedText style={styles.roleTagText}>
                    {profile?.role === 'trainer' ? 'Personal Trainer' : 'Atleta'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Progresso de Nível */}
            <View style={styles.levelProgressContainer}>
              <View style={styles.xpRow}>
                <ThemedText style={styles.levelLabel}>Nível {currentLvl}</ThemedText>
                <ThemedText style={styles.xpFraction}>{xpInCurrentLvl} / 500 XP</ThemedText>
              </View>
              <View style={styles.xpProgressBarBg}>
                <View style={[styles.xpProgressBarActive, { width: `${xpProgressPercent}%` }]} />
              </View>
              <ThemedText style={styles.totalXpLabel}>
                XP Total Acumulado: {currentXp} XP
              </ThemedText>
            </View>

            {/* Mini Stats (Streak + Conquistas) */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="flame" size={24} color="#FF9500" />
                <ThemedText style={styles.statValue}>{profile?.daily_streak || 0} dias</ThemedText>
                <ThemedText style={styles.statLabel}>Streak Ativo</ThemedText>
              </View>
              <View style={[styles.statBox, styles.statBoxDivider]}>
                <Ionicons name="trophy" size={24} color={Colors.dark.accent} />
                <ThemedText style={styles.statValue}>
                  {unlockedCount} / {achievements.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Conquistas</ThemedText>
              </View>
            </View>
          </View>

          {/* Mural de Conquistas */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Minhas Conquistas
          </ThemedText>

          <View style={styles.achievementsGrid}>
            {achievements.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.achievementCard,
                  !item.unlocked && styles.achievementCardLocked,
                ]}
              >
                <View
                  style={[
                    styles.achievementIconCircle,
                    item.unlocked ? styles.iconCircleUnlocked : styles.iconCircleLocked,
                  ]}
                >
                  <Ionicons
                    name={item.unlocked ? item.iconName : 'lock-closed'}
                    size={24}
                    color={item.unlocked ? '#09090B' : '#71717A'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={[
                      styles.achievementTitle,
                      !item.unlocked && styles.textMuted,
                    ]}
                  >
                    {item.title}
                  </ThemedText>
                  <ThemedText style={styles.achievementDesc}>
                    {item.description}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.achievementXp,
                      item.unlocked ? { color: Colors.dark.accent } : { color: '#71717A' },
                    ]}
                  >
                    +{item.xpReward} XP
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* Botão Sair da Conta */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <ThemedText style={styles.signOutText}>Sair da Conta</ThemedText>
          </TouchableOpacity>

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
  profileHeaderCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.five,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginBottom: Spacing.four,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#09090B',
  },
  badgeLevelContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.dark.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLevelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#09090B',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileUsername: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  levelProgressContainer: {
    marginBottom: Spacing.four,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpFraction: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  xpProgressBarBg: {
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
  totalXpLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: Spacing.three,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statBoxDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#27272A',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: Spacing.three,
  },
  achievementsGrid: {
    gap: Spacing.three,
    marginBottom: Spacing.five,
  },
  achievementCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  achievementCardLocked: {
    borderColor: '#18181B',
  },
  achievementIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleUnlocked: {
    backgroundColor: Colors.dark.accent,
  },
  iconCircleLocked: {
    backgroundColor: '#27272A',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  achievementXp: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  textMuted: {
    color: '#71717A',
  },
  signOutBtn: {
    height: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.two,
  },
  signOutText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
