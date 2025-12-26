/**
 * Plan Action Bar
 *
 * Rationale: A premium, floating action bar that provides clear CTAs for draft management.
 * Uses glassmorphism, subtle shadows, and micro-interactions to create a modern,
 * app-like experience. The design emphasizes the primary action (Save) while keeping
 * secondary actions accessible.
 */

import { motion } from "motion/react";
import { Save, Trash2, RefreshCw, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PlanActionBarProps {
  onSave: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
  onViewFull?: () => void;
  isSaving?: boolean;
  expiresAt?: string;
  className?: string;
}

export function PlanActionBar({
  onSave,
  onDiscard,
  onRegenerate,
  onViewFull,
  isSaving = false,
  expiresAt,
  className,
}: PlanActionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("fixed bottom-8 left-1/2 -translate-x-1/2 z-50", className)}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-2xl opacity-50" />

        {/* Main bar */}
        <div className="relative rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between gap-3 p-4">
            {/* Left: Expiration info */}
            <div className="flex items-center gap-2 text-xs text-foreground">
              {expiresAt && (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Expires {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
                  </span>
                </>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Secondary actions */}
              <div className="flex items-center gap-1.5">
                {onViewFull && (
                  <Button variant="ghost" size="sm" onClick={onViewFull} className="h-9">
                    <Eye className="mr-2 h-4 w-4" />
                    View Full
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={onRegenerate} className="h-9">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDiscard}
                  className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Discard
                </Button>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-border" />

              {/* Primary action */}
              <Button
                onClick={onSave}
                disabled={isSaving}
                size="sm"
                className={cn(
                  "h-9 px-6 shadow-lg shadow-primary/20",
                  "hover:shadow-xl hover:shadow-primary/30 transition-all",
                  "bg-gradient-to-r from-primary to-primary/90",
                )}
              >
                {isSaving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                    </motion.div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Compact version for mobile
 */
export function PlanActionBarCompact({
  onSave,
  onDiscard,
  onRegenerate,
  isSaving = false,
}: Pick<PlanActionBarProps, "onSave" | "onDiscard" | "onRegenerate" | "isSaving">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg p-4"
    >
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={isSaving} className="flex-1 shadow-lg">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>

        <Button variant="outline" size="icon" onClick={onRegenerate}>
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="icon" onClick={onDiscard} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
