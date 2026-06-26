import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, Profile } from '@/store/useAuthStore';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const { width } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

// Respostas simuladas e inteligentes do Coach IA caso o usuário esteja offline ou sem API Key real
const getAiResponse = (userInput: string): string => {
  const query = userInput.toLowerCase();
  if (query.includes('agachamento')) {
    return 'Dica do Coach: No agachamento, mantenha os pés na largura dos ombros, aponte os joelhos levemente para fora e desça empurrando o quadril para trás. Mantenha o abdômen contraído para proteger a lombar!';
  }
  if (query.includes('creatina')) {
    return 'Dica do Coach: A creatina aumenta a força e a hidratação celular. O ideal é tomar de 3g a 5g todos os dias, preferencialmente com uma fonte de carboidrato para melhorar a absorção. O horário não importa, pois ela funciona por acúmulo!';
  }
  if (query.includes('dieta') || query.includes('comer') || query.includes('massa')) {
    return 'Dica do Coach: Para ganho de massa (hipertrofia), você precisa de um superávit calórico (comer mais calorias do que gasta) com foco em proteínas (cerca de 1.6g a 2.0g por kg de peso corporal). Foque em carboidratos complexos e gorduras boas!';
  }
  if (query.includes('dor') || query.includes('lesão') || query.includes('machucou')) {
    return 'Alerta do Coach: Se sentir dores nas articulações ou desconfortos incomuns, interrompa o exercício imediatamente. Não confunda dor muscular tardia com lesão. Se a dor persistir, consulte um fisioterapeuta!';
  }
  if (query.includes('cardio') || query.includes('esteira') || query.includes('perder peso')) {
    return 'Dica do Coach: Para emagrecimento, o principal fator é o déficit calórico. O cardio ajuda a aumentar o gasto diário e melhora a saúde cardiovascular. Faça 150 minutos de cardio moderado por semana associado à musculação!';
  }
  return 'Olá! Sou seu Coach de IA Fitness. Você tem alguma dúvida sobre execução de exercícios (ex: agachamento), suplementação (ex: creatina) ou dieta? Digite sua dúvida!';
};

// Alunos mockados para o painel de Personal Trainer
const mockClients: Profile[] = [
  {
    id: 'client-1',
    full_name: 'Mariana Silva',
    username: 'mari_silva',
    avatar_url: null,
    role: 'user',
    level: 3,
    xp: 1200,
    daily_streak: 5,
    last_active_date: '2026-06-23',
  },
  {
    id: 'client-2',
    full_name: 'Guilherme Santos',
    username: 'gui_santos',
    avatar_url: null,
    role: 'user',
    level: 5,
    xp: 2150,
    daily_streak: 8,
    last_active_date: '2026-06-22',
  },
];

export default function ChatScreen() {
  const { profile } = useAuthStore();
  const isTrainer = profile?.role === 'trainer';

  const [activeTab, setActiveTab] = useState<'ia' | 'trainer'>('ia');
  
  // State para o Coach IA
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: 'ai-welcome',
      senderId: 'ai',
      text: 'Olá! Sou o Hulk AI Coach, seu personal trainer de IA disponível 24h. Em que posso te ajudar hoje?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // State para Chat Humano (Personal/Aluno)
  const [activeClient, setActiveClient] = useState<Profile | null>(null);
  const [humanMessages, setHumanMessages] = useState<ChatMessage[]>([
    {
      id: 'h-1',
      senderId: 'trainer',
      text: 'Olá! Como foram os treinos essa semana? Sentiu alguma dor ou dificuldade?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [humanInput, setHumanInput] = useState('');

  const aiScrollRef = useRef<ScrollView>(null);
  const humanScrollRef = useRef<ScrollView>(null);

  // Auto-scroll para mensagens novas
  useEffect(() => {
    if (activeTab === 'ia') {
      setTimeout(() => aiScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [aiMessages, activeTab]);

  useEffect(() => {
    if (activeClient) {
      setTimeout(() => humanScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [humanMessages, activeClient]);

  // Enviar mensagem para o Coach de IA
  const handleSendAi = async () => {
    if (!aiInput.trim()) return;

    const userText = aiInput.trim();
    setAiInput('');
    setAiLoading(true);

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      senderId: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setAiMessages((prev) => [...prev, userMessage]);

    // Chamar API real ou simulada
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      let reply = '';

      if (apiKey && !apiKey.includes('placeholder')) {
        // Fluxo de chamada real para API do Gemini (Conectividade Oficial)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Você é o coach de fitness inteligente do aplicativo Hulk Academia. Responda à seguinte dúvida técnica de forma profissional, direta e motivadora. Dúvida: ${userText}`,
                }],
              }],
            }),
          }
        );
        const json = await response.json();
        reply = json.candidates?.[0]?.content?.parts?.[0]?.text || getAiResponse(userText);
      } else {
        // Fallback local instantâneo
        await new Promise((resolve) => setTimeout(resolve, 1200));
        reply = getAiResponse(userText);
      }

      const botMessage: ChatMessage = {
        id: Math.random().toString(),
        senderId: 'ai',
        text: reply,
        timestamp: new Date().toISOString(),
      };

      setAiMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.warn('Erro ao chamar IA, utilizando fallback local:', err);
      const botMessage: ChatMessage = {
        id: Math.random().toString(),
        senderId: 'ai',
        text: getAiResponse(userText),
        timestamp: new Date().toISOString(),
      };
      setAiMessages((prev) => [...prev, botMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  // Enviar mensagem no Chat Aluno <-> Treinador
  const handleSendHuman = () => {
    if (!humanInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      senderId: isTrainer ? 'trainer' : 'user',
      text: humanInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setHumanMessages((prev) => [...prev, userMessage]);
    setHumanInput('');

    // Resposta simulada após 2 segundos
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: Math.random().toString(),
        senderId: isTrainer ? 'user' : 'trainer',
        text: isTrainer
          ? 'Professor, acabei de marcar meu treino A como concluído no dashboard! Consegui progredir 2kg no supino.'
          : 'Excelente! Mantenha a consistência. Prescrevi uma nova rotina para você fazer amanhã, dá uma olhada na aba de treinos!',
        timestamp: new Date().toISOString(),
      };
      setHumanMessages((prev) => [...prev, replyMessage]);
    }, 2000);
  };

  const handlePrescribeWorkout = (clientName: string) => {
    Alert.alert(
      'Atribuir Treino',
      `Qual rotina deseja prescrever para ${clientName}?`,
      [
        { text: 'Treino A (Peito/Tríceps)', onPress: () => Alert.alert('Sucesso', 'Treino A atribuído com sucesso!') },
        { text: 'Treino B (Costas/Bíceps)', onPress: () => Alert.alert('Sucesso', 'Treino B atribuído com sucesso!') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Abas Superiores */}
        <View style={styles.tabHeader}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'ia' && styles.tabActive]}
            onPress={() => {
              setActiveTab('ia');
              setActiveClient(null);
            }}
          >
            <ThemedText style={[styles.tabText, activeTab === 'ia' && styles.tabTextActive]}>
              Coach de IA
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'trainer' && styles.tabActive]}
            onPress={() => setActiveTab('trainer')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'trainer' && styles.tabTextActive]}>
              {isTrainer ? 'Meus Alunos' : 'Falar com Personal'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 1. FLUXO DO COACH DE IA */}
        {activeTab === 'ia' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView
              ref={aiScrollRef}
              contentContainerStyle={styles.chatScroll}
              showsVerticalScrollIndicator={false}
            >
              {aiMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.bubble,
                    msg.senderId === 'user' ? styles.bubbleUser : styles.bubbleAi,
                  ]}
                >
                  <ThemedText style={msg.senderId === 'user' ? styles.textUser : styles.textAi}>
                    {msg.text}
                  </ThemedText>
                </View>
              ))}
              {aiLoading && (
                <View style={[styles.bubble, styles.bubbleAi, styles.loadingBubble]}>
                  <ActivityIndicator color={Colors.dark.accent} size="small" />
                  <ThemedText style={[styles.textAi, { marginLeft: 8 }]}>Analizando...</ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Pergunte sobre agachamento, creatina, dieta..."
                placeholderTextColor="#71717A"
                value={aiInput}
                onChangeText={setAiInput}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendAi}>
                <Ionicons name="send" size={18} color="#09090B" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* 2. FLUXO DO PERSONAL TRAINER / ALUNO */}
        {activeTab === 'trainer' && !activeClient && (
          <View style={{ flex: 1 }}>
            {isTrainer ? (
              // VISÃO DO TREINADOR: Listagem de Alunos e Painel de Gestão
              <ScrollView contentContainerStyle={styles.trainerPanelScroll}>
                <ThemedText type="smallBold" style={styles.sectionSubtitle}>
                  MEUS ATLETAS VINCULADOS
                </ThemedText>
                {mockClients.map((client) => (
                  <View key={client.id} style={styles.clientCard}>
                    <View style={styles.clientInfoRow}>
                      <View style={styles.clientAvatar}>
                        <ThemedText style={styles.clientAvatarText}>
                          {client.full_name[0]}
                        </ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.clientName}>{client.full_name}</ThemedText>
                        <ThemedText style={styles.clientMeta}>
                          Nível {client.level}  •  Streak {client.daily_streak} dias
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.clientActionsRow}>
                      <TouchableOpacity 
                        style={[styles.clientActionBtn, styles.primaryClientBtn]}
                        onPress={() => setActiveClient(client)}
                      >
                        <Ionicons name="chatbubbles-outline" size={16} color="#09090B" />
                        <ThemedText style={styles.clientActionTextPrimary}>Abrir Chat</ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.clientActionBtn, styles.secondaryClientBtn]}
                        onPress={() => handlePrescribeWorkout(client.full_name)}
                      >
                        <Ionicons name="barbell-outline" size={16} color={Colors.dark.accent} />
                        <ThemedText style={styles.clientActionTextSecondary}>Prescrever</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              // VISÃO DO ALUNO: Canal Direto com o Personal
              <View style={styles.personalContactContainer}>
                <View style={styles.personalContactCard}>
                  <View style={styles.trainerAvatarCircle}>
                    <ThemedText style={styles.trainerAvatarText}>LP</ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={styles.personalName}>Lucas Personal Trainer</ThemedText>
                  <ThemedText style={styles.personalSpecialty}>Especialista em Hipertrofia e Core</ThemedText>
                  
                  <TouchableOpacity
                    style={styles.openChatBtn}
                    onPress={() => setActiveClient({
                      id: 'trainer-Lucas',
                      full_name: 'Lucas Personal',
                      username: 'lucas_personal',
                      avatar_url: null,
                      role: 'trainer',
                      level: 10,
                      xp: 5000,
                      daily_streak: 30,
                      last_active_date: null
                    })}
                  >
                    <Ionicons name="chatbubbles" size={20} color="#09090B" />
                    <ThemedText style={styles.openChatBtnText}>Iniciar Conversa em Tempo Real</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 2.1 CONVERSA REALTIME ATIVA (Treinador <-> Aluno) */}
        {activeTab === 'trainer' && activeClient && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {/* Header da Conversa */}
            <View style={styles.chatRoomHeader}>
              <TouchableOpacity onPress={() => setActiveClient(null)}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <ThemedText style={styles.chatRoomName}>{activeClient.full_name}</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              ref={humanScrollRef}
              contentContainerStyle={styles.chatScroll}
              showsVerticalScrollIndicator={false}
            >
              {humanMessages.map((msg) => {
                const isMe = msg.senderId === (isTrainer ? 'trainer' : 'user');
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleUser : styles.bubbleAi,
                    ]}
                  >
                    <ThemedText style={isMe ? styles.textUser : styles.textAi}>
                      {msg.text}
                    </ThemedText>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Envie uma mensagem..."
                placeholderTextColor="#71717A"
                value={humanInput}
                onChangeText={setHumanInput}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendHuman}>
                <Ionicons name="send" size={18} color="#09090B" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
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
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.dark.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: Colors.dark.accent,
  },
  chatScroll: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#3F3F46',
    borderBottomRightRadius: 2,
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderBottomLeftRadius: 2,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textUser: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  textAi: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.three,
    backgroundColor: '#09090B',
    borderTopWidth: 1,
    borderTopColor: '#18181B',
    gap: Spacing.two,
  },
  chatInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#18181B',
    borderRadius: 23,
    paddingHorizontal: Spacing.four,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#27272A',
    fontSize: 14,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerPanelScroll: {
    padding: Spacing.four,
  },
  sectionSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: Spacing.three,
  },
  clientCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.three,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#09090B',
  },
  clientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clientMeta: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  clientActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  clientActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  primaryClientBtn: {
    backgroundColor: Colors.dark.accent,
  },
  secondaryClientBtn: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  clientActionTextPrimary: {
    color: '#09090B',
    fontWeight: 'bold',
    fontSize: 12,
  },
  clientActionTextSecondary: {
    color: Colors.dark.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  personalContactContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  personalContactCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    width: '100%',
  },
  trainerAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  trainerAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#09090B',
  },
  personalName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  personalSpecialty: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.four,
  },
  openChatBtn: {
    backgroundColor: Colors.dark.accent,
    height: 48,
    borderRadius: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openChatBtnText: {
    color: '#09090B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chatRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
  },
  chatRoomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
export type { ChatMessage };
