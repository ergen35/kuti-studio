import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { router } from "@/router";
import { createKutiQueryClient } from "@/lib/query-client";
import { useUIStore } from "@/stores/ui";
import "@/styles/global.css";

const queryClient = createKutiQueryClient();

function AppBootstrap() {
  const locale = useUIStore((state) => state.locale);
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  </React.StrictMode>,
);
