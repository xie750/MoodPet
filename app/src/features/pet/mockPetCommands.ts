import type { PetCommand, PetState } from "../../shared/types";

export type MockPetScenario = {
  label: string;
  commands: PetCommand[];
};

export const MOCK_STATE_COMMANDS: Array<{ label: string; state: PetState; command: PetCommand }> = [
  { label: "待机", state: "idle", command: { type: "set_state", state: "idle", reason: "mock_idle" } },
  { label: "开心", state: "happy", command: { type: "set_state", state: "happy", reason: "mock_happy" } },
  { label: "关心", state: "care", command: { type: "set_state", state: "care", reason: "mock_care" } },
  { label: "慢下来", state: "tired", command: { type: "set_state", state: "tired", reason: "mock_tired" } },
  { label: "庆祝", state: "celebrate", command: { type: "set_state", state: "celebrate", reason: "mock_celebrate" } },
  { label: "睡眠", state: "sleep", command: { type: "set_state", state: "sleep", reason: "mock_sleep" } }
];

export const MOCK_PET_SCENARIOS: MockPetScenario[] = [
  {
    label: "疲惫关心",
    commands: [
      { type: "set_state", state: "care", reason: "mock_tired_care" },
      { type: "show_bubble", message: "你可能坚持有一会儿了，要不要先慢一点？", reason: "mock_tired_care" }
    ]
  },
  {
    label: "任务完成",
    commands: [
      { type: "set_state", state: "celebrate", reason: "mock_task_completed" },
      { type: "show_bubble", message: "完成一个就很棒啦，我记下来啦。", reason: "mock_task_completed" },
      { type: "add_affinity", amount: 6, reason: "mock_task_completed" }
    ]
  },
  {
    label: "游戏成功",
    commands: [
      { type: "set_state", state: "happy", reason: "mock_game_success" },
      { type: "show_bubble", message: "能量补回来啦，我们慢慢继续。", reason: "mock_game_success" },
      { type: "add_energy", amount: 10, reason: "mock_game_success" }
    ]
  },
  {
    label: "用户离开",
    commands: [
      { type: "set_state", state: "sleep", reason: "mock_away" },
      { type: "show_bubble", message: "我先在这里等你。", reason: "mock_away" }
    ]
  }
];
