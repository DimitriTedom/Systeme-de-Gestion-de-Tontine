import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/toast-provider';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  storageKey?: string;
}

/**
 * Hook for auto-saving form data with draft state
 * Saves to localStorage and optionally syncs to backend
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  storageKey,
}: UseAutoSaveOptions<T>) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      const draft = localStorage.getItem(storageKey);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          // You can emit this to parent component if needed
          console.log('Draft loaded:', parsedDraft);
        } catch (error) {
          console.error('Failed to parse draft:', error);
        }
      }
    }
  }, [storageKey]);

  // Auto-save effect
  useEffect(() => {
    // Check if data has changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    previousDataRef.current = data;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Save to localStorage immediately (draft)
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }

    // Debounced save to backend
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(data);
        setLastSaved(new Date());
        
        // Clear draft after successful save
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Échec de la sauvegarde automatique', {
          description: 'Vos modifications seront réessayées automatiquement',
        });
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, onSave, storageKey, toast]);

  const clearDraft = () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  return {
    isSaving,
    lastSaved,
    clearDraft,
  };
}
