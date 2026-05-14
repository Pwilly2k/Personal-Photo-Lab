import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export function PhotoCanvas({ sourceImage, resultImage, loading, comparing, setComparing }) {
  const [fade] = useState(() => new Animated.Value(0));
  const visibleImage = comparing ? sourceImage : resultImage || sourceImage;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [fade, visibleImage]);

  return (
    <View style={styles.canvasWrap}>
      <LinearGradient colors={['#191510', '#050505']} style={styles.canvas}>
        {visibleImage ? (
          <Animated.Image source={{ uri: visibleImage }} style={[styles.photo, { opacity: fade }]} resizeMode="contain" />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.orb}>
              <Ionicons name="sparkles-outline" size={34} color="#E2C391" />
            </View>
            <Text style={styles.emptyTitle}>Personal Photo Lab</Text>
            <Text style={styles.emptyText}>Import a portrait, tune the edit, then generate a new look.</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#E2C391" />
            <Text style={styles.loadingText}>Rendering edit…</Text>
          </View>
        ) : null}

        {sourceImage && resultImage ? (
          <Pressable
            testID="compare-before-button"
            onPressIn={() => setComparing(true)}
            onPressOut={() => setComparing(false)}
            style={styles.compareButton}
          >
            <Ionicons name="albums-outline" size={16} color="#050505" />
            <Text style={styles.compareText}>Hold before</Text>
          </Pressable>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasWrap: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  canvas: {
    flex: 1,
    minHeight: 330,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 34,
  },
  orb: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(226,195,145,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(226,195,145,0.32)',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  emptyText: {
    color: '#A3A3A3',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#E2C391',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  compareButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: '#E2C391',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compareText: {
    color: '#050505',
    fontSize: 13,
    fontWeight: '800',
  },
});