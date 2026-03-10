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

  const handleSubmit = async () => {
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
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center px-5 py-3.5 border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-extrabold text-base text-slate-900">
            {t('feedback.screen_title')}
          </Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-[28px] bg-green-100 items-center justify-center mb-5">
            <CheckCircle2 size={40} color="#16A34A" />
          </View>
          <Text className="text-[22px] font-extrabold text-slate-900 mb-2 text-center">
            {t('feedback.success_title')}
          </Text>
          <Text className="text-sm text-slate-500 text-center leading-[22px]">
            {t('feedback.success_message')}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
            className="mt-8 bg-blue-600 px-8 py-3.5 rounded-2xl"
          >
            <Text className="text-white font-bold text-[15px]">
              {t('feedback.success_cta')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center px-5 py-3.5 border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-extrabold text-base text-slate-900">
            {t('feedback.screen_title')}
          </Text>
          <View className="w-6" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero card */}
          <View className="bg-blue-50 border border-blue-200 rounded-[20px] p-5 items-center mb-6">
            <View className="w-14 h-14 rounded-[18px] bg-blue-600 items-center justify-center mb-3">
              <MessageSquarePlus size={26} color="#fff" />
            </View>
            <Text className="text-[17px] font-extrabold text-blue-900 mb-1.5">
              {t('feedback.hero_title')}
            </Text>
            <Text className="text-[13px] text-slate-600 text-center leading-5">
              {t('feedback.hero_subtitle')}
            </Text>
          </View>

          {/* Rating label */}
          <Text className="text-[13px] font-bold text-slate-700 mb-3">
            {t('feedback.rating_label')}
          </Text>

          {/* Star rating card */}
          <View className="bg-white border border-slate-200 rounded-[20px] p-5 items-center mb-5">
            <View className="flex-row gap-2.5 mb-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setRating(star)
                    setError(null)
                  }}
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
              <Text className="text-[13px] font-semibold text-amber-500">
                {RATING_LABELS[rating]}
              </Text>
            )}
          </View>

          {/* Message label */}
          <Text className="text-[13px] font-bold text-slate-700 mb-3">
            {t('feedback.message_label')}{' '}
            <Text className="font-normal text-slate-400">
              {t('feedback.message_optional')}
            </Text>
          </Text>

          {/* Message input card */}
          <View className="bg-white border border-slate-200 rounded-[20px] mb-5">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('feedback.message_placeholder')}
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              className="p-4 text-sm text-slate-900 min-h-[120px]"
              style={{ textAlignVertical: 'top' }}
            />
            <Text className="text-right text-[11px] text-slate-400 px-4 pb-2.5">
              {message.length}/500
            </Text>
          </View>

          {/* Error banner */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-5">
              <Text className="text-[13px] text-red-600 font-semibold">{error}</Text>
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
            className={`rounded-[18px] py-4 items-center flex-row justify-center gap-2 ${
              isSubmitting ? 'bg-blue-300' : 'bg-blue-600'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MessageSquarePlus size={18} color="#fff" />
            )}
            <Text className="text-white font-extrabold text-[15px]">
              {isSubmitting ? t('feedback.submitting') : t('feedback.submit_button')}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}