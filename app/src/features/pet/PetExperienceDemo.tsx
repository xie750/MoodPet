import { PetView } from "../../components/pet";
import type { PanelRoute, PetCommand } from "../../shared/types";
import { MOCK_PET_SCENARIOS, MOCK_STATE_COMMANDS } from "./mockPetCommands";
import { usePetController } from "./usePetController";

type PetExperienceDemoProps = {
  onNavigate?: (route: PanelRoute) => void;
};

export function PetExperienceDemo({ onNavigate }: PetExperienceDemoProps) {
  const { runtime, executeCommand, dismissBubble } = usePetController();

  function executeCommands(commands: PetCommand[]) {
    commands.forEach(executeCommand);
  }

  function navigate(route: PanelRoute) {
    onNavigate?.(route);
  }

  return (
    <main className="pet-demo">
      <div className="pet-demo-stage">
        <PetView
          state={runtime.state}
          message={runtime.message}
          affinity={runtime.affinity}
          energy={runtime.energy}
          onClickPet={() => undefined}
          onOpenTasks={() => navigate("tasks")}
          onOpenGame={() => navigate("game")}
          onOpenChat={() => navigate("chat")}
          onOpenSettings={() => navigate("settings")}
          onDismissBubble={dismissBubble}
        />
      </div>

      <section className="pet-demo-controls" aria-label="Mock 宠物命令">
        {MOCK_STATE_COMMANDS.map((item) => (
          <button className="pet-demo-command" key={item.state} type="button" onClick={() => executeCommand(item.command)}>
            {item.label}
          </button>
        ))}
        {MOCK_PET_SCENARIOS.map((scenario) => (
          <button className="pet-demo-command" key={scenario.label} type="button" onClick={() => executeCommands(scenario.commands)}>
            {scenario.label}
          </button>
        ))}
      </section>
    </main>
  );
}
