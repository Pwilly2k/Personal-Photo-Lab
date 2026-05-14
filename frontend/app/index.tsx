import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createEdit, fetchGooglePhotosStatus, fetchHistory, fetchPresets } from '../src/api/photoEditor';
import { EditorPanel } from '../src/components/EditorPanel';
import { HistoryStrip } from '../src/components/HistoryStrip';
import { PhotoCanvas } from '../src/components/PhotoCanvas';
import { FALLBACK_TOOLS } from '../src/constants/editor';

export default function Index() {
  const [tools, setTools] = useState(FALLBACK_TOOLS);
  const [activeTool, setActiveTool] = useState('body');
  const [activePreset, setActivePreset] = useState(FALLBACK_TOOLS[0].presets[0]);
  const [provider, setProvider] = useState('gemini');
  const [sourceImage, setSourceImage] = useState();
  const [resultImage, setResultImage] = useState();
  const [history, setHistory] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [intensity, setIntensity] = useState(55);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [googleStatus, setGoogleStatus] = useState('Checking Google Photos…');
  const [notice, setNotice] = useState();

  const selectedTool = useMemo(() => tools.find((tool) => tool.id === activeTool) || tools[0], [activeTool, tools]);

  useEffect(() => {
    fetchPresets().then((remoteTools) => {
      setTools(remoteTools);
      setActiveTool(remoteTools[0].id);
      setActivePreset(remoteTools[0].presets[0]);
    }).catch(() => null);

    fetchHistory().then(setHistory).catch(() => null);
    fetchGooglePhotosStatus()
      .then((status) => setGoogleStatus(status.message))
      .catch(() => setGoogleStatus('Google Photos setup status unavailable.'));
  }, []);

  const buildDataUri = (asset) => {
    const mime = asset.mimeType || 'image/jpeg';
    return asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
  };

  const showNotice = (title, message) => {
    setNotice({ title, message });
    setTimeout(() => setNotice(undefined), 4200);
  };

  const selectTool = (toolId) => {
    const next = tools.find((tool) => tool.id === toolId);
    if (!next) return;
    Haptics.selectionAsync().catch(() => null);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTool(toolId);
    setActivePreset(next.presets[0]);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showNotice('Photo access needed', 'Allow photo library access to select images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.86,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSourceImage(buildDataUri(result.assets[0]));
      setResultImage(undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    }
  };

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showNotice('Camera access needed', 'Allow camera access to capture photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.86, base64: true });
    if (!result.canceled && result.assets[0]) {
      setSourceImage(buildDataUri(result.assets[0]));
      setResultImage(undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    }
  };

  const openGooglePhotos = () => {
    showNotice('Google Photos setup required', googleStatus);
  };

  const generateEdit = async () => {
    if (!sourceImage) {
      showNotice('Import a photo first', 'Choose a device photo or capture one before generating.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const result = await createEdit({
        source_image_base64: sourceImage,
        provider,
        category: activeTool,
        preset_id: activePreset.id,
        preset_label: activePreset.label,
        prompt: prompt || activePreset.prompt,
        intensity,
      });
      setResultImage(result.result_image_base64);
      setSourceImage(result.source_image_base64 || sourceImage);
      setHistory((items) => [result, ...items.filter((item) => item.id !== result.id)].slice(0, 20));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    } catch (error) {
      showNotice('Edit failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectHistory = (item) => {
    setResultImage(item.result_image_base64);
    setSourceImage(item.source_image_base64 || item.result_image_base64);
    setProvider(item.provider === 'openai' ? 'openai' : 'gemini');
    setActiveTool(item.category);
    Haptics.selectionAsync().catch(() => null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Private AI Studio</Text>
              <Text style={styles.title}>Personal Photo Lab</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="diamond-outline" size={16} color="#E2C391" />
            </View>
          </View>

          {notice ? (
            <Pressable testID="visible-feedback-banner" onPress={() => setNotice(undefined)} style={styles.notice}>
              <Ionicons name="information-circle-outline" size={20} color="#E2C391" />
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeText}>{notice.message}</Text>
              </View>
              <Ionicons name="close" size={18} color="#A3A3A3" />
            </Pressable>
          ) : null}

          <PhotoCanvas
            sourceImage={sourceImage}
            resultImage={resultImage}
            loading={loading}
            comparing={comparing}
            setComparing={setComparing}
          />

          <View style={styles.importWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.importRow}>
              <Pressable testID="pick-device-photo" onPress={pickFromLibrary} style={styles.importButton}>
                <Ionicons name="images-outline" size={18} color="#050505" />
                <Text style={styles.importPrimaryText}>Device photo</Text>
              </Pressable>
              <Pressable testID="capture-photo" onPress={capturePhoto} style={styles.secondaryButton}>
                <Ionicons name="camera-outline" size={18} color="#E2C391" />
                <Text style={styles.secondaryText}>Camera</Text>
              </Pressable>
              <Pressable testID="google-photos-button" onPress={openGooglePhotos} style={styles.secondaryButton}>
                <Ionicons name="logo-google" size={18} color="#E2C391" />
                <Text style={styles.secondaryText}>Google Photos</Text>
              </Pressable>
            </ScrollView>
          </View>

          <HistoryStrip items={history} onSelect={selectHistory} />

          <EditorPanel
            tools={tools}
            activeTool={selectedTool.id}
            activePreset={activePreset}
            provider={provider}
            intensity={intensity}
            prompt={prompt}
            disabled={loading}
            onToolChange={selectTool}
            onPresetChange={setActivePreset}
            onProviderChange={setProvider}
            onIntensityChange={setIntensity}
            onPromptChange={setPrompt}
            onGenerate={generateEdit}
          />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    color: '#E2C391',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 2,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(226,195,145,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 2,
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(226,195,145,0.34)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  noticeText: {
    color: '#A3A3A3',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  importWrap: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  importRow: {
    gap: 10,
  },
  importButton: {
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: '#E2C391',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  importPrimaryText: {
    color: '#050505',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(226,195,145,0.32)',
    backgroundColor: '#141414',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryText: {
    color: '#E2C391',
    fontSize: 14,
    fontWeight: '800',
  },
});
