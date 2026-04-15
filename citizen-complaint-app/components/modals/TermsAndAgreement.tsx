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
                <Text style={styles.badgeText}>LGU</Text>
              </View>
              <View>
                <Text style={styles.municipality}>
                  Municipality of Santa Maria
                </Text>
                <Text style={styles.province}>Laguna, Philippines</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleDecline} activeOpacity={0.7}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Terms and Agreement</Text>
            <Text style={styles.subtitle}>
              Effective date: January 1, 2025 · Version 1.0
            </Text>
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
                Please read these terms carefully before using the{' '}
                <Text style={styles.bold}>
                  Santa Maria Laguna Complaint Management System
                </Text>
                . By registering, you agree to be legally bound by the
                following provisions.
              </Text>
            </View>

            <Section title="1. Purpose of the system">
              This platform is operated by the{' '}
              <Text style={styles.bold}>
                Municipality of Santa Maria, Laguna
              </Text>{' '}
              to facilitate the filing, tracking, and resolution of complaints
              from residents and stakeholders. It is intended solely for
              legitimate civic concerns within the jurisdiction of Santa Maria.
            </Section>

            <Section title="2. Eligibility">
              Use of this system is open to residents, business owners, and
              stakeholders within Santa Maria, Laguna. You must be at least 18
              years of age and provide truthful, accurate information during
              registration. The LGU reserves the right to verify your identity.
            </Section>

            <Section title="3. Accuracy of information">
              You agree to submit complaints that are truthful and based on
              factual events. Filing false, malicious, or frivolous complaints
              is prohibited and may be subject to applicable laws of the
              Philippines, including the{' '}
              <Text style={styles.bold}>Revised Penal Code</Text> provisions on
              perjury and grave oral defamation.
            </Section>

            <Section title="4. Data privacy">
              Your personal data is collected and processed in accordance with
              the{' '}
              <Text style={styles.bold}>
                Republic Act No. 10173 (Data Privacy Act of 2012)
              </Text>
              . The Municipality of Santa Maria, Laguna is the data controller and
              commits to:
              {'\n\n'}
              <BulletItem>
                Collecting only data necessary for complaint processing
              </BulletItem>
              <BulletItem>
                Not sharing your personal information with unauthorized third
                parties
              </BulletItem>
              <BulletItem>
                Storing data securely and retaining it only as long as required
                by law
              </BulletItem>
              <BulletItem>
                Allowing you to request access, correction, or deletion of your
                records
              </BulletItem>
            </Section>

            <Section title="5. Complaint handling">
              Complaints submitted through this system will be reviewed by
              authorized LGU personnel. The LGU does not guarantee a specific
              resolution timeline but will endeavor to act on complaints in
              accordance with the{' '}
              <Text style={styles.bold}>Citizen's Charter</Text> and{' '}
              <Text style={styles.bold}>
                Anti-Red Tape Act (RA 11032)
              </Text>
              . Anonymous complaints may be given lower processing priority.
            </Section>

            <Section title="6. Prohibited conduct">
              Users are strictly prohibited from:
              {'\n\n'}
              <BulletItem>
                Submitting fabricated or misleading complaints
              </BulletItem>
              <BulletItem>
                Impersonating another person or public official
              </BulletItem>
              <BulletItem>
                Using the system for political harassment or personal vendetta
              </BulletItem>
              <BulletItem>
                Attempting to access, alter, or disrupt the system
              </BulletItem>
              <BulletItem>
                Uploading obscene, defamatory, or illegal content
              </BulletItem>
            </Section>

            <Section title="7. Account suspension">
              The LGU reserves the right to suspend or permanently revoke
              access to any account found in violation of these terms, without
              prior notice, and to refer the matter to the appropriate
              authorities where warranted.
            </Section>

            <Section title="8. Limitation of liability">
              The Municipality of Santa Maria, Laguna shall not be held liable for any
              indirect or consequential damages arising from your use of this
              system, including but not limited to delays in complaint
              processing caused by force majeure, system downtime, or
              circumstances beyond the LGU's reasonable control.
            </Section>

            <Section title="9. Amendments">
              These terms may be updated from time to time by the LGU.
              Continued use of the system after any amendment constitutes
              acceptance of the revised terms. Significant changes will be
              communicated through the system's notification feature.
            </Section>

            <Section title="10. Governing law">
              These terms are governed by the laws of the{' '}
              <Text style={styles.bold}>Republic of the Philippines</Text>. Any
              dispute arising from the use of this system shall be subject to
              the jurisdiction of the proper courts in the Province of Laguna.
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
                  ? 'You have read all the terms'
                  : 'Scroll to read all terms before accepting'}
              </Text>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={handleDecline}
                style={styles.declineBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
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
                <Text style={styles.acceptBtnText}>I agree to the terms</Text>
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