import { createWithEqualityFn } from 'zustand/traditional';
import { Content } from '@/lib/types/content';

interface ModalState {
  isOpen: boolean;
  content: Content | null;
  openModal: (content: Content) => void;
  closeModal: () => void;
}

export const useModalStore = createWithEqualityFn<ModalState>(set => ({
  isOpen: false,
  content: null,
  openModal: content => set({ isOpen: true, content }),
  closeModal: () => set({ isOpen: false, content: null }),
}));
