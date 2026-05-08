import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { getConfig, getHealth } from "@/api/client";

export function HomeRoute() {
  const configQuery = useQuery({ queryKey: ["config"], queryFn: getConfig });
  const healthQuery = useQuery({ queryKey: ["health"], queryFn: getHealth });

  return (
    <div className="page-stack">
      <div className="hero">
        <div>
          <p className="eyebrow">Project Hub</p>
          <h3>Open, create, and manage local story projects.</h3>
          <p className="muted max-width">
            The first phase of Kuti Studio establishes the shell, the contract,
            and the project entry point. Projects will appear here once the
            Project Hub data model lands.
          </p>
        </div>
        <div className="hero-card">
          <span className="status-dot" />
          <strong>Local-first workflow</strong>
          <p>FastAPI backend, React Router shell, and portable data storage.</p>
        </div>
      </div>

      <div className="grid-2">
        <Card>
          <p className="eyebrow">Backend status</p>
          <h4>{healthQuery.data?.status ?? "checking..."}</h4>
          <p className="muted">
            {healthQuery.isError
              ? "Backend not reachable yet. Start kuti-backend on port 8000."
              : healthQuery.data
                ? `${healthQuery.data.service} v${healthQuery.data.version}`
                : "Querying the local API..."}
          </p>
        </Card>
        <Card>
          <p className="eyebrow">Runtime config</p>
          <h4>{configQuery.data?.environment ?? "loading..."}</h4>
          <p className="muted">
            {configQuery.data
              ? `Data root: ${configQuery.data.dataDir}`
              : "The frontend will consume the exported backend contract."}
          </p>
        </Card>
      </div>
    </div>
  );
}
