import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui";

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const t = useT();

  return (
    <Button variant="secondary" onClick={toggleTheme} type="button">
      {t("theme")}: {theme}
    </Button>
  );
}
