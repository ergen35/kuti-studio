import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { router } from "@/router";
import { useUIStore } from "@/stores/ui";
import "@/styles/global.css";

const queryClient = new QueryClient();

function AppBootstrap() {
  const locale = useUIStore((state) => state.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  </React.StrictMode>,
);
