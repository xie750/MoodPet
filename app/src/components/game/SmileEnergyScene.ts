import Phaser from "phaser";
import type { SmileEnergySnapshot } from "../../features/games/smile-energy";

export class SmileEnergyScene extends Phaser.Scene {
  private energyArc!: Phaser.GameObjects.Arc;
  private petCore!: Phaser.GameObjects.Arc;
  private petFace!: Phaser.GameObjects.Arc;
  private messageText!: Phaser.GameObjects.Text;
  private particles: Phaser.GameObjects.Arc[] = [];
  private snapshot: SmileEnergySnapshot | null = null;

  public constructor() {
    super("SmileEnergyScene");
  }

  public create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0xf7faf8, 1);
    this.add.circle(width / 2, height / 2 + 10, 92, 0xeef8f4, 1);
    this.energyArc = this.add.circle(width / 2, height / 2 + 10, 76, 0xf4b95f, 0.18);
    this.petCore = this.add.circle(width / 2, height / 2 + 10, 48, 0xffffff, 1);
    this.petCore.setStrokeStyle(3, 0x55bfa3, 1);
    this.petFace = this.add.circle(width / 2, height / 2 + 24, 18, 0x1f2a2e, 1);
    this.petFace.setScale(1, 0.28);

    for (let index = 0; index < 14; index += 1) {
      const particle = this.add.circle(width / 2, height / 2 + 10, 4, 0xf4b95f, 0.68);
      this.particles.push(particle);
    }

    this.messageText = this.add.text(width / 2, height - 28, "慢慢来，有一点点就很好。", {
      color: "#5E6B70",
      fontFamily: '"Microsoft YaHei UI", "Microsoft YaHei", sans-serif',
      fontSize: "13px"
    });
    this.messageText.setOrigin(0.5);
  }

  public override update(_time: number, delta: number): void {
    const snapshot = this.snapshot;
    if (!snapshot) return;

    const progress = snapshot.targetEnergy > 0 ? snapshot.energy / snapshot.targetEnergy : 0;
    const smileBoost = 1 + snapshot.smileScore * 0.18;
    const paused = snapshot.state === "paused";

    this.energyArc.setScale(0.72 + progress * 0.42);
    this.energyArc.setAlpha(paused ? 0.12 : 0.16 + progress * 0.2);
    this.petCore.setScale(paused ? 0.94 : smileBoost);
    this.petCore.setFillStyle(snapshot.result === "success" ? 0xfff7e8 : 0xffffff, 1);
    this.petFace.setScale(1 + snapshot.smileScore * 0.24, 0.24 + snapshot.smileScore * 0.38);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 + 10;
    const spin = this.time.now / (paused ? 1_800 : 900);

    this.particles.forEach((particle, index) => {
      const angle = spin + (Math.PI * 2 * index) / this.particles.length;
      const orbit = 62 + progress * 28 + Math.sin(this.time.now / 380 + index) * 5;
      const drift = (delta / 16.67) * snapshot.smileScore;
      particle.setPosition(centerX + Math.cos(angle) * (orbit - drift), centerY + Math.sin(angle) * orbit);
      particle.setAlpha(paused ? 0.18 : 0.28 + snapshot.smileScore * 0.54);
      particle.setScale(0.75 + snapshot.smileScore * 0.75);
    });

    if (paused) {
      this.messageText.setText("我先等一下。");
    } else if (snapshot.smileScore >= 0.65) {
      this.messageText.setText("能量正在快快回来。");
    } else {
      this.messageText.setText("慢慢来，有一点点就很好。");
    }
  }

  public setSnapshot(snapshot: SmileEnergySnapshot): void {
    this.snapshot = snapshot;
  }
}
