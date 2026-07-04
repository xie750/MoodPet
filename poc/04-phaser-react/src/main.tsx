import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Phaser from "phaser";
import { SmileEnergyScene } from "./smile-energy-scene";
import "./styles.css";

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [smileScore, setSmileScore] = useState(0.4);
  const [result, setResult] = useState("playing");

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 640,
      height: 360,
      backgroundColor: "#eef7f6",
      scene: [SmileEnergyScene]
    });

    game.events.on("smile-energy:finished", (payload) => {
      setResult(`${payload.result} score=${payload.score}`);
    });

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.registry.set("smileScore", smileScore);
  }, [smileScore]);

  return (
    <main>
      <h1>Smile Energy PoC</h1>
      <section className="toolbar">
        <label>
          smileScore {smileScore.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={smileScore}
            onChange={(event) => setSmileScore(Number(event.target.value))}
          />
        </label>
        <strong>{result}</strong>
      </section>
      <div className="game" ref={containerRef} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

