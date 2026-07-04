import { useCallback, useEffect, useReducer } from "react";
import type { PetCommand } from "../../shared/types";
import { DEFAULT_PET_RUNTIME, clearPetBubble, petRuntimeReducer, type PetRuntimeState } from "./petRuntime";

type PetRuntimeAction =
  | {
      type: "execute_command";
      command: PetCommand;
    }
  | {
      type: "dismiss_bubble";
    };

function reducer(state: PetRuntimeState, action: PetRuntimeAction): PetRuntimeState {
  if (action.type === "dismiss_bubble") {
    return clearPetBubble(state);
  }

  return petRuntimeReducer(state, action.command);
}

export function usePetController(initialState: PetRuntimeState = DEFAULT_PET_RUNTIME) {
  const [runtime, dispatch] = useReducer(reducer, initialState);

  const executeCommand = useCallback((command: PetCommand) => {
    dispatch({ type: "execute_command", command });
  }, []);

  const dismissBubble = useCallback(() => {
    dispatch({ type: "dismiss_bubble" });
  }, []);

  useEffect(() => {
    if (!runtime.message) return;

    const timeoutId = window.setTimeout(() => {
      dismissBubble();
    }, 5200);

    return () => window.clearTimeout(timeoutId);
  }, [dismissBubble, runtime.message]);

  return {
    runtime,
    executeCommand,
    dismissBubble
  };
}
