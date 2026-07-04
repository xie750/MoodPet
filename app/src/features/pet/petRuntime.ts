import type { PetCommand, PetState } from "../../shared/types";

export type PetRuntimeState = {
  state: PetState;
  message?: string;
  affinity: number;
  energy: number;
  lastReason?: string;
};

export const DEFAULT_PET_RUNTIME: PetRuntimeState = {
  state: "idle",
  affinity: 18,
  energy: 72
};

function clampGrowthValue(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function petRuntimeReducer(current: PetRuntimeState, command: PetCommand): PetRuntimeState {
  if (command.type === "set_state") {
    return {
      ...current,
      state: command.state,
      lastReason: command.reason
    };
  }

  if (command.type === "show_bubble") {
    return {
      ...current,
      message: command.message,
      lastReason: command.reason
    };
  }

  if (command.type === "add_affinity") {
    return {
      ...current,
      affinity: clampGrowthValue(current.affinity + command.amount),
      lastReason: command.reason
    };
  }

  return {
    ...current,
    energy: clampGrowthValue(current.energy + command.amount),
    lastReason: command.reason
  };
}

export function clearPetBubble(current: PetRuntimeState): PetRuntimeState {
  if (!current.message) return current;

  const { message: _message, ...next } = current;
  return next;
}
