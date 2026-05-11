import type { ReactNode } from "react";

import { OverlayPanel } from "@/components/ui/overlay-panel";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
};

export function Modal(props: ModalProps) {
  return <OverlayPanel {...props} variant="modal" />;
}
