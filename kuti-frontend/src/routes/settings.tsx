import { Card } from "@/components/ui/card";

export function SettingsRoute() {
  return (
    <div className="page-stack">
      <Card>
        <p className="eyebrow">Project Settings</p>
        <h3>Local project preferences scaffold.</h3>
        <p className="muted">
          Generation, export, coherence, versioning, and locale settings will be
          attached here in later phases.
        </p>
      </Card>
    </div>
  );
}
