import type { ReactNode } from "react";

import { OverlayPanel } from "@/components/ui/overlay-panel";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Sheet(props: SheetProps) {
  return <OverlayPanel {...props} variant="sheet" size="xl" />;
}
