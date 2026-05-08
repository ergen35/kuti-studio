import type { PropsWithChildren } from "react";

import { cn } from "@/lib/cn";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("card", className)}>{children}</div>;
}
