"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  className?: string;
}

/**
 * Animates the numeric portion of a stat string (e.g. "50+", "100%", "3")
 * counting up from 0 when scrolled into view, preserving any prefix/suffix.
 */
export function AnimatedCounter({
  value,
  duration = 1.2,
  className,
}: AnimatedCounterProps) {
  const match = value.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(match ? "0" : value);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplay(Math.round(latest).toString());
  });

  useEffect(() => {
    if (!isInView || !match) return;
    const target = parseFloat(match[2]);
    const controls = animate(motionValue, target, { duration, ease: "easeOut" });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  if (!match) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  const [, prefix, , suffix] = match;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
