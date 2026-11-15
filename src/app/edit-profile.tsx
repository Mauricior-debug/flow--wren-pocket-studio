import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../components/chrome';
import { Button, Field } from '../components/ui';
import { useStore } from '../data/store';
import { images } from '../theme/images';
import { colors, fonts } from '../theme/tokens';

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useStore();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUri);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const source = avatarUri ? { uri: avatarUri } : user?.avatar === 'alex' ? images.avatarAlex : null;

  const pick = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(camera ? 'Camera access is off.' : 'Photo access is off.');
      return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
      <StudioHeader back />
      <Text style={styles.title}>Edit Profile</Text>
      <Text style={styles.sub}>Update your profile information.</Text>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          {source ? <Image source={source} style={styles.avatarImage} contentFit="cover" /> : <Text style={styles.initial}>{(name || 'W').slice(0, 1)}</Text>}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Change photo" onPress={() => pick(false)} style={styles.camera}>
          <Ionicons name="camera" size={16} color={colors.white} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => pick(true)} style={styles.cameraLink}>
        <Text style={styles.cameraText}>Take a photo</Text>
      </Pressable>
      <Field label="Full name" value={name} onChangeText={setName} />
      <View style={{ height: 12 }} />
      <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error} />
      <View style={styles.actions}>
        <Button label="Cancel" kind="secondary" flex={1} onPress={() => router.back()} />
        <Button
          label="Save Changes"
          flex={1.3}
          loading={loading}
          onPress={async () => {
            setLoading(true);
            const result = await updateProfile({ name, email, avatarUri });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.back();
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, marginTop: 6, marginBottom: 16 },
  avatarWrap: { alignSelf: 'center', marginBottom: 8 },
  avatar: { width: 108, height: 108, borderRadius: 54, overflow: 'hidden', backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 108, height: 108 },
  initial: { color: colors.lime, fontFamily: fonts.bold, fontSize: 36 },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#243044', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  cameraLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginBottom: 12 },
  cameraText: { color: colors.link, fontFamily: fonts.semibold },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
