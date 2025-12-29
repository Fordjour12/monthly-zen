/**
 * Draft Recovery Banner
 *
 * Rationale: Uses glassmorphism and subtle animations to create a premium,
 * non-intrusive notification that a draft was recovered. The design emphasizes
 * user control with clear, actionable buttons.
 */

import { motion } from "motion/react";
import { Clock, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface DraftRecoveryBannerProps {
  createdAt: string;
  expiresAt: string;
  onView: () => void;
  onDiscard: () => void;
  onDismiss?: () => void;
}

export function DraftRecoveryBanner({
  createdAt,
  expiresAt,
  onView,
  onDiscard,
  onDismiss,
}: DraftRecoveryBannerProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const expiresIn = formatDistanceToNow(new Date(expiresAt), { addSuffix: false });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background backdrop-blur-sm">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 animate-pulse" />

        <div className="relative p-6">
          <div className="flex items-start gap-4">
            {/* Icon with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">Draft Recovered</h3>
                <p className="text-sm text-foreground mt-1">
                  Your unsaved plan from {timeAgo} is ready to continue
                </p>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Expires in {expiresIn}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={onView}
                  size="sm"
                  className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  View Draft
                </Button>
                <Button
                  onClick={onDiscard}
                  variant="outline"
                  size="sm"
                  className="border-destructive/20 text-destructive hover:bg-destructive/10"
                >
                  Discard
                </Button>
              </div>
            </div>

            {/* Dismiss button */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
