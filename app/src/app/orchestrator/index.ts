import type { AppEvent, PetCommand } from "../../shared/types";

export function eventToPetCommands(event: AppEvent): PetCommand[] {
  if (event.type === "task_completed") {
    return [
      { type: "set_state", state: "celebrate", reason: "task_completed" },
      { type: "add_affinity", amount: 1, reason: "task_completed" }
    ];
  }

  if (event.type === "game_finished" && event.payload.result === "success") {
    return [
      { type: "set_state", state: "happy", reason: "game_success" },
      { type: "add_energy", amount: 12, reason: "game_success" }
    ];
  }

  return [];
}

