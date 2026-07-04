type PetStatsProps = {
  affinity: number;
  energy: number;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function PetStats({ affinity, energy }: PetStatsProps) {
  const energyPercent = clampPercent(energy);
  const affinityPercent = clampPercent(affinity);

  return (
    <section className="pet-stats" aria-label="宠物成长数据">
      <div className="pet-stat-row">
        <span>能量</span>
        <span className="pet-meter" aria-hidden="true">
          <span className="pet-meter-fill" style={{ width: `${energyPercent}%` }} />
        </span>
        <span className="pet-stat-value">{energyPercent}</span>
      </div>
      <div className="pet-stat-row">
        <span>亲密</span>
        <span className="pet-meter" aria-hidden="true">
          <span className="pet-meter-fill pet-meter-fill-affinity" style={{ width: `${affinityPercent}%` }} />
        </span>
        <span className="pet-stat-value">{affinityPercent}</span>
      </div>
    </section>
  );
}
