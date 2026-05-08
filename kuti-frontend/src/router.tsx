import { createBrowserRouter } from "react-router";

import { AppShell } from "@/components/layout/app-shell";
import { CharactersRoute } from "@/routes/characters";
import { HomeRoute } from "@/routes/home";
import { ProjectRoute } from "@/routes/project";
import { StoryRoute } from "@/routes/story";
import { SettingsRoute } from "@/routes/settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: HomeRoute },
      { path: "projects/:projectId", Component: ProjectRoute },
      { path: "projects/:projectId/characters", Component: CharactersRoute },
      { path: "projects/:projectId/story", Component: StoryRoute },
      { path: "projects/:projectId/settings", Component: SettingsRoute },
    ],
  },
]);
