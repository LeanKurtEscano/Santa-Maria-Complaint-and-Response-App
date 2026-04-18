import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { X, Check, AlertCircle, Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { THEME } from '@/constants/theme';

interface TermsAndAgreementModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TermsAndAgreementModal({
  visible,
  onAccept,
  onDecline,
}: TermsAndAgreementModalProps) {
  const { t } = useTranslation();
  const [hasRead, setHasRead] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const pct =
      (layoutMeasurement.height + contentOffset.y) / contentSize.height;
    if (pct > 0.92 && !hasRead) {
      setHasRead(true);
    }
  };

  const handleDecline = () => {
    setHasRead(false);
    onDecline();
  };

  const handleAccept = () => {
    if (!hasRead) return;
    onAccept();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {t('termsModal.badge')}
                </Text>
              </View>
              <View>
                <Text style={styles.municipality}>
                  {t('termsModal.municipality')}
                </Text>
                <Text style={styles.province}>
                  {t('termsModal.province')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleDecline} activeOpacity={0.7}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* ── Title Block ── */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{t('termsModal.title')}</Text>
            <Text style={styles.subtitle}>{t('termsModal.subtitle')}</Text>
          </View>

          {/* ── Body ── */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.body}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            {/* Intro notice */}
            <View style={styles.introBox}>
              <Info size={14} color="#1a4f2e" style={{ marginTop: 2 }} />
              <Text style={styles.introText}>
                {t('termsModal.intro', {
                  appName: t('termsModal.appName'),
                })}
              </Text>
            </View>

            {/* Section 1 */}
            <Section title={t('termsModal.sections.s1Title')}>
              {t('termsModal.sections.s1Body', {
                lgu: t('termsModal.municipality'),
              })}
            </Section>

            {/* Section 2 */}
            <Section title={t('termsModal.sections.s2Title')}>
              {t('termsModal.sections.s2Body')}
            </Section>

            {/* Section 3 */}
            <Section title={t('termsModal.sections.s3Title')}>
              {t('termsModal.sections.s3Body', {
                law: t('termsModal.sections.s3Law'),
              })}
            </Section>

            {/* Section 4 */}
            <Section title={t('termsModal.sections.s4Title')}>
              {t('termsModal.sections.s4Body', {
                law: t('termsModal.sections.s4Law'),
              })}
              {'\n\n'}
              <BulletItem>{t('termsModal.sections.s4Bullet1')}</BulletItem>
              <BulletItem>{t('termsModal.sections.s4Bullet2')}</BulletItem>
              <BulletItem>{t('termsModal.sections.s4Bullet3')}</BulletItem>
              <BulletItem>{t('termsModal.sections.s4Bullet4')}</BulletItem>
            </Section>

            {/* Section 5 */}
            <Section title={t('termsModal.sections.s5Title')}>
              {t('termsModal.sections.s5Body', {
                charter: t('termsModal.sections.s5Charter'),
                law: t('termsModal.sections.s5Law'),
              })}
            </Section>

            {/* Section 6 */}
            <Section title={t('termsModal.sections.s6Title')}>
              {t('termsModal.sections.s6Body')}
              {'\n\n'}
              <BulletItem>{t('termsModal.sections.s6Bullet1')}</BulletItem>
              <BulletItem>{t('termsModal.sections.s6Bullet2')}</BulletItem>
              <BulletItem>{t('termsModal.sections.s6Bullet3')}</BulletItem>
              <BulletItem>{t('termsModal.sections.s6Bullet4')}</BulletItem>
              <BulletItem>{t('termsModal.sections.s6Bullet5')}</BulletItem>
            </Section>

            {/* Section 7 */}
            <Section title={t('termsModal.sections.s7Title')}>
              {t('termsModal.sections.s7Body')}
            </Section>

            {/* Section 8 */}
            <Section title={t('termsModal.sections.s8Title')}>
              {t('termsModal.sections.s8Body')}
            </Section>

            {/* Section 9 */}
            <Section title={t('termsModal.sections.s9Title')}>
              {t('termsModal.sections.s9Body')}
            </Section>

            {/* Section 10 */}
            <Section title={t('termsModal.sections.s10Title')}>
              {t('termsModal.sections.s10Body', {
                country: t('termsModal.sections.s10Country'),
              })}
            </Section>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.scrollNotice}>
              {hasRead ? (
                <Check size={13} color="#1a4f2e" />
              ) : (
                <AlertCircle size={13} color="#9CA3AF" />
              )}
              <Text
                style={[
                  styles.scrollNoticeText,
                  hasRead && { color: '#1a4f2e' },
                ]}
              >
                {hasRead
                  ? t('termsModal.footer.hasRead')
                  : t('termsModal.footer.notRead')}
              </Text>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={handleDecline}
                style={styles.declineBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.declineBtnText}>
                  {t('termsModal.footer.decline')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAccept}
                disabled={!hasRead}
                activeOpacity={0.85}
                style={[
                  styles.acceptBtn,
                  !hasRead && styles.acceptBtnDisabled,
                ]}
              >
                <Check size={15} color="#FFFFFF" />
                <Text style={styles.acceptBtnText}>
                  {t('termsModal.footer.accept')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.bulletItem}>
      {'  \u2022  '}
      {children}
      {'\n'}
    </Text>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a4f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  municipality: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  province: {
    fontSize: 11,
    color: '#6B7280',
  },

  // Title block
  titleBlock: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 0,
  },
  introBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f0f7f2',
    borderLeftWidth: 3,
    borderLeftColor: '#1a4f2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  introText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '600',
    color: '#111827',
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#6B7280',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  bulletItem: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },

  // Footer
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  scrollNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  scrollNoticeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a4f2e',
  },
  acceptBtnDisabled: {
    opacity: 0.4,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});