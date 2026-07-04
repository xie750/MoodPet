import { useMemo, useState } from "react";
import {
  getBubbleCopyGuide,
  getPetStateLabel,
  getVisualCopyAuditReport,
  getVisualCopyMockSafetySummary,
  getVisualCopyMockScenarios
} from "../../features/visual-copy";
import type { PetState } from "../../shared/types";
import { PetView } from "./PetView";

function noop() {
  return undefined;
}

export function PetVisualMockPreview() {
  const scenarios = useMemo(() => getVisualCopyMockScenarios(), []);
  const safetySummary = useMemo(() => getVisualCopyMockSafetySummary(), []);
  const auditReport = useMemo(() => getVisualCopyAuditReport(), []);
  const [selectedState, setSelectedState] = useState<PetState>("idle");
  const selected = scenarios.find((scenario) => scenario.state === selectedState) ?? scenarios[0];

  if (selected === undefined) {
    return null;
  }

  const selectedCopyGuide = getBubbleCopyGuide(selected.bubble.intent);
  const selectedCopyDetail = auditReport.copyDetails.find((detail) => detail.id === selected.bubble.id);
  const selectedResourceDetail = auditReport.resourceDetails.find((detail) => detail.state === selected.state);

  return (
    <section className="pet-demo" aria-label="视觉资源与文案模块 mock 预览">
      <header className="pet-demo-header">
        <p className="pet-demo-kicker">视觉资源与文案模块</p>
        <h1>{selected.title}</h1>
        <p className="pet-demo-summary">
          {getPetStateLabel(selected.state)} · 资源 {safetySummary.resourceValid}/{safetySummary.resourceTotal} · 文案{" "}
          {safetySummary.safe}/{safetySummary.total} · 气泡 {safetySummary.bubbleFit}/{safetySummary.total} · 验收{" "}
          {safetySummary.passed ? "通过" : "待补"}
        </p>
      </header>

      <div className="pet-demo-stage">
        <PetView
          state={selected.state}
          message={selected.bubble.text}
          bubbleActions={selected.bubble.actions}
          affinity={selected.affinity}
          energy={selected.energy}
          onClickPet={noop}
          onOpenTasks={noop}
          onOpenGame={noop}
          onOpenChat={noop}
          onOpenSettings={noop}
          onDismissBubble={noop}
          onBubblePrimaryAction={noop}
          onBubbleSecondaryAction={noop}
        />
      </div>

      <div className="pet-demo-controls" aria-label="状态预览">
        {scenarios.map((scenario) => (
          <button
            className="pet-demo-command"
            type="button"
            key={scenario.state}
            aria-pressed={selected.state === scenario.state}
            onClick={() => setSelectedState(scenario.state)}
          >
            {scenario.resource.displayName}
          </button>
        ))}
      </div>

      <dl className="pet-demo-checks" aria-label="模块验收检查">
        {auditReport.checks.map((check) => (
          <div className="pet-demo-check" data-passed={check.passed} key={check.id}>
            <dt>{check.label}</dt>
            <dd>{check.detail}</dd>
          </div>
        ))}
      </dl>

      <section className="pet-demo-spec" aria-label="当前状态资源与文案规范">
        <div className="pet-demo-spec-row">
          <span>资源</span>
          <strong>{selected.resource.displayName}</strong>
          <em>{selected.resource.priority}</em>
        </div>
        <p>{selected.resource.description}</p>
        <div className="pet-demo-spec-row">
          <span>文案</span>
          <strong>{selectedCopyGuide.title}</strong>
          <em>{selectedCopyDetail?.fitsBubble === false ? "偏长" : "适配"}</em>
        </div>
        <p>{selectedCopyGuide.purpose}</p>
        {(selectedCopyDetail?.violations.length ?? 0) > 0 || (selectedResourceDetail?.issues.length ?? 0) > 0 ? (
          <ul className="pet-demo-issues">
            {selectedResourceDetail?.issues.map((issue) => <li key={issue}>{issue}</li>)}
            {selectedCopyDetail?.violations.map((violation) => <li key={`${violation.code}-${violation.phrase}`}>{violation.reason}</li>)}
          </ul>
        ) : (
          <p className="pet-demo-ok">当前资源和文案通过 MVP 检查。</p>
        )}
      </section>
    </section>
  );
}
