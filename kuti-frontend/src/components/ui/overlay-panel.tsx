import type { ReactNode } from "react";

import { createPortal } from "react-dom";
import { useEffect, useId } from "react";

import { cn } from "@/lib/cn";

type OverlayPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "modal" | "sheet";
  size?: "sm" | "md" | "lg" | "xl";
};

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        document.body.style.overflow = previous;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);
}

export function OverlayPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = "modal",
  size = "lg",
}: OverlayPanelProps) {
  const titleId = useId();
  const descId = useId();

  useLockBody(open);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const panelClass = cn(
    variant === "sheet" ? "sheet-panel" : "modal-panel",
    size && variant === "modal" ? `modal-${size}` : undefined,
  );

  return createPortal(
    <div className={cn("overlay-root", variant === "sheet" && "is-sheet")}>
      <button type="button" className="overlay-backdrop" aria-label={`Close ${title}`} onClick={() => onOpenChange(false)} />
      <section className={panelClass} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined}>
        <header className="overlay-header">
          <div>
            <p className="eyebrow">Workspace form</p>
            <h3 id={titleId}>{title}</h3>
            {description ? <p className="muted" id={descId}>{description}</p> : null}
          </div>
          <button type="button" className="button button-ghost overlay-close" onClick={() => onOpenChange(false)}>
            Close
          </button>
        </header>
        <div className="overlay-body">{children}</div>
        {footer ? <footer className="overlay-footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}
