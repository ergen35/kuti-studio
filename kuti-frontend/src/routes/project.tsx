import { Card } from "@/components/ui/card";

export function ProjectRoute() {
  return (
    <div className="page-stack">
      <Card>
        <p className="eyebrow">Project Dashboard</p>
        <h3>Foundation placeholder for the active project.</h3>
        <p className="muted">
          The next milestone will wire this route to the project catalog,
          query cache, and dashboard summary tiles.
        </p>
      </Card>
    </div>
  );
}
