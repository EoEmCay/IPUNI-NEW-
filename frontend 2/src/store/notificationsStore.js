import { create } from 'zustand';

const useNotificationsStore = create((set) => ({
  isOpen: false,
  medications: [],
  appointments: [],

  setOpen: (isOpen) => set({ isOpen }),
  setMedications: (medications) => set({ medications }),
  setAppointments: (appointments) => set({ appointments }),

  // Helper to check if there are any notifications
  hasNotifications: function() {
    const state = this.getState?.() || this;
    return state.medications.length > 0 || state.appointments.length > 0;
  },
}));

export default useNotificationsStore;
