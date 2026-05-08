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
import { StoryHubRoute } from "@/routes/story-hub";
import { StoryTomesRoute } from "@/routes/story-tomes";
import { StoryChaptersRoute } from "@/routes/story-chapters";
import { StoryScenesRoute } from "@/routes/story-scenes";
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
      { path: "projects/:projectId/story", Component: StoryHubRoute },
      { path: "projects/:projectId/story/tomes", Component: StoryTomesRoute },
      { path: "projects/:projectId/story/chapters", Component: StoryChaptersRoute },
      { path: "projects/:projectId/story/scenes", Component: StoryScenesRoute },
      { path: "projects/:projectId/settings", Component: SettingsRoute },
    ],
  },
]);
