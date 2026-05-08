import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui";

export function LocaleToggle() {
  const locale = useUIStore((state) => state.locale);
  const setLocale = useUIStore((state) => state.setLocale);
  const next = locale === "en" ? "fr" : "en";

  return (
    <Button variant="ghost" type="button" onClick={() => setLocale(next)}>
      Locale: {locale.toUpperCase()}
    </Button>
  );
}
