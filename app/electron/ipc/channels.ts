export const IPC_CHANNELS = {
  settings: {
    get: "settings:get",
    update: "settings:update"
  },
  tasks: {
    listToday: "tasks:listToday",
    create: "tasks:create",
    update: "tasks:update",
    complete: "tasks:complete",
    delete: "tasks:delete"
  },
  pet: {
    getProfile: "pet:getProfile",
    applyCommand: "pet:applyCommand"
  },
  games: {
    createRecord: "games:createRecord",
    listRecent: "games:listRecent"
  },
  events: {
    create: "events:create",
    listRecent: "events:listRecent"
  },
  windows: {
    openPanel: "windows:openPanel",
    setPetAlwaysOnTop: "windows:setPetAlwaysOnTop"
  }
} as const;

