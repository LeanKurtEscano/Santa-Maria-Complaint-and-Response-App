import { View, Text, TouchableOpacity, Linking } from 'react-native'
import { FileText, ArrowRight } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { THEME } from '@/constants/theme'

const GDRIVE_URL = 'https://drive.google.com/drive/folders/1luuPqhaABDv4eaYTjsc0Y41b2VsgHAYS'

export function OrdinanceCard() {
  const { t } = useTranslation()

  const handlePress = () => {
    Linking.openURL(GDRIVE_URL)
  }

  return (
    <View className="px-5 mt-4 mb-2">
      <View style={{ backgroundColor: THEME.primary, borderRadius: 28, padding: 20, overflow: 'hidden' }}>

        <View style={{ position: 'absolute', top: -28, right: -28, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ position: 'absolute', bottom: -20, left: 60, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' }} />

        <View className="flex-row items-center gap-1 bg-white/20 rounded-full px-3 py-1 self-start mb-3">
          <FileText size={11} color="#FDE68A" />
          <Text className="text-[11px] font-bold text-yellow-200 tracking-wide uppercase">
            {t('ordinance.badge')}
          </Text>
        </View>

        <Text className="text-[19px] font-extrabold text-white leading-[25px] mb-1">
          {t('ordinance.title')}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
          {t('ordinance.subtitle')}
        </Text>

        <TouchableOpacity onPress={handlePress} activeOpacity={0.85} className="self-start">
          <View className="flex-row items-center gap-2 bg-white rounded-2xl px-4 py-2.5">
            <Text style={{ color: THEME.primary, fontSize: 13, fontWeight: '800' }}>
              {t('ordinance.cta')}
            </Text>
            <ArrowRight size={14} color={THEME.primaryDark} />
          </View>
        </TouchableOpacity>

      </View>
    </View>
  )
}