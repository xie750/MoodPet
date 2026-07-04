import { useEffect, useRef } from "react";

type PetQuickMenuProps = {
  open: boolean;
  onClose: () => void;
  onOpenTasks: () => void;
  onOpenGame: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
};

type PetMenuItem = {
  label: string;
  icon: "tasks" | "game" | "chat" | "settings";
  onSelect: () => void;
};

function MenuIcon({ icon }: { icon: PetMenuItem["icon"] }) {
  if (icon === "tasks") {
    return (
      <svg className="pet-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 7h10M8 12h10M8 17h10M4.5 7h.01M4.5 12h.01M4.5 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "game") {
    return (
      <svg className="pet-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 13h8M10 10v6M17 9l1 1M19.5 13.5l.01.01M7 18h10a4 4 0 0 0 3.9-4.9l-.8-3.4A4 4 0 0 0 16.2 6H7.8a4 4 0 0 0-3.9 3.7l-.8 3.4A4 4 0 0 0 7 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "chat") {
    return (
      <svg className="pet-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 18.5 4 21v-4.5A7.5 7.5 0 0 1 5.8 5.8a9.2 9.2 0 0 1 12.4 0 7.5 7.5 0 0 1 0 10.7A8.6 8.6 0 0 1 12 19H7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg className="pet-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19 12a7.4 7.4 0 0 0-.1-1.1l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-1.9-1.1L14.3 3h-4.1l-.4 2.8a7.8 7.8 0 0 0-1.9 1.1l-2.4-1-2 3.5 2 1.5a7.4 7.4 0 0 0 0 2.2l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 1.9 1.1l.4 2.8h4.1l.4-2.8a7.8 7.8 0 0 0 1.9-1.1l2.4 1 2-3.5-2-1.5c.1-.4.1-.7.1-1.1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function PetQuickMenu({ open, onClose, onOpenTasks, onOpenGame, onOpenChat, onOpenSettings }: PetQuickMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const items: PetMenuItem[] = [
    { label: "今日任务", icon: "tasks", onSelect: onOpenTasks },
    { label: "陪我玩", icon: "game", onSelect: onOpenGame },
    { label: "和我聊天", icon: "chat", onSelect: onOpenChat },
    { label: "设置", icon: "settings", onSelect: onOpenSettings }
  ];

  useEffect(() => {
    if (!open) return;

    itemRefs.current[0]?.focus();

    function handleDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      event.preventDefault();
      const activeIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = activeIndex < 0 ? 0 : (activeIndex + direction + items.length) % items.length;
      itemRefs.current[nextIndex]?.focus();
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [items.length, onClose, open]);

  if (!open) return null;

  return (
    <div className="pet-menu" ref={menuRef} role="menu" aria-label="宠物快捷菜单">
      {items.map((item, index) => (
        <button
          className="pet-menu-item"
          key={item.label}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          type="button"
          role="menuitem"
          onClick={() => {
            item.onSelect();
            onClose();
          }}
        >
          <MenuIcon icon={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
