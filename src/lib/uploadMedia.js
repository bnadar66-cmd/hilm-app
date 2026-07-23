import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { supabase } from './supabase';

const BUCKET = 'lecture-media';

// يفتح منتقي الملفات، يرفع الملف المختار لـ Supabase Storage، ويرجّع رابطه العام.
// يرجّع null إذا المستخدم ألغى الاختيار.
export async function pickAndUploadMedia(folder, options) {
  const result = await DocumentPicker.getDocumentAsync({
    type: options?.type ?? '*/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const file = new File(asset.uri);
  const bytes = await file.bytes();

  const safeName = asset.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: asset.mimeType || 'application/octet-stream',
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, name: asset.name, mimeType: asset.mimeType };
}
