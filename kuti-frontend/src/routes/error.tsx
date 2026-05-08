import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

import { formatApiError, useLocale, useT } from "@/lib/i18n";

export function RouteError() {
  const error = useRouteError();
  const locale = useLocale();
  const t = useT();

  let message = t("errorUnknown");
  let detail: string | null = null;

  if (isRouteErrorResponse(error)) {
    const data = error.data;
    if (typeof data === "string") {
      message = formatApiError(locale, { code: data, status: error.status });
    } else if (typeof error.statusText === "string" && error.statusText.trim()) {
      message = error.statusText;
    } else {
      message = `${t("errorLabel")}: ${error.status}`;
    }
    detail = typeof data === "string" ? data : null;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="page-stack error-state">
      <div className="card">
        <p className="eyebrow">{t("errorLabel")}</p>
        <h3>{t("routeUnavailable")}</h3>
        <p className="muted">{message}</p>
        {detail ? <p className="muted monospace-block">{detail}</p> : null}
        <Link to="/" className="button button-primary">
          {t("backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
