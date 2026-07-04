import type { UserState } from "../../../shared/types";
import type { SmileGameConfig } from "./types";

export const SMILE_GAME_BASE_RATE = 1.5;
export const SMILE_GAME_SIGNAL_GRACE_MS = 5_000;

export const SMILE_GAME_CONFIG_BY_STATE: Record<UserState, SmileGameConfig> = {
  happy: {
    targetEnergy: 100,
    maxSeconds: 45,
    energyMultiplier: 1.2,
    rewardEnergy: 12,
    rewardText: "宠物能量 +12"
  },
  calm: {
    targetEnergy: 100,
    maxSeconds: 60,
    energyMultiplier: 1,
    rewardEnergy: 8,
    rewardText: "宠物能量 +8"
  },
  tired: {
    targetEnergy: 70,
    maxSeconds: 45,
    energyMultiplier: 1.1,
    rewardEnergy: 8,
    rewardText: "宠物能量 +8"
  },
  away: {
    targetEnergy: 100,
    maxSeconds: 60,
    energyMultiplier: 0,
    rewardEnergy: 0,
    rewardText: "我等你回来"
  }
};

export function getSmileGameConfig(userState: UserState): SmileGameConfig {
  return SMILE_GAME_CONFIG_BY_STATE[userState];
}
