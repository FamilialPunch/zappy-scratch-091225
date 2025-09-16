'use client';

import { useToastContext } from '@/components/toast/ToastProvider';

export function useToast() {
  return useToastContext();
}
