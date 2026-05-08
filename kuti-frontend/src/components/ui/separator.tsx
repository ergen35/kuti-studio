import { cn } from "@/lib/cn";

type SeparatorProps = {
  className?: string;
};

export function Separator({ className }: SeparatorProps) {
  return <div className={cn("separator", className)} role="separator" aria-orientation="horizontal" />;
}
