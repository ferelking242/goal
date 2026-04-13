import React, { createContext, useCallback, useContext, useRef } from 'react';
import { Animated } from 'react-native';

type TabBarContextType = {
  tabBarAnim: Animated.Value;
  onScrollEvent: (e: any) => void;
};

const TabBarContext = createContext<TabBarContextType | null>(null);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const tabBarAnim = useRef(new Animated.Value(1)).current;
  const lastY = useRef(0);
  const isVisible = useRef(true);

  const onScrollEvent = useCallback((e: any) => {
    const y = e.nativeEvent?.contentOffset?.y ?? 0;
    const diff = y - lastY.current;
    lastY.current = y;

    if (diff > 8 && isVisible.current) {
      isVisible.current = false;
      Animated.spring(tabBarAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 200,
        friction: 20,
      }).start();
    } else if (diff < -6 && !isVisible.current) {
      isVisible.current = true;
      Animated.spring(tabBarAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 20,
      }).start();
    }
  }, [tabBarAnim]);

  return (
    <TabBarContext.Provider value={{ tabBarAnim, onScrollEvent }}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  const ctx = useContext(TabBarContext);
  if (!ctx) throw new Error('useTabBar must be inside TabBarProvider');
  return ctx;
}
