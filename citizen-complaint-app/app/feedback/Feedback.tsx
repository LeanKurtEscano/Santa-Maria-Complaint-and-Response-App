import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Star, ChevronLeft, MessageSquarePlus, CheckCircle2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { feedbackApiClient } from '@/lib/client/feedback'
import { THEME } from '@/constants/theme'

export default function Feedback() {
  const router = useRouter()
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const RATING_LABELS: Record<number, string> = {
    1: t('feedback.rating_poor'),
    2: t('feedback.rating_fair'),
    3: t('feedback.rating_good'),
    4: t('feedback.rating_very_good'),
    5: t('feedback.rating_excellent'),
  }

  const handleRatingPress = (star: number) => {
    // If the same star is pressed again, remove the rating (set to 0)
    // Otherwise, set the rating to the selected star
    setRating(star === rating ? 0 : star)
    // Clear error when user interacts with rating
    setError(null)
  }

  const handleSubmit = async () => {
    // Check if rating is required and not selected
    if (rating === 0) {
      setError(t('feedback.error_no_rating'))
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await feedbackApiClient.post('/submit', {
        ratings: rating,
        message: message.trim() || null,
      })
      setSubmitted(true)
    } catch (err: any) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail

      if (status === 429) {
        setError(t('feedback.error_too_many'))
      } else if (status === 404) {
        setError(t('feedback.error_not_found'))
      } else if (status === 500) {
        setError(detail ?? t('feedback.error_server'))
      } else if (!status) {
        setError(t('feedback.error_no_internet'))
      } else {
        setError(detail ?? t('feedback.error_generic'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} activeOpacity={0.7}>
            <ChevronLeft size={24} color={THEME.primary} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: 16, color: '#0F172A' }}>
            {t('feedback.screen_title')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 28, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <CheckCircle2 size={40} color="#16A34A" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' }}>
            {t('feedback.success_title')}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 22 }}>
            {t('feedback.success_message')}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
            style={{ marginTop: 32, backgroundColor: THEME.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
              {t('feedback.success_cta')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} activeOpacity={0.7}>
            <ChevronLeft size={24} color={THEME.primary} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: 16, color: '#0F172A' }}>
            {t('feedback.screen_title')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero card */}
          <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <MessageSquarePlus size={26} color="#fff" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E3A8A', marginBottom: 6 }}>
              {t('feedback.hero_title')}
            </Text>
            <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20 }}>
              {t('feedback.hero_subtitle')}
            </Text>
          </View>

          {/* Rating label with required indicator */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 12 }}>
            {t('feedback.rating_label')}{' '}
            <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>

          {/* Star rating card */}
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRatingPress(star)}
                  activeOpacity={0.7}
                  hitSlop={6}
                >
                  <Star
                    size={36}
                    color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                    fill={star <= rating ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#F59E0B' }}>
                {RATING_LABELS[rating]}
              </Text>
            )}
          </View>

          {/* Message label */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 12 }}>
            {t('feedback.message_label')}{' '}
            <Text style={{ fontWeight: '400', color: '#94A3B8' }}>
              {t('feedback.message_optional')}
            </Text>
          </Text>

          {/* Message input card */}
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, marginBottom: 20 }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('feedback.message_placeholder')}
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              style={{ padding: 16, fontSize: 13, color: '#0F172A', minHeight: 120, textAlignVertical: 'top' }}
            />
            <Text style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8', paddingHorizontal: 16, paddingBottom: 10 }}>
              {message.length}/500
            </Text>
          </View>

          {/* Error banner */}
          {error && (
            <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 16, padding: 14, marginBottom: 20 }}>
              <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '600' }}>{error}</Text>
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
            style={{
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: isSubmitting ? '#93C5FD' : THEME.primary,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MessageSquarePlus size={18} color="#fff" />
            )}
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
              {isSubmitting ? t('feedback.submitting') : t('feedback.submit_button')}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}