import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { promptApi } from './api';

const PART = 2.25 * 1024 * 1024;
export const MAX_WREN_FILE = 60 * 1024 * 1024;

async function blobFromUri(uri: string) {
  const res = await fetch(uri);
  return res.blob();
}

async function readBase64Chunk(uri: string, start: number, length: number) {
  const blob = await blobFromUri(uri);
  const slice = blob.slice(start, start + length);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(slice);
  });
  return dataUrl.split(',')[1] || '';
}

async function fileSize(uri: string, fallback?: number) {
  if (fallback != null) return fallback;
  if (Platform.OS !== 'web') {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && 'size' in info && info.size) return Number(info.size);
    } catch {
      /* fall through */
    }
  }
  const blob = await blobFromUri(uri);
  return blob.size;
}

/** Upload one file to Wren in chunks, matching the web desk. */
export async function uploadWrenFile(
  employeeId: string,
  file: { uri: string; name: string; mimeType?: string; size?: number },
  onProgress?: (ratio: number) => void,
) {
  const size = await fileSize(file.uri, file.size);
  if (size > MAX_WREN_FILE) throw new Error(`${file.name} is over 60 MB.`);
  const total = Math.max(1, Math.ceil(size / PART));
  const uploadId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const mimeType = file.mimeType || 'application/octet-stream';

  for (let index = 0; index < total; index += 1) {
    const start = index * PART;
    const length = Math.min(PART, size - start);
    const data = await readBase64Chunk(file.uri, start, length);
    const body = await promptApi.post(employeeId, {
      action: 'chunk',
      uploadId,
      index,
      total,
      name: file.name,
      mimeType,
      data,
    });
    onProgress?.((index + 1) / total);
    if (index === total - 1) {
      if (!body.asset) throw new Error(`Could not upload ${file.name}`);
      return body.asset;
    }
  }
  return null;
}

export async function uploadSmallBase64(
  employeeId: string,
  file: { name: string; mimeType: string; data: string },
) {
  const body = await promptApi.post(employeeId, {
    action: 'upload',
    name: file.name,
    mimeType: file.mimeType,
    data: file.data,
  });
  if (!body.asset) throw new Error(`Could not upload ${file.name}`);
  return body.asset;
}
