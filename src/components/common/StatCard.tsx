import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { AnimatedCounter } from "./AnimatedCounter";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Tone = "primary" | "info" | "warning" | "success";

const toneStyles: Record<Tone, { icon: string; bar: string }> = {
  primary: { icon: "bg-primary/15 text-primary", bar: "[&>div]:bg-primary" },
  info: { icon: "bg-info/15 text-info", bar: "[&>div]:bg-info" },
  warning: { icon: "bg-warning/15 text-warning", bar: "[&>div]:bg-warning" },
  success: { icon: "bg-success/15 text-success", bar: "[&>div]:bg-success" },
};

type Props = {
  label: string;
  value: number;
  suffix?: string;
  caption: string;
  progress?: number;
  icon: LucideIcon;
  tone?: Tone;
  index?: number;
};

export function StatCard({
  label,
  value,
  suffix = "",
  caption,
  progress,
  icon: Icon,
  tone = "primary",
  index = 0,
}: Props) {
  const styles = toneStyles[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel hover-lift rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-10 place-items-center rounded-xl", styles.icon)}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      {progress !== undefined && (
        <Progress value={progress} className={cn("mt-4 h-1.5", styles.bar)} />
      )}
    </motion.div>
  );
}
