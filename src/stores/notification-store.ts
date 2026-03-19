// ============================================================
// GridIron IQ — Notification & Toast State Store (Zustand)
// ============================================================

import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationStore {
  // Toast messages shown briefly
  toasts: Toast[];

  // Badge counts per section
  badgeCounts: {
    social: number;
    fantasy: number;
    predictions: number;
  };

  // Actions
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  setBadgeCount: (section: string, count: number) => void;
  clearBadges: (section: string) => void;
  reset: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const INITIAL_STATE = {
  toasts: [] as Toast[],
  badgeCounts: {
    social: 0,
    fantasy: 0,
    predictions: 0,
  },
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  ...INITIAL_STATE,

  showToast: (message, type = 'info') => {
    const id = generateId();
    const toast: Toast = { id, message, type };

    set(state => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }));
    }, 3000);
  },

  dismissToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },

  setBadgeCount: (section, count) => {
    set(state => ({
      badgeCounts: {
        ...state.badgeCounts,
        [section]: count,
      },
    }));
  },

  clearBadges: (section) => {
    set(state => ({
      badgeCounts: {
        ...state.badgeCounts,
        [section]: 0,
      },
    }));
  },

  reset: () => set(INITIAL_STATE),
}));
