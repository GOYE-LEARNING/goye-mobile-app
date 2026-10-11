import { useState } from 'react';
import { ActivityIndicator, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/hooks/useAlert';

interface Props {
  certificates: any[];
}

// The backend stores the rendered certificate as an image URL in certificateImageURL
// (the older names are kept so an older payload still works).
const imageOf = (cert: any): string | undefined =>
  cert?.certificateImageURL || cert?.url || cert?.certificate_url || undefined;

const titleOf = (cert: any, fallback: string): string =>
  cert?.course?.course_title || cert?.courseTitle || cert?.course_title || fallback;

const dateOf = (cert: any): string =>
  new Date(cert?.issuedAt || cert?.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export default function CertificateGallery({ certificates }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { alert, AlertComponent } = useAlert();
  const [selected, setSelected] = useState<any | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [sharing, setSharing] = useState(false);

  const fallbackTitle = t('home.growth.defaultCertificateTitle');
  const selectedUrl = selected ? imageOf(selected) : undefined;

  const open = (cert: any) => {
    setImageFailed(false);
    setSelected(cert);
  };

  const openInBrowser = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      alert(t('common.error'), t('home.growth.couldNotOpenCertificate'));
    }
  };

  // Downloads the image to the app cache, then hands it to the system share sheet
  // (which also offers "Save image", so this doubles as download).
  const share = async () => {
    if (!selectedUrl || !selected) return;
    setSharing(true);
    try {
      const ext = (selectedUrl.split('?')[0].match(/\.(png|jpe?g|webp)$/i)?.[1] ?? 'png').toLowerCase();
      const target = new File(Paths.cache, `goye-certificate-${selected.id ?? 'download'}.${ext}`);
      if (target.exists) target.delete();
      const file = await File.downloadFileAsync(selectedUrl, target);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg',
          dialogTitle: titleOf(selected, fallbackTitle),
        });
      } else {
        await openInBrowser(selectedUrl);
      }
    } catch (err) {
      console.error('[Certificate] share failed:', err);
      alert(t('common.error'), t('home.growth.couldNotShareCertificate', { defaultValue: 'Could not share the certificate. Please try again.' }));
    } finally {
      setSharing(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <View>
      {certificates.map((cert: any) => {
        const url = imageOf(cert);
        return (
          <TouchableOpacity
            key={cert.id || cert._id}
            style={s.card}
            activeOpacity={0.85}
            onPress={() => open(cert)}
            accessibilityRole="button"
            accessibilityLabel={titleOf(cert, fallbackTitle)}
          >
            <View style={s.thumbWrap}>
              {url ? (
                <Image source={{ uri: url }} style={s.thumb} contentFit="contain" transition={200} />
              ) : (
                <View style={s.noImage}>
                  <Ionicons name="ribbon" size={36} color={colors.brand} />
                </View>
              )}
            </View>
            <View style={s.cardBody}>
              <View style={{ flex: 1 }}>
                <Text style={s.title} numberOfLines={2}>
                  {titleOf(cert, fallbackTitle)}
                </Text>
                <Text style={s.date}>
                  {t('home.growth.issuedLabel')}: {dateOf(cert)}
                </Text>
              </View>
              <Ionicons name="expand-outline" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        );
      })}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={s.viewer}>
          <View style={s.viewerBar}>
            <Text style={s.viewerTitle} numberOfLines={1}>
              {selected ? titleOf(selected, fallbackTitle) : ''}
            </Text>
            <TouchableOpacity
              onPress={() => setSelected(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={t('home.growth.close')}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={s.viewerBody}>
            {selectedUrl && !imageFailed ? (
              <Image
                source={{ uri: selectedUrl }}
                style={s.viewerImage}
                contentFit="contain"
                transition={200}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <View style={s.viewerError}>
                <Ionicons name="image-outline" size={44} color="#bbb" />
                <Text style={s.viewerErrorText}>
                  {t('home.growth.certificateImageUnavailable', { defaultValue: "The certificate image couldn't be loaded." })}
                </Text>
              </View>
            )}
          </View>

          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionButton, s.primaryAction, (!selectedUrl || sharing) && { opacity: 0.6 }]}
              onPress={share}
              disabled={!selectedUrl || sharing}
              accessibilityRole="button"
            >
              {sharing ? (
                <ActivityIndicator color="#2A1500" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={18} color="#2A1500" />
                  <Text style={s.primaryText}>{t('home.growth.share', { defaultValue: 'Share / Save' })}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionButton, s.secondaryAction, !selectedUrl && { opacity: 0.6 }]}
              onPress={() => selectedUrl && openInBrowser(selectedUrl)}
              disabled={!selectedUrl}
              accessibilityRole="button"
            >
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={s.secondaryText}>{t('home.growth.openInBrowser', { defaultValue: 'Open' })}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        {AlertComponent}
      </Modal>
    </View>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    thumbWrap: { width: '100%', aspectRatio: 4 / 3, backgroundColor: c.backgroundMuted ?? '#f3f3f3' },
    thumb: { width: '100%', height: '100%' },
    noImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    title: { fontSize: 15, fontWeight: '700', color: c.text },
    date: { fontSize: 12, color: c.textSecondary, marginTop: 4 },

    viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
    viewerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    viewerTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
    viewerBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 8 },
    viewerImage: { width: '100%', aspectRatio: 4 / 3 },
    viewerError: { alignItems: 'center', gap: 10, paddingHorizontal: 30 },
    viewerErrorText: { color: '#ccc', textAlign: 'center', fontSize: 14 },
    actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
    actionButton: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryAction: { backgroundColor: '#FFA500' },
    primaryText: { color: '#2A1500', fontWeight: '700', fontSize: 14 },
    secondaryAction: { backgroundColor: 'rgba(255,255,255,0.14)' },
    secondaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  });
}
