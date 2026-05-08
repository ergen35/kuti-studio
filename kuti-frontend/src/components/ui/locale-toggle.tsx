import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui";

export function LocaleToggle() {
  const locale = useUIStore((state) => state.locale);
  const setLocale = useUIStore((state) => state.setLocale);
  const t = useT();
  const next = locale === "en" ? "fr" : "en";

  return (
    <Button variant="ghost" type="button" onClick={() => setLocale(next)}>
      {t("locale")}: {locale.toUpperCase()}
    </Button>
  );
}
