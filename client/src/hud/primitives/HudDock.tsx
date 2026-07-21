import type { HTMLAttributes, PropsWithChildren } from "react";
import "./primitives.css";

export type HudDockProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

/** Lightweight grouping surface; placement and contents stay with the caller. */
export function HudDock({ className = "", children, ...props }: HudDockProps) {
  const classes = ["hud-dock", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
