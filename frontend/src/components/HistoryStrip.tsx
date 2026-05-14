import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export function HistoryStrip({ items, onSelect }) {
  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Ionicons name="time-outline" size={16} color="#E2C391" />
        <Text style={styles.title}>Recent edits</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <Pressable key={item.id} testID={`history-${item.id}`} onPress={() => onSelect(item)} style={styles.card}>
            <Image source={{ uri: item.result_image_base64 }} style={styles.thumb} />
            <Text numberOfLines={1} style={styles.label}>{item.preset_label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  title: {
    color: '#DADADA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    gap: 10,
    paddingBottom: 2,
  },
  card: {
    width: 74,
  },
  thumb: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    color: '#A3A3A3',
    fontSize: 10,
    marginTop: 5,
  },
});