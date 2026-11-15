import { useNavigation } from 'expo-router';
import { useEffect, type RefObject } from 'react';

/** Scroll the active tab list to the top when the same tab is tapped again. */
export function useTabScrollToTop(ref: RefObject<any>) {
  const navigation = useNavigation();

  useEffect(() => {
    const parent = navigation.getParent?.();
    const target = parent ?? navigation;
    const unsubscribe = (target as { addListener?: (event: string, cb: () => void) => () => void }).addListener?.(
      'tabPress',
      () => {
      if (!(navigation as { isFocused?: () => boolean }).isFocused?.()) return;
      const node = ref.current;
      if (!node) return;
      if (typeof node.scrollTo === 'function') {
        node.scrollTo({ y: 0, animated: true });
        return;
      }
      if (typeof node.scrollToOffset === 'function') {
        node.scrollToOffset({ offset: 0, animated: true });
      }
    },
    );
    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
  }, [navigation, ref]);
}
