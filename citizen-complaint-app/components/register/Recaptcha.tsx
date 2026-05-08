import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Shield, ShieldCheck, Check, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import ErrorMessage from './ErrorMessage';

interface RecaptchaProps {
  verified: boolean;
  onVerify: () => void;
  error?: string;
}

const Recaptcha = ({ verified, onVerify, error }: RecaptchaProps) => {
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(false);

  const handlePress = () => {
    if (verified) return;
    setShowModal(true);
  };

  const handleVerify = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setShowModal(false);
      onVerify();
    }, 1000);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.recaptchaBox,
          error ? styles.recaptchaBoxError : styles.recaptchaBoxDefault,
        ]}
      >
        <View
          style={[
            styles.recaptchaCheckbox,
            verified ? styles.recaptchaCheckboxChecked : styles.recaptchaCheckboxUnchecked,
          ]}
        >
          {verified && <Check size={14} color="#FFFFFF" />}
        </View>
        <Text style={styles.recaptchaLabel}>I'm not a robot</Text>
        <View style={styles.recaptchaBrand}>
          <Shield size={22} color={THEME.primary} />
          <Text style={[styles.recaptchaBrandText, { color: THEME.primary }]}>reCAPTCHA</Text>
          <Text style={styles.recaptchaPrivacy}>Privacy - Terms</Text>
        </View>
      </TouchableOpacity>

      <ErrorMessage message={error} />

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recaptchaModal}>
            <View style={[styles.recaptchaModalHeader, { backgroundColor: THEME.primary }]}>
              <ShieldCheck size={24} color="#FFFFFF" />
              <Text style={styles.recaptchaModalTitle}>Security Check</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.recaptchaModalClose}
                activeOpacity={0.7}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.recaptchaModalBody}>
              <Text style={styles.recaptchaModalSubtitle}>
                Please confirm you are not a robot
              </Text>
              <TouchableOpacity
                onPress={handleVerify}
                disabled={checking}
                activeOpacity={0.85}
                style={[styles.recaptchaVerifyBtn, { backgroundColor: THEME.primary }]}
              >
                {checking ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.recaptchaVerifyBtnContent}>
                    <ShieldCheck size={20} color="#FFFFFF" />
                    <Text style={styles.recaptchaVerifyBtnText}>I'm not a robot</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.recaptchaFooter}>
                <Shield size={14} color="#9CA3AF" />
                <Text style={styles.recaptchaFooterText}>Protected by reCAPTCHA</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  recaptchaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  recaptchaBoxDefault: { borderColor: '#E5E7EB' },
  recaptchaBoxError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  recaptchaCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recaptchaCheckboxUnchecked: { borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  recaptchaCheckboxChecked: { borderColor: THEME.primary, backgroundColor: THEME.primary },
  recaptchaLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  recaptchaBrand: { alignItems: 'center' },
  recaptchaBrandText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  recaptchaPrivacy: { fontSize: 8, color: '#9CA3AF', marginTop: 1 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 24,
  },
  recaptchaModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  recaptchaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  recaptchaModalTitle: { flex: 1, color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  recaptchaModalClose: { padding: 4 },
  recaptchaModalBody: { padding: 24, alignItems: 'center' },
  recaptchaModalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  recaptchaVerifyBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  recaptchaVerifyBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recaptchaVerifyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  recaptchaFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recaptchaFooterText: { fontSize: 12, color: '#9CA3AF' },
});

export default Recaptcha;