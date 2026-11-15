import { Directory, File, Paths } from 'expo-file-system';

export async function persistUpload(uri: string, folder: string, name: string) {
  try {
    const dir = new Directory(Paths.document, 'wren', folder);
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
    const dest = new File(dir, `${Date.now()}-${safe}`);
    const source = new File(uri);
    await source.copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}
