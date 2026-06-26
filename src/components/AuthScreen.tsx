import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemedText } from './themed-text';
import { AnimatedIcon } from './animated-icon';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'user' | 'trainer'>('user');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (!isLogin && (!fullName || !username)) {
      Alert.alert('Erro', 'Por favor, preencha o nome completo e o nome de usuário.');
      return;
    }

    setLoading(true);

    try {
      const isPlaceholder = !process.env.EXPO_PUBLIC_SUPABASE_URL || 
                            process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project') ||
                            process.env.EXPO_PUBLIC_SUPABASE_URL === '';
      
      if (isPlaceholder) {
        // Bypass automático - Modo de Demonstração
        console.warn('Supabase não configurado. Ativando o Modo Demo local.');
        
        const authStore = useAuthStore.getState();
        const mockUser = { id: 'mock-user-id', email } as any;
        const mockSession = { user: mockUser, access_token: 'mock-token' } as any;

        // Simula latência de rede
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Define a sessão ativa
        await authStore.setSession(mockSession);

        // Injeta dados simulados no perfil
        useAuthStore.setState({
          profile: {
            id: 'mock-user-id',
            full_name: isLogin ? 'Atleta Demonstrativo' : fullName,
            username: isLogin ? 'atleta_demo' : username.toLowerCase().trim(),
            avatar_url: null,
            role: isLogin ? 'user' : role,
            level: 2,
            xp: 620, // Começa com nível 2 e 620 XP para mostrar a barra progredindo
            daily_streak: 5,
            last_active_date: new Date().toISOString().split('T')[0],
          },
          loading: false,
        });

        if (!isLogin) {
          Alert.alert('Modo Demo', 'Conta demo criada! Perfil ativado localmente.');
        }
        return;
      }

      if (isLogin) {
        // Fluxo de Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } else {
        // Fluxo de Registro
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: username.toLowerCase().trim(),
              role: role,
            },
          },
        });

        if (error) throw error;
        Alert.alert('Sucesso', 'Conta criada com sucesso! Você já pode fazer login.');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      Alert.alert('Falha na Autenticação', error.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <AnimatedIcon />
            <ThemedText type="title" style={styles.logoText}>
              Hulk <ThemedText style={styles.accentText}>Academia</ThemedText>
            </ThemedText>
            <ThemedText type="small" style={styles.subtitle}>
              {isLogin ? 'Seu diário fitness de nível profissional' : 'Crie sua conta comercial ou de atleta'}
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>
              {isLogin ? 'Iniciar Sessão' : 'Criar Nova Conta'}
            </ThemedText>

            {!isLogin && (
              <>
                <ThemedText style={styles.label}>Nome Completo</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: João Silva"
                  placeholderTextColor="#71717A"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />

                <ThemedText style={styles.label}>Nome de Usuário (@username)</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: joaosilva"
                  placeholderTextColor="#71717A"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <ThemedText style={styles.label}>Eu sou um:</ThemedText>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
                    onPress={() => setRole('user')}
                  >
                    <ThemedText style={[styles.roleText, role === 'user' && styles.roleTextActive]}>
                      Atleta (Aluno)
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'trainer' && styles.roleButtonActive]}
                    onPress={() => setRole('trainer')}
                  >
                    <ThemedText style={[styles.roleText, role === 'trainer' && styles.roleTextActive]}>
                      Personal Trainer
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <ThemedText style={styles.label}>E-mail</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="seu-email@exemplo.com"
              placeholderTextColor="#71717A"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              autoCorrect={false}
            />

            <ThemedText style={styles.label}>Senha</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#71717A"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              autoCorrect={false}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAuth} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#09090B" />
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  {isLogin ? 'Entrar' : 'Cadastrar'}
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
              <ThemedText style={styles.switchText}>
                {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  logoText: {
    fontSize: 28,
    marginTop: Spacing.two,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  accentText: {
    color: Colors.dark.accent,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.four,
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
    color: '#FFFFFF',
  },
  input: {
    height: 50,
    backgroundColor: '#09090B',
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#27272A',
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  roleButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  roleTextActive: {
    color: '#09090B',
  },
  submitButton: {
    height: 52,
    backgroundColor: Colors.dark.accent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  submitButtonText: {
    color: '#09090B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  switchText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
});
