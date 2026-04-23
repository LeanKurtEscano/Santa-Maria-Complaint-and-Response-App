import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  FileText,
  Paperclip,
  User,
  MapPin,
  Calendar,
  Building2,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Check,
  ScrollText,
} from 'lucide-react-native';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { Attachment } from '@/hooks/general/useAttachment';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ComplaintLetterPreviewProps {
  barangayName: string;
  title: string;
  message: string;
  attachments?: Attachment[];
  onConfirmSubmit: () => void;
  onBack: () => void;
  toastVisible?: boolean;
  setToastVisible?: (visible: boolean) => void;
  toastMessage?: string;
  toastType?: 'success' | 'error' | 'info';
  isSubmitting?: boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getRefNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BRY-${year}-${rand}`;
}

const REF_NUMBER = getRefNumber();

// ── Small reusable row ──────────────────────────────────────────────────────
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB', // Light border for white card
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: '#F3F4F6', // Light gray background for icon
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: '#6B7280', // Darker gray for labels
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: '#1F2937', // Dark text for readability
            lineHeight: 19,
            fontWeight: '500',
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// ── Card wrapper (White background) ────────────────────────────────────────────
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF', // White background
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E5E7EB', // Subtle light border
          padding: 16,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── Card header label ───────────────────────────────────────────────────────
function CardLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
      }}
    >
      {icon}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: '#4B5563', // Darker gray for labels
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ComplaintLetterPreview({
  barangayName,
  title,
  message,
  attachments = [],
  onConfirmSubmit,
  onBack,
  isSubmitting = false,
}: ComplaintLetterPreviewProps) {
  const { t } = useTranslation();
  const { userData } = useCurrentUser();
  const today = new Date();

  const fullName =
    userData?.first_name && userData?.last_name
      ? `${userData.first_name} ${userData.last_name}`
      : 'Complainant';
  const fullAddress = userData?.full_address || userData?.barangay || 'N/A';

  // ── Terms read state ──────────────────────────────────────────────────────
  const [termsRead, setTermsRead] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const termsScrollRef = useRef<ScrollView>(null);

  const handleTermsScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const pct =
      (layoutMeasurement.height + contentOffset.y) / contentSize.height;
    if (pct > 0.92 && !termsRead) {
      setTermsRead(true);
    }
  };

  const canSubmit = termsAccepted && !isSubmitting;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.primary }}>

      {/* ── Top Bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          disabled={isSubmitting}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.18)',
          }}
        >
          <ArrowLeft size={14} color="#FFFFFF" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>
            Back
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <FileText size={14} color="rgba(255,255,255,0.7)" />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 0.3,
            }}
          >
            Complaint Preview
          </Text>
        </View>

        <View style={{ width: 72 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Ref / Date strip ── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
            paddingHorizontal: 2,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: 0.5,
            }}
          >
            Ref. No.:{' '}
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
              {REF_NUMBER}
            </Text>
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: 0.5,
            }}
          >
            {formatDate(today)}
          </Text>
        </View>

        {/* ── Card 1: Complainant Info ── */}
        <Card>
          <CardLabel
            icon={<User size={12} color="#6B7280" />}
            label="Complainant Information"
          />
          <DetailRow
            icon={<User size={15} color="#4B5563" />}
            label="Full Name"
            value={fullName}
          />
          <DetailRow
            icon={<MapPin size={15} color="#4B5563" />}
            label="Address"
            value={fullAddress}
          />
          <DetailRow
            icon={<Building2 size={15} color="#4B5563" />}
            label="Filed To"
            value={`Barangay ${barangayName}`}
          />
          <DetailRow
            icon={<Calendar size={15} color="#4B5563" />}
            label="Date Filed"
            value={formatDate(today)}
          />
        </Card>

        {/* ── Card 2: Complaint Details ── */}
        <Card>
          <CardLabel
            icon={<MessageSquare size={12} color="#6B7280" />}
            label="Complaint Details"
          />

          {/* Subject */}
          <View
            style={{
              marginBottom: 12,
              paddingBottom: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: '#E5E7EB',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: '#6B7280',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Subject
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#1F2937',
                lineHeight: 20,
              }}
            >
              {title}
            </Text>
          </View>

          {/* Message */}
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: '#6B7280',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#4B5563',
                lineHeight: 21,
              }}
            >
              {message}
            </Text>
          </View>
        </Card>

        {/* ── Card 3: Attachments (conditional) ── */}
        {attachments.length > 0 && (
          <Card>
            <CardLabel
              icon={<Paperclip size={12} color="#6B7280" />}
              label={`Attachments (${attachments.length})`}
            />
            {attachments.map((att, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 9,
                  borderBottomWidth: i < attachments.length - 1 ? 0.5 : 0,
                  borderBottomColor: '#E5E7EB',
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Paperclip size={14} color="#4B5563" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#1F2937',
                      fontWeight: '500',
                    }}
                    numberOfLines={1}
                  >
                    {att.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: '#6B7280',
                      marginTop: 1,
                    }}
                  >
                    {att.type.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* ── Card 4: Terms & Agreement ── */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {/* Card header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 16,
              paddingBottom: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: '#E5E7EB',
            }}
          >
            <ScrollText size={13} color="#6B7280" />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#4B5563',
                letterSpacing: 1,
                textTransform: 'uppercase',
                flex: 1,
              }}
            >
              {t('termsModal.title', 'Terms & Agreement')}
            </Text>
            {termsRead && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 20,
                }}
              >
                <CheckCircle2 size={10} color="#16A34A" />
                <Text style={{ fontSize: 9, color: '#15803D', fontWeight: '600' }}>
                  READ
                </Text>
              </View>
            )}
          </View>

          {/* Intro notice */}
          <View
            style={{
              margin: 12,
              marginBottom: 4,
              flexDirection: 'row',
              gap: 8,
              backgroundColor: '#F9FAFB',
              borderLeftWidth: 3,
              borderLeftColor: '#D1D5DB',
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 11,
                color: '#4B5563',
                lineHeight: 17,
              }}
            >
              {t('termsModal.intro', {
                appName: t('termsModal.appName', 'Santa Maria Barangay App'),
              })}
            </Text>
          </View>

          {/* Scrollable terms body */}
          <ScrollView
            ref={termsScrollRef}
            style={{
              maxHeight: 220,
              marginHorizontal: 12,
              marginTop: 10,
            }}
            onScroll={handleTermsScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled
          >
            {[
              { title: t('termsModal.sections.s1Title'), body: t('termsModal.sections.s1Body', { lgu: t('termsModal.municipality') }) },
              { title: t('termsModal.sections.s2Title'), body: t('termsModal.sections.s2Body') },
              { title: t('termsModal.sections.s3Title'), body: t('termsModal.sections.s3Body', { law: t('termsModal.sections.s3Law') }) },
              { title: t('termsModal.sections.s4Title'), body: t('termsModal.sections.s4Body', { law: t('termsModal.sections.s4Law') }) },
              { title: t('termsModal.sections.s5Title'), body: t('termsModal.sections.s5Body', { charter: t('termsModal.sections.s5Charter'), law: t('termsModal.sections.s5Law') }) },
              { title: t('termsModal.sections.s6Title'), body: t('termsModal.sections.s6Body') },
              { title: t('termsModal.sections.s7Title'), body: t('termsModal.sections.s7Body') },
              { title: t('termsModal.sections.s8Title'), body: t('termsModal.sections.s8Body') },
              { title: t('termsModal.sections.s9Title'), body: t('termsModal.sections.s9Body') },
              { title: t('termsModal.sections.s10Title'), body: t('termsModal.sections.s10Body', { country: t('termsModal.sections.s10Country') }) },
            ].map((sec, i) => (
              <View key={i} style={{ marginBottom: 14 }}>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    color: '#9CA3AF',
                    marginBottom: 4,
                  }}
                >
                  {sec.title}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#4B5563',
                    lineHeight: 17,
                  }}
                >
                  {sec.body}
                </Text>
              </View>
            ))}
            <View style={{ height: 12 }} />
          </ScrollView>

          {/* Scroll notice */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderTopWidth: 0.5,
              borderTopColor: '#E5E7EB',
              marginTop: 6,
            }}
          >
            {termsRead ? (
              <CheckCircle2 size={11} color="#16A34A" />
            ) : (
              <AlertCircle size={11} color="#9CA3AF" />
            )}
            <Text
              style={{
                fontSize: 10,
                color: termsRead ? '#15803D' : '#6B7280',
              }}
            >
              {termsRead
                ? t('termsModal.footer.hasRead', 'You have read the terms.')
                : t('termsModal.footer.notRead', 'Please scroll to read all terms.')}
            </Text>
          </View>

          {/* Checkbox accept row */}
          <TouchableOpacity
            onPress={() => termsRead && setTermsAccepted(prev => !prev)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              margin: 12,
              marginTop: 4,
              padding: 12,
              borderRadius: 10,
              backgroundColor: termsAccepted
                ? '#DCFCE7'
                : '#F9FAFB',
              borderWidth: 1,
              borderColor: termsAccepted
                ? '#86EFAC'
                : '#E5E7EB',
              opacity: termsRead ? 1 : 0.45,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                borderWidth: 1.5,
                borderColor: termsAccepted ? '#16A34A' : '#D1D5DB',
                backgroundColor: termsAccepted
                  ? '#DCFCE7'
                  : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {termsAccepted && <Check size={12} color="#16A34A" />}
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 11,
                color: termsAccepted ? '#15803D' : '#4B5563',
                lineHeight: 16,
                fontWeight: termsAccepted ? '600' : '400',
              }}
            >
              {t(
                'termsModal.footer.accept',
                'I have read and agree to the Terms and Agreement.'
              )}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* ── Submit CTA ── */}
        <View style={{ marginTop: 8, alignItems: 'center', gap: 10 }}>
          {!termsAccepted && (
            <Text
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              {termsRead
                ? 'Please check the box above to accept the terms.'
                : 'Read all terms above to enable submission.'}
            </Text>
          )}

          <TouchableOpacity
            onPress={onConfirmSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 14,
              paddingHorizontal: 36,
              borderRadius: 14,
              backgroundColor: canSubmit ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
              width: '100%',
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={THEME.primary} />
            ) : (
              <Send size={16} color={canSubmit ? THEME.primary : 'rgba(255,255,255,0.4)'} />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: canSubmit ? THEME.primary : 'rgba(255,255,255,0.4)',
                letterSpacing: 0.3,
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </Text>
          </TouchableOpacity>

          {!isSubmitting && (
            <TouchableOpacity onPress={onBack} style={{ paddingVertical: 6 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                ← Go back and edit
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}