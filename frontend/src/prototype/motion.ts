import type { Variants } from 'framer-motion';

export const springSoft = { type: 'spring' as const, stiffness: 240, damping: 24, mass: 0.8 };
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const reveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } }
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.085, delayChildren: 0.06 } }
};

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springSoft }
};
