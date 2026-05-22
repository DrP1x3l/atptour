// Swipe-to-delete (verso sinistra) con framer-motion.
// Oltre -SWIPE_TRIGGER al rilascio => trigger onDelete con haptic.

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { haptic } from "../lib/haptic";

const SWIPE_TRIGGER = -100;
const SWIPE_OPEN = -80;

interface Props {
  onDelete: () => void;
  children: ReactNode;
}

export function SwipeRow({ onDelete, children }: Props) {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [SWIPE_TRIGGER, 0], [1, 0]);
  const haptied = useRef(false);

  useEffect(() => {
    const unsub = x.on("change", (v) => {
      if (v <= SWIPE_TRIGGER && !haptied.current) {
        haptied.current = true;
        haptic("warning");
      }
      if (v > SWIPE_TRIGGER) haptied.current = false;
    });
    return () => unsub();
  }, [x]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div
        className="absolute inset-0 bg-red flex items-center justify-end pr-5 text-white font-bold"
        style={{ opacity: bgOpacity }}
      >
        🗑 Elimina
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x <= SWIPE_TRIGGER) {
            onDelete();
            x.set(0);
          } else if (info.offset.x <= SWIPE_OPEN) {
            x.set(SWIPE_OPEN);
          } else {
            x.set(0);
          }
        }}
        className="relative bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
}
