import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Sparkles, ArrowRight, Star } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { THEME } from '@/constants/theme'

export function FeedbackCard() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <View className="px-5 mt-4 mb-2">
      <View style={{ backgroundColor: THEME.primary, borderRadius: 28, padding: 20, overflow: 'hidden' }}>

        <View style={{ position: 'absolute', top: -28, right: -28, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ position: 'absolute', bottom: -20, left: 60, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' }} />

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <Sparkles size={11} color="#FDE68A" />
            <Text className="text-[11px] font-bold text-yellow-200 tracking-wide uppercase">
              {t('feedback.card_badge')}
            </Text>
          </View>
          <View className="flex-row gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={12} color="#FDE68A" fill="#FDE68A" />
            ))}
          </View>
        </View>

        <Text className="text-[19px] font-extrabold text-white leading-[25px] mb-1">
          {t('feedback.card_title')}
        </Text>
        <Text style={{ color: THEME.primaryLight, fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
          {t('feedback.card_subtitle')}
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/feedback/Feedback')}
          activeOpacity={0.85}
          className="self-start"
        >
          <View className="flex-row items-center gap-2 bg-white rounded-2xl px-4 py-2.5">
            <Text style={{ color: THEME.primary, fontSize: 13, fontWeight: '800' }}>
              {t('feedback.card_cta')}
            </Text>
            <ArrowRight size={14} color={THEME.primaryDark} />
          </View>
        </TouchableOpacity>

      </View>
    </View>
  )
}