import { useCallback, useState } from "react";
import type { PetState } from "../../shared/types";
import type { BubbleActionLabel } from "../../features/visual-copy";
import { PetAvatar } from "./PetAvatar";
import { PetBubble } from "./PetBubble";
import { PetQuickMenu } from "./PetQuickMenu";
import { PetStats } from "./PetStats";
import "./PetView.css";

const PET_STATE_LABELS: Record<PetState, string> = {
  idle: "安静陪伴中",
  happy: "活力陪伴中",
  care: "关心你",
  tired: "陪你慢下来",
  celebrate: "为你庆祝",
  sleep: "等你回来"
};

export type PetViewProps = {
  state: PetState;
  message?: string;
  bubbleActions?: BubbleActionLabel;
  affinity: number;
  energy: number;
  onClickPet: () => void;
  onOpenTasks: () => void;
  onOpenGame: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  onDismissBubble?: () => void;
  onBubblePrimaryAction?: () => void;
  onBubbleSecondaryAction?: () => void;
};

export function PetView({
  state,
  message,
  bubbleActions,
  affinity,
  energy,
  onClickPet,
  onOpenTasks,
  onOpenGame,
  onOpenChat,
  onOpenSettings,
  onDismissBubble,
  onBubblePrimaryAction,
  onBubbleSecondaryAction
}: PetViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClickPet = useCallback(() => {
    onClickPet();
    setMenuOpen((open) => !open);
  }, [onClickPet]);

  const stateLabel = PET_STATE_LABELS[state];

  return (
    <section className="pet-companion" aria-label={`桌宠：${stateLabel}`}>
      <PetBubble
        message={message}
        actions={bubbleActions}
        onDismiss={onDismissBubble ?? (() => undefined)}
        onPrimaryAction={onBubblePrimaryAction}
        onSecondaryAction={onBubbleSecondaryAction}
      />
      <PetAvatar state={state} label={`打开宠物快捷菜单，当前${stateLabel}`} onClick={handleClickPet} />
      <PetStats affinity={affinity} energy={energy} />
      <PetQuickMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenTasks={onOpenTasks}
        onOpenGame={onOpenGame}
        onOpenChat={onOpenChat}
        onOpenSettings={onOpenSettings}
      />
    </section>
  );
}
