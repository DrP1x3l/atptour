import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../store/useStore";

export function Toast() {
  const toast = useStore((s) => s.toast);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.msg}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg backdrop-blur ${
            toast.kind === "ok"
              ? "bg-green/90 text-bg"
              : "bg-red/90 text-white"
          }`}
          role="status"
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
