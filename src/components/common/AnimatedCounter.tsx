import { animate, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";

type Props = { value: number; suffix?: string; decimals?: number; duration?: number };

export function AnimatedCounter({ value, suffix = "", decimals = 0, duration = 1.1 }: Props) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
