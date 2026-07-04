import type { PetState } from "../../shared/types";

type PetAvatarProps = {
  state: PetState;
  label: string;
  onClick: () => void;
};

export function PetAvatar({ state, label, onClick }: PetAvatarProps) {
  return (
    <button className="pet-avatar-button" type="button" data-state={state} aria-label={label} onClick={onClick}>
      <span className="pet-avatar" aria-hidden="true">
        <span className="pet-face">
          <span className="pet-eye pet-eye-left" />
          <span className="pet-eye pet-eye-right" />
          <span className="pet-mouth" />
          <span className="pet-cheek pet-cheek-left" />
          <span className="pet-cheek pet-cheek-right" />
        </span>
        <span className="pet-accessory pet-accessory-cup" />
        <span className="pet-accessory pet-sleep-mark">Z</span>
        <span className="pet-accessory pet-particle pet-particle-one" />
        <span className="pet-accessory pet-particle pet-particle-two" />
        <span className="pet-accessory pet-particle pet-particle-three" />
      </span>
    </button>
  );
}
