import Phaser from "phaser";

export class SmileEnergyScene extends Phaser.Scene {
  private energy = 0;
  private elapsed = 0;
  private bar!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private done = false;

  constructor() {
    super("SmileEnergyScene");
  }

  create() {
    this.energy = 0;
    this.elapsed = 0;
    this.done = false;
    this.registry.set("smileScore", 0.4);

    this.add.text(32, 28, "Smile Energy", {
      fontFamily: "Segoe UI",
      fontSize: "28px",
      color: "#243238"
    });

    this.add.rectangle(320, 180, 520, 44, 0xffffff).setStrokeStyle(2, 0x8bd3dd);
    this.bar = this.add.rectangle(60, 180, 0, 36, 0x247b7b).setOrigin(0, 0.5);
    this.label = this.add.text(32, 250, "energy 0", {
      fontFamily: "Segoe UI",
      fontSize: "18px",
      color: "#243238"
    });
  }

  update(_time: number, delta: number) {
    if (this.done) {
      return;
    }

    const smileScore = Number(this.registry.get("smileScore") ?? 0);
    const seconds = delta / 1000;
    const baseRate = 18;
    this.elapsed += seconds;
    this.energy += baseRate * (0.5 + smileScore) * seconds;

    const progress = Phaser.Math.Clamp(this.energy / 100, 0, 1);
    this.bar.width = 520 * progress;
    this.label.setText(
      `energy ${Math.round(this.energy)} | smile ${smileScore.toFixed(2)} | ${this.elapsed.toFixed(1)}s`
    );

    if (this.energy >= 100) {
      this.done = true;
      this.add.text(250, 292, "success", {
        fontFamily: "Segoe UI",
        fontSize: "24px",
        color: "#247b7b"
      });
      this.game.events.emit("smile-energy:finished", {
        result: "success",
        score: Math.round(this.energy),
        duration: Math.round(this.elapsed)
      });
    }
  }
}

