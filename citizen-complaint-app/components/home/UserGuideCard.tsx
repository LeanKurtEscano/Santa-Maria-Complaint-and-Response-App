import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, BookOpen, PlayCircle } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

const USER_GUIDE_URL = 'http://cfms-stamaria.com/users-guide';

export function UserGuideCard() {
  const { t } = useTranslation();
  const openUserGuide = () => {
    void Linking.openURL(USER_GUIDE_URL);
  };

  return (
    <View className="px-5 mt-3 mb-2">
      <TouchableOpacity
        onPress={openUserGuide}
        activeOpacity={0.85}
        style={{
          backgroundColor: '#ECFDF5',
          borderRadius: 28,
          padding: 20,
          borderWidth: 1,
          borderColor: '#A7F3D0',
          shadowColor: THEME.primary,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
              <BookOpen size={20} color={THEME.primaryDark} />
            </View>
            <View>
              <Text className="text-[11px] font-bold text-emerald-700 tracking-widest uppercase">
                {t('userGuide.badge')}
              </Text>
              <Text className="text-[19px] font-extrabold text-slate-800">
                {t('userGuide.title')}
              </Text>
            </View>
          </View>
          <PlayCircle size={28} color={THEME.primary} />
        </View>

        <Text className="text-[13px] text-slate-600 leading-5 mb-4">
          {t('userGuide.subtitle')}
        </Text>

        <View className="self-start flex-row items-center gap-2 bg-white rounded-2xl px-4 py-2.5">
          <Text style={{ color: THEME.primaryDark, fontSize: 13, fontWeight: '800' }}>
            {t('userGuide.cta')}
          </Text>
          <ArrowRight size={14} color={THEME.primaryDark} />
        </View>
      </TouchableOpacity>
    </View>
  );
}