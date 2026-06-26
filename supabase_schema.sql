-- ==========================================
-- SCHEMA DE BANCO DE DADOS - GYMTRACK PRO
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- Habilitar a extensão de geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpar tabelas existentes (se houver) para evitar conflitos de re-execução
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.progress_photos CASCADE;
DROP TABLE IF EXISTS public.nutrition_logs CASCADE;
DROP TABLE IF EXISTS public.set_logs CASCADE;
DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.workout_template_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_templates CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Tabela de Perfis de Usuários (Vinculada à tabela de autenticação nativa do Supabase)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'trainer')),
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela de Exercícios
CREATE TABLE public.exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,       -- Ex: 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'
    equipment TEXT NOT NULL,      -- Ex: 'Barra', 'Halteres', 'Polia', 'Máquina', 'Peso Corporal'
    description TEXT,
    video_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Modelos de Rotina de Treino (Templates criados por alunos ou treinadores)
CREATE TABLE public.workout_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,           -- Ex: 'Treino A - Peitoral e Tríceps'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Exercícios que compõem cada modelo de treino (Tabela Pivot)
CREATE TABLE public.workout_template_exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    sets_count INTEGER DEFAULT 3,
    order_index INTEGER NOT NULL
);

-- 4. Histórico de Sessões de Treino Realizadas
CREATE TABLE public.workout_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,           -- Ex: 'Treino A - Peitoral e Tríceps'
    duration_seconds INTEGER NOT NULL,
    xp_gained INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Histórico de Séries (Sets) executadas em cada treino
CREATE TABLE public.set_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    set_index INTEGER NOT NULL,  -- 0 para primeira série, 1 para segunda, etc.
    reps INTEGER NOT NULL,
    weight NUMERIC(6,2) NOT NULL, -- Peso levantado (em kg)
    is_completed BOOLEAN DEFAULT TRUE,
    is_pr BOOLEAN DEFAULT FALSE,  -- Recorde pessoal de carga/volume
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Acompanhamento Nutricional Diário
CREATE TABLE public.nutrition_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    log_date DATE DEFAULT CURRENT_DATE NOT NULL,
    calories INTEGER DEFAULT 0,
    protein INTEGER DEFAULT 0,    -- gramas
    carbs INTEGER DEFAULT 0,      -- gramas
    fat INTEGER DEFAULT 0,        -- gramas
    water_ml INTEGER DEFAULT 0,   -- mililitros de água consumidos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, log_date)
);

-- 6. Fotos de Evolução Física
CREATE TABLE public.progress_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,      -- URL pública do Supabase Storage
    weight NUMERIC(5,2),          -- Peso no dia do upload
    body_fat_percentage NUMERIC(4,2), -- Percentual de gordura estimado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Sistema de Conquistas (Gamificação)
CREATE TABLE public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_icon TEXT NOT NULL,     -- Nome do ícone (ex: 'trophy', 'fire')
    xp_reward INTEGER DEFAULT 100 NOT NULL,
    requirement_type TEXT NOT NULL, -- 'workout_count', 'streak_days', 'pr_count'
    requirement_value INTEGER NOT NULL
);

-- Conquistas que os usuários desbloquearam
CREATE TABLE public.user_achievements (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id, achievement_id)
);

-- 8. Mensagens do Chat Interno (Comunicação Realtime Personal <-> Aluno)
CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    media_url TEXT,               -- Opcional (foto enviada no chat)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Metas Pessoais
CREATE TABLE public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    target_type TEXT CHECK (target_type IN ('weight', 'workout_count', 'calories', 'water_ml')),
    target_value NUMERIC(6,2) NOT NULL,
    current_value NUMERIC(6,2) DEFAULT 0.0 NOT NULL,
    deadline DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Políticas para Perfis (Leitura pública, edição pelo próprio dono)
CREATE POLICY "Leitura de perfis aberta para usuários autenticados" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Atualização do próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Exercícios (Qualquer usuário autenticado lê, somente o próprio ou nulo [sistema] edita)
CREATE POLICY "Leitura de exercícios permitida para todos" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Inserção de exercícios customizados" ON public.exercises FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Atualização de exercícios customizados" ON public.exercises FOR UPDATE USING (auth.uid() = created_by);

-- Políticas de dados do próprio usuário (Regra Geral: usuário acessa somente seus dados)
CREATE POLICY "Acesso total aos próprios templates de treino" ON public.workout_templates USING (auth.uid() = user_id);
CREATE POLICY "Acesso total aos próprios exercícios vinculados" ON public.workout_template_exercises USING (
    EXISTS (SELECT 1 FROM public.workout_templates WHERE id = template_id AND user_id = auth.uid())
);
CREATE POLICY "Acesso total aos próprios logs de treino" ON public.workout_logs USING (auth.uid() = user_id);
CREATE POLICY "Acesso total às próprias séries realizadas" ON public.set_logs USING (
    EXISTS (SELECT 1 FROM public.workout_logs WHERE id = workout_log_id AND user_id = auth.uid())
);
CREATE POLICY "Acesso total ao próprio registro de nutrição" ON public.nutrition_logs USING (auth.uid() = user_id);
CREATE POLICY "Acesso total às próprias fotos de evolução" ON public.progress_photos USING (auth.uid() = user_id);
CREATE POLICY "Leitura de conquistas permitida para todos" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Acesso total às próprias conquistas desbloqueadas" ON public.user_achievements USING (auth.uid() = user_id);
CREATE POLICY "Acesso total às próprias metas" ON public.goals USING (auth.uid() = user_id);

-- Políticas para Chat Realtime (Usuário lê/escreve se for remetente ou destinatário)
CREATE POLICY "Leitura de mensagens em conversas participantes" ON public.chat_messages 
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Envio de mensagens próprio" ON public.chat_messages 
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ==========================================
-- TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- ==========================================

-- Trigger para criar perfil automaticamente no banco de dados quando um novo usuário se cadastrar pelo Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, role, level, xp, daily_streak)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'atleta_' || substring(new.id::text from 1 for 8)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Membro GymTrack'),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    1,
    0,
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- CARGA INICIAL DE DADOS (SEEDS)
-- ==========================================

-- Inserindo Exercícios Padrão
INSERT INTO public.exercises (name, category, equipment, description) VALUES
-- PEITO (Chest)
('Supino Reto com Barra', 'Peito', 'Barra', 'Deitado no banco reto, empurre a barra para cima estendendo os braços de forma controlada.'),
('Supino Inclinado com Halteres', 'Peito', 'Halteres', 'Com banco inclinado a 30-45 graus, empurre os halteres até a extensão dos braços.'),
('Crucifixo Reto com Halteres', 'Peito', 'Halteres', 'Deitado no banco reto, abra os braços lateralmente mantendo leve flexão nos cotovelos.'),
('Crossover na Polia Média', 'Peito', 'Polia', 'Tracione os cabos da polia de trás para frente, focando na contração peitoral inferior/média.'),
('Flexão de Braços', 'Peito', 'Peso Corporal', 'Apoie as mãos no solo na largura dos ombros e desça o corpo mantendo o alinhamento corporal.'),

-- COSTAS (Back)
('Puxada Alta na Polia (Lat Pulldown)', 'Costas', 'Polia', 'Puxe a barra em direção ao peito, aproximando as escápulas e ativando o dorsal.'),
('Remada Curvada com Barra', 'Costas', 'Barra', 'Inclinado para frente, puxe a barra em direção ao abdômen mantendo a coluna alinhada.'),
('Remada Baixa Sentado na Polia', 'Costas', 'Polia', 'Sentado com a coluna reta, puxe o triângulo em direção à cintura.'),
('Barra Fixa (Pull Up)', 'Costas', 'Peso Corporal', 'Segure na barra com pegada pronada e eleve o corpo até o queixo ultrapassar a barra.'),
('Levantamento Terra', 'Costas', 'Barra', 'Tire a barra do chão estendendo quadril e joelhos simultaneamente com postura ereta.'),

-- PERNAS (Legs)
('Agachamento Livre com Barra', 'Pernas', 'Barra', 'Com a barra nos ombros, flexione joelhos e quadril descendo como se fosse sentar em uma cadeira.'),
('Leg Press 45', 'Pernas', 'Máquina', 'Empurre a plataforma com os pés afastados na largura dos ombros de forma controlada.'),
('Cadeira Extensora', 'Pernas', 'Máquina', 'Sentado, estenda completamente os joelhos contraindo o quadríceps.'),
('Mesa Flexora', 'Pernas', 'Máquina', 'Deitado de bruços, flexione os joelhos trazendo o rolo em direção aos glúteos.'),
('Afundo com Halteres', 'Pernas', 'Halteres', 'Dê um passo à frente e desça o joelho de trás até quase tocar o solo.'),
('Elevação de Gêmeos em Pé', 'Pernas', 'Máquina', 'Foque na extensão plantar (ponta dos pés) para contração das panturrilhas.'),

-- OMBROS (Shoulders)
('Desenvolvimento com Halteres', 'Ombros', 'Halteres', 'Sentado com coluna apoiada, empurre os halteres para cima acima da cabeça.'),
('Elevação Lateral com Halteres', 'Ombros', 'Halteres', 'Eleve os braços lateralmente até a altura dos ombros focando no deltoide lateral.'),
('Elevação Frontal com Halteres', 'Ombros', 'Halteres', 'Eleve os halteres à frente do corpo alternadamente até a altura dos olhos.'),
('Crucifixo Invertido com Halteres', 'Ombros', 'Halteres', 'Inclinado para frente, abra os braços lateralmente trabalhando o deltoide posterior.'),

-- BRAÇOS (Arms)
('Rosca Direta com Barra W', 'Braços', 'Barra', 'Flexione os cotovelos trazendo a barra em direção ao peito sem mover os ombros.'),
('Rosca Alternada com Halteres', 'Braços', 'Halteres', 'Gire os punhos enquanto flexiona os braços de forma alternada com halteres.'),
('Rosca Martelo com Halteres', 'Braços', 'Halteres', 'Flexione os cotovelos mantendo a pegada neutra (palmas viradas uma para a outra).'),
('Tríceps Corda na Polia', 'Braços', 'Polia', 'Empurre a corda para baixo estendendo os cotovelos totalmente.'),
('Tríceps Testa com Barra W', 'Braços', 'Barra', 'Deitado, flexione os cotovelos levando a barra em direção à testa e empurre de volta.'),
('Mergulho em Bancos', 'Braços', 'Peso Corporal', 'Apoie as mãos em um banco atrás do corpo e desça flexionando os cotovelos.'),

-- ABDÔMEN (Core)
('Abdominal Supra (Crunch)', 'Core', 'Peso Corporal', 'Deitado, eleve levemente as escápulas do solo contraindo o abdômen.'),
('Abdominal Infra (Elevação de Pernas)', 'Core', 'Peso Corporal', 'Deitado, eleve as pernas estendidas até formar 90 graus com o quadril.'),
('Prancha Abdominal Isométrica', 'Core', 'Peso Corporal', 'Mantenha o corpo alinhado apoiado nos antebraços e pontas dos pés.'),
('Abdominal Bicicleta', 'Core', 'Peso Corporal', 'Traga o cotovelo oposto ao joelho alternadamente em um movimento de pedalada.');

-- Inserindo Conquistas Padrão (Achievements)
INSERT INTO public.achievements (title, description, badge_icon, xp_reward, requirement_type, requirement_value) VALUES
('Primeira de Muitas', 'Finalizou a primeira sessão de treino no GymTrack Pro.', 'trophy', 100, 'workout_count', 1),
('Ritmo Firme', 'Finalizou 5 sessões de treino.', 'award', 250, 'workout_count', 5),
('Guerreiro da Consistência', 'Finalizou 20 sessões de treino.', 'shield', 500, 'workout_count', 20),
('Foco Total', 'Alcançou um streak de 3 dias de atividade seguidos.', 'fire', 200, 'streak_days', 3),
('Hábito de Ferro', 'Alcançou um streak de 7 dias de atividade seguidos.', 'flash', 400, 'streak_days', 7),
('Quebrando Recordes', 'Registrou seu primeiro recorde pessoal (PR) de carga.', 'star', 150, 'pr_count', 1),
('Lenda das Cargas', 'Registrou 10 recordes pessoais de carga cumulativos.', 'crown', 500, 'pr_count', 10);
