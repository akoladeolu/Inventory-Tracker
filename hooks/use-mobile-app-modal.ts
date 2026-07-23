import { create } from "zustand";

interface MobileAppModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useMobileAppModal = create<MobileAppModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
