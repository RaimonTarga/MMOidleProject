import { useEffect, useRef, useState } from 'react';
import type { EquipmentSlot } from '@mmo-idle/shared';

export interface FocusedItem {
  defId:      string;
  source:     'backpack' | 'equipped';
  invIndex?:  number;
  equipSlot?: EquipmentSlot;
}

export function useFocusWithDelay() {
  const [focused, setFocused] = useState<FocusedItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function focus(item: FocusedItem | null) {
    if (timer.current) clearTimeout(timer.current);
    if (item) {
      setFocused(item);
    } else {
      timer.current = setTimeout(() => setFocused(null), 120);
    }
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { focused, focus };
}
