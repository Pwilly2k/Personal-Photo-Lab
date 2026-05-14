import Constants from 'expo-constants';

const configuredUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
const apiBase = `${configuredUrl}/api`;

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data;
}

export async function fetchPresets() {
  const response = await fetch(`${apiBase}/presets`);
  return parseResponse(response);
}

export async function fetchHistory() {
  const response = await fetch(`${apiBase}/edits`);
  return parseResponse(response);
}

export async function createEdit(payload) {
  const response = await fetch(`${apiBase}/edits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function fetchGooglePhotosStatus() {
  const response = await fetch(`${apiBase}/google-photos/status`);
  return parseResponse(response);
}