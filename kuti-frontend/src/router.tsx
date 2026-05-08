import { createBrowserRouter } from "react-router";

import { AppShell } from "@/components/layout/app-shell";
import { CharactersRoute } from "@/routes/characters";
import { AssetsRoute } from "@/routes/assets";
import { GenerationRoute } from "@/routes/generation";
import { ExportsRoute } from "@/routes/exports";
import { HomeRoute } from "@/routes/home";
import { ProjectRoute } from "@/routes/project";
import { VersionsRoute } from "@/routes/versions";
import { WarningsRoute } from "@/routes/warnings";
import { StoryRoute } from "@/routes/story";
import { SettingsRoute } from "@/routes/settings";
import { RouteError } from "@/routes/error";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    errorElement: <RouteError />,
    children: [
      { index: true, Component: HomeRoute },
      { path: "projects/:projectId", Component: ProjectRoute },
      { path: "projects/:projectId/assets", Component: AssetsRoute },
      { path: "projects/:projectId/characters", Component: CharactersRoute },
      { path: "projects/:projectId/generation", Component: GenerationRoute },
      { path: "projects/:projectId/exports", Component: ExportsRoute },
      { path: "projects/:projectId/versions", Component: VersionsRoute },
      { path: "projects/:projectId/warnings", Component: WarningsRoute },
      { path: "projects/:projectId/story", Component: StoryRoute },
      { path: "projects/:projectId/settings", Component: SettingsRoute },
    ],
  },
]);
