import { create } from 'zustand';
import { Content } from '@/lib/types/content';

interface ModalState {
    isOpen: boolean;
    content: Content | null;
    openModal: (content: Content) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    isOpen: false,
    content: null,
    openModal: (content) => set({ isOpen: true, content }),
    closeModal: () => set({ isOpen: false, content: null }),
}));
