import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, FileText, Paperclip, Shield, Scale } from 'lucide-react-native';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { Attachment } from '@/hooks/general/useAttachment';

interface ComplaintLetterPreviewProps {
  barangayName: string;
  title: string;
  message: string;
  attachments?: Attachment[];
  onConfirmSubmit: () => void;
  onBack: () => void;
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

export default function ComplaintLetterPreview({
  barangayName,
  title,
  message,
  attachments = [],
  onConfirmSubmit,
  onBack,
  isSubmitting = false,
}: ComplaintLetterPreviewProps) {
  const { userData } = useCurrentUser();

  const today = new Date();

  const fullName =
    userData?.first_name && userData?.last_name
      ? `${userData.first_name} ${userData.last_name}`
      : 'Complainant';

  const fullAddress = userData?.full_address || userData?.barangay || 'N/A';

  return (
    <SafeAreaView className="flex-1 bg-blue-950">

      {/* ── Top Bar ── */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-blue-950">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center gap-1.5 py-2 px-3 rounded-lg bg-white"
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} color="#1e3a5f" />
          <Text className="text-xs font-bold text-blue-950" style={{ fontFamily: 'serif' }}>
            Back
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          <FileText size={15} color="#ffffff" />
          <Text className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: 'serif' }}>
            Letter Preview
          </Text>
        </View>

        <View className="w-16" />
      </View>

      <ScrollView
        className="flex-1 bg-blue-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Bond Paper Card ── */}
        <View
          className="bg-white rounded-none border border-stone-200 px-7 py-8"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          }}
        >

          {/* ── Republic Header ── */}
          <View className="items-center mb-5">
            <Text
              className="text-xs font-bold text-blue-950 tracking-widest uppercase"
              style={{ fontFamily: 'serif' }}
            >
              Republic of the Philippines
            </Text>
            <Text
              className="text-xs text-stone-500 tracking-wider mt-0.5"
              style={{ fontFamily: 'serif' }}
            >
              Province of Laguna
            </Text>
            <Text
              className="text-xs text-stone-500 tracking-wider"
              style={{ fontFamily: 'serif' }}
            >
              Municipality of Santa Maria
            </Text>

            {/* Thin rule */}
            <View className="w-20 h-px bg-blue-950 my-3" />

            <Text
              className="text-stone-400 uppercase"
              style={{ fontFamily: 'serif', fontSize: 8, letterSpacing: 4 }}
            >
              Barangay
            </Text>
            <Text
              className="text-2xl font-bold text-blue-950 tracking-wide mt-0.5"
              style={{ fontFamily: 'serif' }}
            >
              {barangayName.toUpperCase()}
            </Text>
            <Text
              className="text-stone-400 tracking-widest uppercase mt-0.5"
              style={{ fontFamily: 'serif', fontSize: 8 }}
            >
              Office of the Punong Barangay
            </Text>
          </View>

          {/* ── Icon Row (no emoji) ── */}
          <View className="flex-row items-center justify-between mb-5 px-1">
            {/* Left seal icon */}
            <View className="w-11 h-11 rounded-full border-2 border-blue-950 bg-blue-50 items-center justify-center">
              <Shield size={18} color="#1e3a5f" />
            </View>

            <View className="flex-1 items-center px-3">
              <Text
                className="text-xs font-bold text-blue-950 tracking-widest text-center uppercase"
                style={{ fontFamily: 'serif' }}
              >
                Barangay Complaint Form
              </Text>
              <View className="w-4/5 h-px bg-blue-950 my-2" />
              <Text
                className="text-stone-400"
                style={{ fontFamily: 'serif', fontSize: 8, letterSpacing: 0.5 }}
              >
                Ref. No.: {REF_NUMBER}
              </Text>
            </View>

            {/* Right scale icon */}
            <View className="w-11 h-11 rounded-full border-2 border-blue-950 bg-blue-50 items-center justify-center">
              <Scale size={18} color="#1e3a5f" />
            </View>
          </View>

          {/* ── Date & Destination Strip ── */}
          <View className="flex-row border border-blue-200 rounded-sm py-2.5 px-4 mb-5 items-center bg-blue-50">
            <View className="flex-1 items-center">
              <Text
                className="text-stone-400 uppercase mb-1"
                style={{ fontFamily: 'serif', fontSize: 7, letterSpacing: 2 }}
              >
                Date Filed
              </Text>
              <Text
                className="text-xs font-bold text-blue-950 text-center"
                style={{ fontFamily: 'serif' }}
              >
                {formatDate(today)}
              </Text>
            </View>
            <View className="w-px h-8 bg-blue-300 mx-2" />
            <View className="flex-1 items-center">
              <Text
                className="text-stone-400 uppercase mb-1"
                style={{ fontFamily: 'serif', fontSize: 7, letterSpacing: 2 }}
              >
                Filed To
              </Text>
              <Text
                className="text-xs font-bold text-blue-950 text-center"
                style={{ fontFamily: 'serif' }}
              >
                Brgy. {barangayName}
              </Text>
            </View>
          </View>

          {/* ── Thin Divider ── */}
          <View className="h-px bg-stone-200 mb-5" />

          {/* ── Salutation ── */}
          <Text
            className="text-xs text-stone-700 leading-6 mb-3"
            style={{ fontFamily: 'serif' }}
          >
            To:{'\n'}
            <Text className="font-bold text-blue-950">
              The Honorable Punong Barangay{'\n'}
            </Text>
            <Text className="italic text-stone-500">
              Barangay {barangayName},{'\n'}
            </Text>
            <Text className="text-stone-500">Santa Maria, Laguna</Text>
          </Text>

          {/* ── Subject ── */}
          <View className="flex-row flex-wrap items-start mb-4">
            <Text
              className="text-xs font-bold text-blue-950 tracking-wide leading-5"
              style={{ fontFamily: 'serif' }}
            >
              SUBJECT:{' '}
            </Text>
            <Text
              className="text-xs font-bold text-blue-950 underline flex-1 leading-5"
              style={{ fontFamily: 'serif' }}
            >
              {title}
            </Text>
          </View>

          {/* ── Opening ── */}
          <Text
            className="text-xs text-stone-700 leading-6"
            style={{ fontFamily: 'serif' }}
          >
            Respectfully,
          </Text>
          <Text
            className="text-xs text-stone-700 leading-6 mt-1.5"
            style={{ fontFamily: 'serif' }}
          >
            I, the undersigned, a resident of Barangay {barangayName}, Santa Maria,
            Laguna, hereby file this formal complaint before your esteemed office for
            appropriate action and resolution:
          </Text>

          {/* ── Complaint Details Box ── */}
          <View className="mt-4 border-l-4 border-blue-950 bg-stone-50 px-4 py-3.5 rounded-r-sm">
            <Text
              className="text-blue-950 font-bold uppercase mb-2"
              style={{ fontFamily: 'serif', fontSize: 7, letterSpacing: 2 }}
            >
              Complaint Details
            </Text>
            <Text
              className="text-xs text-stone-700 leading-6"
              style={{ fontFamily: 'serif' }}
            >
              {message}
            </Text>
          </View>

          {/* ── Attachments ── */}
          {attachments.length > 0 && (
            <View className="mt-4 pt-3 border-t border-stone-200">
              <Text
                className="text-blue-950 font-bold uppercase mb-2"
                style={{ fontFamily: 'serif', fontSize: 7, letterSpacing: 2 }}
              >
                Attachments / Evidence ({attachments.length})
              </Text>
              {attachments.map((att, i) => (
                <View key={i} className="flex-row items-center mb-1.5 gap-1.5">
                  <View className="w-1 h-1 rounded-full bg-blue-950" />
                  <Paperclip size={9} color="#1e3a5f" />
                  <Text
                    className="text-xs text-stone-600 flex-1"
                    style={{ fontFamily: 'serif' }}
                  >
                    {att.name}
                  </Text>
                  <Text
                    className="text-stone-400"
                    style={{ fontFamily: 'serif', fontSize: 8 }}
                  >
                    [{att.type.toUpperCase()}]
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Closing ── */}
          <Text
            className="text-xs text-stone-700 leading-6 mt-5"
            style={{ fontFamily: 'serif' }}
          >
            I humbly pray that your good office take cognizance of this complaint and
            conduct the necessary proceedings in accordance with the Katarungang
            Pambarangay Law (R.A. 7160) and other applicable laws and ordinances.
          </Text>
          <Text
            className="text-xs text-stone-700 leading-6 mt-3"
            style={{ fontFamily: 'serif' }}
          >
            I hereby certify that the information provided in this complaint form is
            true and correct to the best of my knowledge and belief.
          </Text>

          {/* ── Signature Block ── */}
          <View className="mt-8">
            <Text
              className="text-stone-400 mb-10"
              style={{ fontFamily: 'serif', fontSize: 9 }}
            >
              Respectfully submitted by:
            </Text>
            <View className="w-52">
              <View className="h-px bg-blue-950 mb-1" />
              <Text
                className="text-xs font-bold text-blue-950 tracking-wide"
                style={{ fontFamily: 'serif' }}
              >
                {fullName.toUpperCase()}
              </Text>
              <Text
                className="italic text-stone-500"
                style={{ fontFamily: 'serif', fontSize: 9 }}
              >
                Complainant
              </Text>
              <Text
                className="text-stone-400 mt-0.5"
                style={{ fontFamily: 'serif', fontSize: 8 }}
              >
                {fullAddress}
              </Text>
            </View>
          </View>

          {/* ── Footer Rule ── */}
          <View className="h-px bg-blue-950 mt-6 mb-3" />
          <Text
            className="text-stone-400 text-center leading-4"
            style={{ fontFamily: 'serif', fontSize: 7, letterSpacing: 0.2 }}
          >
            This document is an official complaint filed with Barangay {barangayName}{' '}
            through the Santa Maria Barangay Complaint System. Reference No. {REF_NUMBER}
          </Text>

        </View>

        {/* ── CTA ── */}
        <View className="mt-6 items-center gap-3">
          <Text
            className="text-xs text-blue-200 italic"
            style={{ fontFamily: 'serif' }}
          >
            Review the letter carefully before submitting.
          </Text>

          <TouchableOpacity
            onPress={onConfirmSubmit}
            disabled={isSubmitting}
            className={`flex-row items-center py-3.5 px-9 rounded-xl gap-2.5 ${
              isSubmitting ? 'bg-white opacity-70' : 'bg-white'
            }`}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#1e3a5f" />
            ) : (
              <Send size={18} color="#1e3a5f" />
            )}
            <Text
              className="text-blue-950 text-sm font-bold tracking-wide"
              style={{ fontFamily: 'serif' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </Text>
          </TouchableOpacity>

          {!isSubmitting && (
            <TouchableOpacity onPress={onBack} className="py-1.5">
              <Text
                className="text-xs text-blue-200"
                style={{ fontFamily: 'serif' }}
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