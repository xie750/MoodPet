import type { BubbleActionLabel } from "../../features/visual-copy";

type PetBubbleProps = {
  message?: string;
  actions?: BubbleActionLabel;
  onDismiss: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
};

export function PetBubble({ message, actions, onDismiss, onPrimaryAction, onSecondaryAction }: PetBubbleProps) {
  if (!message) {
    return <div className="pet-view-bubble-slot" aria-hidden="true" />;
  }

  const hasActions = actions?.primary !== undefined || actions?.secondary !== undefined;

  return (
    <div className="pet-view-bubble-slot">
      <section className="pet-bubble-card" role="status" aria-live="polite">
        <div className="pet-bubble-content">
          <p className="pet-bubble-message">{message}</p>
          <button className="pet-bubble-close" type="button" aria-label="关闭气泡" onClick={onDismiss}>
            x
          </button>
        </div>
        {hasActions && (
          <div className="pet-bubble-actions">
            {actions.primary !== undefined && (
              <button className="pet-bubble-action pet-bubble-action-primary" type="button" onClick={onPrimaryAction}>
                {actions.primary}
              </button>
            )}
            {actions.secondary !== undefined && (
              <button className="pet-bubble-action" type="button" onClick={onSecondaryAction ?? onDismiss}>
                {actions.secondary}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
