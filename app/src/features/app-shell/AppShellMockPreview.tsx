import { AppShellView } from "../../components/app-shell/AppShellView";
import { useAppShellController } from "./useAppShellController";

export function AppShellMockPreview() {
  const controller = useAppShellController({
    mode: "mock"
  });

  return <AppShellView controller={controller} />;
}
