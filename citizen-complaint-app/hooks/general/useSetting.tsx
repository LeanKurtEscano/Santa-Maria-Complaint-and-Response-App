import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSettingsLogic = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  // Notification states (UI only for now)
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [complaintUpdates, setComplaintUpdates] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(false);

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('userLanguage', language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Toggle functions for notifications (UI only)
  const togglePushNotifications = () => setPushNotifications(!pushNotifications);
  const toggleEmailNotifications = () => setEmailNotifications(!emailNotifications);
  const toggleComplaintUpdates = () => setComplaintUpdates(!complaintUpdates);
  const toggleNewsAlerts = () => setNewsAlerts(!newsAlerts);

  return {
    // Language
    currentLanguage,
    changeLanguage,
    
    // Notifications
    pushNotifications,
    emailNotifications,
    complaintUpdates,
    newsAlerts,
    togglePushNotifications,
    toggleEmailNotifications,
    toggleComplaintUpdates,
    toggleNewsAlerts,
  };
};