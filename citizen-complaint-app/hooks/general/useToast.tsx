import { useState } from 'react';

const useToast = () => {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => setToastVisible(false);

  return {
    toastVisible,
    toastMessage,
    toastType,
    showToast,
    hideToast,
    setToastVisible,
    setToastMessage,
    setToastType,
  };
};

export default useToast;