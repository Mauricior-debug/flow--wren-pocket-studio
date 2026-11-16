import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'wren.session.token';
const BASE_KEY = 'wren.api.base';
export const DEFAULT_API_BASE = 'https://flowtrackai-crm.vercel.app';

async function secureGet(key: string) {
  if (Platform.OS === 'web') {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function secureSet(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDelete(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

export async function getToken() {
  return secureGet(TOKEN_KEY);
}

export async function setToken(token: string) {
  await secureSet(TOKEN_KEY, token);
}

export async function clearToken() {
  await secureDelete(TOKEN_KEY);
}

export async function getApiBase() {
  const raw = await AsyncStorage.getItem(BASE_KEY);
  const value = String(raw || DEFAULT_API_BASE).trim().replace(/\/$/, '');
  return value || DEFAULT_API_BASE;
}

export async function setApiBase(base: string) {
  const value = String(base || DEFAULT_API_BASE).trim().replace(/\/$/, '') || DEFAULT_API_BASE;
  await AsyncStorage.setItem(BASE_KEY, value);
  return value;
}
