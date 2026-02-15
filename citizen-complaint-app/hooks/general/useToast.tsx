
import { useState } from 'react';
const useToast = () => {
   const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');


    const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };


  return { toastVisible, toastMessage, toastType, showToast,setToastMessage,setToastType,setToastVisible };
}

export default useToast