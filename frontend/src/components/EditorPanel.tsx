import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PROVIDERS } from '../constants/editor';

export function EditorPanel({
  tools,
  activeTool,
  activePreset,
  provider,
  intensity,
  prompt,
  disabled,
  onToolChange,
  onPresetChange,
  onProviderChange,
  onIntensityChange,
  onPromptChange,
  onGenerate,
}) {
  const [trackWidth, setTrackWidth] = useState(260);
  const selectedTool = tools.find((tool) => tool.id === activeTool) || tools[0];

  const hitSlider = (locationX, width) => {
    const next = Math.max(0, Math.min(100, Math.round((locationX / Math.max(width, 1)) * 100)));
    if (next === 0 || next === 100) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    }
    onIntensityChange(next);
  };

  return (
    <View style={styles.panel}>
      <View style={styles.handle} />
      <View style={styles.providerRow}>
        {PROVIDERS.map((item) => {
          const selected = item.id === provider;
          return (
            <Pressable
              key={item.id}
              testID={`provider-${item.id}`}
              onPress={() => onProviderChange(item.id)}
              style={[styles.providerPill, selected && styles.providerPillActive]}
            >
              <Text style={[styles.providerLabel, selected && styles.activeText]}>{item.label}</Text>
              <Text style={[styles.providerSub, selected && styles.providerSubActive]}>{item.sublabel}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
        {tools.map((tool) => {
          const active = tool.id === activeTool;
          return (
            <Pressable
              key={tool.id}
              testID={`tool-${tool.id}`}
              onPress={() => onToolChange(tool.id)}
              style={[styles.toolButton, active && styles.toolButtonActive]}
            >
              <Ionicons name={tool.icon} size={18} color={active ? '#050505' : '#E2C391'} />
              <Text style={[styles.toolText, active && styles.activeText]}>{tool.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
        {selectedTool.presets.map((preset) => {
          const active = preset.id === activePreset.id;
          return (
            <Pressable
              key={preset.id}
              testID={`preset-${preset.id}`}
              onPress={() => onPresetChange(preset)}
              style={[styles.presetChip, active && styles.presetChipActive]}
            >
              <Text style={[styles.presetText, active && styles.activeText]}>{preset.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sliderHeader}>
        <Text style={styles.smallLabel}>Intensity</Text>
        <Text style={styles.intensityValue}>{intensity}%</Text>
      </View>
      <Pressable
        testID="intensity-slider"
        style={styles.sliderTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onPress={(event) => hitSlider(event.nativeEvent.locationX, trackWidth)}
      >
        <View style={[styles.sliderFill, { width: `${intensity}%` }]} />
        <View style={[styles.sliderThumb, { left: `${Math.max(2, Math.min(94, intensity))}%` }]} />
      </Pressable>

      <View style={styles.promptRow}>
        <TextInput
          testID="custom-prompt-input"
          value={prompt}
          onChangeText={onPromptChange}
          placeholder="Add exact edit notes…"
          placeholderTextColor="#666"
          style={styles.promptInput}
          multiline
          returnKeyType="done"
        />
        <Pressable
          testID="generate-edit-button"
          disabled={disabled}
          onPress={onGenerate}
          style={({ pressed }) => [styles.generateButton, (disabled || pressed) && styles.generateButtonPressed]}
        >
          <Ionicons name="sparkles" size={20} color="#050505" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(20,20,20,0.96)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 10,
    alignSelf: 'center',
    backgroundColor: '#3A3A3A',
    marginBottom: 12,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  providerPill: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  providerPillActive: {
    backgroundColor: '#E2C391',
    borderColor: '#E2C391',
  },
  providerLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  providerSub: {
    color: '#8C8C8C',
    fontSize: 11,
    marginTop: 2,
  },
  providerSubActive: {
    color: 'rgba(5,5,5,0.62)',
  },
  toolRow: {
    gap: 10,
    paddingBottom: 12,
  },
  toolButton: {
    minHeight: 46,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226,195,145,0.28)',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  toolButtonActive: {
    backgroundColor: '#E2C391',
    borderColor: '#E2C391',
  },
  toolText: {
    color: '#E2C391',
    fontSize: 13,
    fontWeight: '800',
  },
  activeText: {
    color: '#050505',
  },
  presetRow: {
    gap: 9,
    paddingBottom: 14,
  },
  presetChip: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    backgroundColor: '#262626',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#E2C391',
  },
  presetText: {
    color: '#D6D6D6',
    fontSize: 13,
    fontWeight: '700',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  smallLabel: {
    color: '#A3A3A3',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  intensityValue: {
    color: '#E2C391',
    fontSize: 12,
    fontWeight: '900',
  },
  sliderTrack: {
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(226,195,145,0.72)',
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF7E8',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  promptInput: {
    flex: 1,
    minHeight: 52,
    maxHeight: 88,
    borderRadius: 19,
    backgroundColor: '#0C0C0C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    color: '#FFFFFF',
    paddingHorizontal: 15,
    paddingTop: 13,
    fontSize: 15,
  },
  generateButton: {
    width: 54,
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: '#E2C391',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonPressed: {
    opacity: 0.62,
    transform: [{ scale: 0.96 }],
  },
});