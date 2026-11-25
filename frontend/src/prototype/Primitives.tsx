import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { easeOut, pop, springSoft, stagger } from './motion';

type GlassCardProps = PropsWithChildren<{ className?: string }>;
export function GlassCard({ children, className = '' }: GlassCardProps) {
  return <div className={`glass-card ${className}`}>{children}</div>;
}

type TiltCardProps = PropsWithChildren<{ className?: string; onClick?: () => void; layoutId?: string }>;
export function TiltCard({ children, className = '', onClick, layoutId }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), springSoft);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), springSoft);
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const move = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
  };
  const reset = () => { mx.set(0); my.set(0); };
  return (
    <motion.div ref={ref} layoutId={layoutId} className={`tilt-card ${className}`} style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} onMouseMove={move} onMouseLeave={reset} onClick={onClick}>
      <span className="card-shine" aria-hidden="true" />{children}
    </motion.div>
  );
}

export function AnimatedGauge({ score, label }: { score: number; label: string }) {
  const radius = 49;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 75 ? '#00a982' : score >= 55 ? '#e2a230' : '#e35c61';
  return (
    <div className="gauge-wrap" role="img" aria-label={`${score} out of 100, ${label}`}>
      <svg className="gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="gauge-track" />
        <motion.circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" transform="rotate(-90 60 60)"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - score / 100) }} transition={{ duration: 1.25, ease: easeOut }} />
      </svg>
      <motion.div className="gauge-center" key={score} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springSoft}>
        <motion.strong initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>{score}</motion.strong>
        <span>/ 100</span>
      </motion.div>
    </div>
  );
}

export function ScanLoader({ lowData = false }: { lowData?: boolean }) {
  const messages = lowData ? ['Gathering the few reviews available…', 'Looking for a useful signal…'] : ['Reading 240 reviews…', 'Matching your needs…', 'Weighing real-world feedback…'];
  const [message, setMessage] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setMessage((current) => (current + 1) % messages.length), 950);
    return () => window.clearInterval(timer);
  }, [messages.length]);
  return (
    <motion.div className="scan-loader" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
      <div className="scan-icon"><ShieldCheck size={22} /><span className="scan-orbit" /></div>
      <div className="scan-copy"><strong>{messages[message]}</strong><span>ReturnShield AI is reviewing the details</span></div>
      <div className="scan-lines" aria-hidden="true"><i /><i /><i /><b /></div>
    </motion.div>
  );
}

export function StaggerList({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <motion.div className={className} variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
    {Array.isArray(children) ? children.map((child, index) => <motion.div key={index} variants={pop}>{child}</motion.div>) : <motion.div variants={pop}>{children}</motion.div>}
  </motion.div>;
}
