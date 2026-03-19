import React, { useState, useEffect, useRef } from 'react';
import { Text, TextStyle } from 'react-native';
import { colors, typography } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnimatedNumberProps {
  value: number;
  duration?: number; // ms, default 800
  style?: TextStyle;
  prefix?: string; // e.g. "#" or "$"
  suffix?: string; // e.g. "pts" or "%"
  decimals?: number; // decimal places, default 0
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnimatedNumber({
  value,
  duration = 800,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplay(current);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
      }
    }

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [value, duration]);

  const formatted = `${prefix}${display.toFixed(decimals)}${suffix}`;

  return <Text style={{ ...defaultStyle, ...style }}>{formatted}</Text>;
}

// ---------------------------------------------------------------------------
// Default style
// ---------------------------------------------------------------------------

const defaultStyle: TextStyle = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
  color: colors.textPrimary,
  fontVariant: ['tabular-nums'],
};
