import type { HTMLAttributes, PropsWithChildren } from "react";
import "./primitives.css";

export type HudPanelProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

/** Material presentation shell. Content and layout remain owned by the caller. */
export function HudPanel({ className = "", children, ...props }: HudPanelProps) {
  const classes = ["hud-panel", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
