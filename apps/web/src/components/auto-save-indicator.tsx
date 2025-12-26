/**
 * Auto-Save Indicator
 *
 * Rationale: Provides real-time feedback that the plan was auto-saved as a draft.
 * Uses micro-animations and a subtle pulse to draw attention without being intrusive.
 * The design emphasizes trust and reliability.
 */

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Cloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoSaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  draftKey?: string;
  className?: string;
}

export function AutoSaveIndicator({ status, draftKey, className }: AutoSaveIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
            "border backdrop-blur-sm transition-all",
            {
              "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300":
                status === "saving",
              "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300":
                status === "saved",
              "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300": status === "error",
            },
            className,
          )}
        >
          {status === "saving" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Auto-saving draft...</span>
            </>
          )}

          {status === "saved" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
              </motion.div>
              <span className="flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5" />
                Auto-saved as draft
              </span>
              {draftKey && (
                <span className="text-xs opacity-60 font-mono">{draftKey.slice(-8)}</span>
              )}
            </>
          )}

          {status === "error" && (
            <>
              <X className="h-4 w-4" />
              <span>Failed to save draft</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact version for inline use
 */
export function AutoSaveIndicatorCompact({ status }: Pick<AutoSaveIndicatorProps, "status">) {
  if (status === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="inline-flex items-center gap-1.5 text-xs text-foreground"
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
    </motion.div>
  );
}
