import { Animated, Easing } from 'react-native';

const SMOOTH_BEZIER = Easing.bezier(0.25, 0.1, 0.25, 1);
const BOUNCE_BEZIER = Easing.bezier(0.175, 0.885, 0.32, 1.275);

/**
 * Fade in from 0 to 1.
 */
export function fadeIn(
  value: Animated.Value,
  duration: number = 300,
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: SMOOTH_BEZIER,
    useNativeDriver: true,
  });
}

/**
 * Fade out from current value to 0.
 */
export function fadeOut(
  value: Animated.Value,
  duration: number = 300,
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: SMOOTH_BEZIER,
    useNativeDriver: true,
  });
}

/**
 * Slide up from a given distance below to 0 (resting position).
 */
export function slideUp(
  value: Animated.Value,
  distance: number = 50,
  duration: number = 350,
): Animated.CompositeAnimation {
  value.setValue(distance);
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: BOUNCE_BEZIER,
    useNativeDriver: true,
  });
}

/**
 * Scale bounce: 1 -> 1.15 -> 1 with an elastic feel.
 */
export function scaleBounce(
  value: Animated.Value,
): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1.15,
      duration: 150,
      easing: SMOOTH_BEZIER,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 200,
      easing: BOUNCE_BEZIER,
      useNativeDriver: true,
    }),
  ]);
}

/**
 * Continuous pulse between min and max opacity. Loops forever.
 */
export function pulse(
  value: Animated.Value,
  minOpacity: number = 0.4,
  maxOpacity: number = 1,
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: minOpacity,
        duration: 800,
        easing: SMOOTH_BEZIER,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: maxOpacity,
        duration: 800,
        easing: SMOOTH_BEZIER,
        useNativeDriver: true,
      }),
    ]),
  );
}

/**
 * Stagger a list of Animated.Values from 0 to 1 with a delay between each.
 */
export function staggeredFadeIn(
  values: Animated.Value[],
  staggerMs: number = 80,
): Animated.CompositeAnimation {
  return Animated.stagger(
    staggerMs,
    values.map((v) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 300,
        easing: SMOOTH_BEZIER,
        useNativeDriver: true,
      }),
    ),
  );
}

/**
 * Card flip animation for grid cells.
 * Animates 0 -> 0.5 (first half) then 0.5 -> 1 (second half).
 */
export function flipCard(
  animatedValue: Animated.Value,
  duration: number = 300,
): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 0.5,
      duration: duration / 2,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration / 2,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
  ]);
}

/**
 * Rolling number animation for score counters.
 * useNativeDriver: false is required for text value interpolation.
 */
export function rollNumber(
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 800,
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: false,
  });
}

/**
 * Glow pulse for rarity effects. Loops between 0.3 and 1 opacity.
 */
export function glowPulse(
  animatedValue: Animated.Value,
  duration: number = 1500,
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(animatedValue, {
        toValue: 0.3,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]),
  );
}

/**
 * Celebration burst: scale 1 -> 1.3 -> 1 with a springy feel.
 */
export function celebrationBurst(
  animatedValue: Animated.Value,
): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.3,
      duration: 200,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
  ]);
}
