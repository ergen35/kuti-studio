import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui";

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  return (
    <Button variant="secondary" onClick={toggleTheme} type="button">
      Theme: {theme}
    </Button>
  );
}
