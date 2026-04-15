import { create } from 'zustand';

interface ToastState {
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  setToastVisible: (visible: boolean) => void;
  setToastMessage: (message: string) => void;
  setToastType: (type: 'success' | 'error' | 'info') => void;
}

const useToastStore = create<ToastState>((set) => ({
  toastVisible: false,
  toastMessage: '',
  toastType: 'success',
  
  showToast: (message, type) => set({
    toastMessage: message,
    toastType: type,
    toastVisible: true,
  }),
  
  hideToast: () => set({ toastVisible: false }),
  
  setToastVisible: (visible) => set({ toastVisible: visible }),
  setToastMessage: (message) => set({ toastMessage: message }),
  setToastType: (type) => set({ toastType: type }),
}));

export default useToastStore;