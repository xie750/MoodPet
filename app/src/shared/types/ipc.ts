import type { PanelRoute, PetState } from "./domain";

export type IpcResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

export type PetCommand =
  | {
      type: "set_state";
      state: PetState;
      reason?: string;
    }
  | {
      type: "show_bubble";
      message: string;
      reason?: string;
      cooldownKey?: string;
    }
  | {
      type: "add_affinity";
      amount: number;
      reason?: string;
    }
  | {
      type: "add_energy";
      amount: number;
      reason?: string;
    };

export type NavigationCommand = {
  type: "open_panel";
  route: PanelRoute;
};

