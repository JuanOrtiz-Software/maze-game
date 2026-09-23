import Phaser from "phaser";

class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create(): void {
        this.add.text(40, 40, "MAZE GAME", {
            fontSize: "32px",
            color: "#ffffff",
        });

        this.add.text(40, 85, "Primer prototipo", {
            fontSize: "18px",
            color: "#aaaaaa",
        });
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    width: 1280,
    height: 720,

    backgroundColor: "#111111",

    parent: "game-container",

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    scene: [GameScene],
};

new Phaser.Game(config);