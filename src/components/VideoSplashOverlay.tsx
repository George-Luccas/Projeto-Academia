import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, StyleProp, ViewStyle, TextStyle, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';

// URL de vídeo de musculação de alta fidelidade (Bend Health & Performance Gym)
const DEFAULT_VIDEO_URL = 'https://player.vimeo.com/external/661046938.hd.mp4?s=04f94387e5b8f45f064312f406b0f3f9e3dc0d63&profile_id=174';

export default function VideoSplashOverlay() {
  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const player = useVideoPlayer(DEFAULT_VIDEO_URL, (playerInstance) => {
    playerInstance.muted = true;
    playerInstance.loop = false;
    playerInstance.play();
  });

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      handleDismiss();
    });

    // Failsafe: esconde a tela após 4 segundos sob qualquer condição de carregamento
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [player]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setIsVisible(false);
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container as any, { opacity: fadeAnim }]}>
      <VideoView
        player={player}
        style={styles.videoPlayer as any}
        contentFit="cover"
        nativeControls={false}
      />
      {/* Botão de Pular */}
      <TouchableOpacity style={styles.skipButton as StyleProp<ViewStyle>} onPress={handleDismiss}>
        <ThemedText style={styles.skipText as StyleProp<TextStyle>}>Pular</ThemedText>
        <Ionicons name="play-forward" size={14} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Overlay com o Nome do Aplicativo */}
      <View style={styles.titleContainer as StyleProp<ViewStyle>}>
        <ThemedText style={styles.titleText as StyleProp<TextStyle>}>HULK</ThemedText>
        <ThemedText style={styles.subtitleText as StyleProp<TextStyle>}>ACADEMIA</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#09090B',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    width: '100%',
  },
  titleText: {
    fontSize: 48,
    fontWeight: '900', // Padrão válido no React Native
    color: '#D4FF13', // Verde limão neon
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  subtitleText: {
    fontSize: 18,
    fontWeight: 'bold', // Padrão válido no React Native
    color: '#FFFFFF',
    letterSpacing: 8,
    marginTop: -4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
