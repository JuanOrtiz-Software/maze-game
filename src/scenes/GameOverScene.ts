import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
    private restartKey?: Phaser.Input.Keyboard.Key;
    private restartRequested = false;

    constructor() {
        super("GameOverScene");
    }

    create(): void {
        this.restartRequested = false;

        console.log("GameOverScene initialized");

        // Fondo
        const background = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            "gameOver4"
        );

        background.setDisplaySize(
            this.scale.width,
            this.scale.height
        );
        background.setDepth(0);

        const buttonWidth = Math.min(420, this.scale.width - 40);
        const buttonHeight = 76;
        const buttonX = this.scale.width / 2;
        const buttonY = this.scale.height * 0.84;

        const restartButton = this.add.rectangle(
            buttonX,
            buttonY,
            buttonWidth,
            buttonHeight,
            0x25211d,
            0.96
        );
        restartButton.setStrokeStyle(3, 0xd8b875, 1);
        restartButton.setDepth(10);
        restartButton.setInteractive({
            useHandCursor: true
        });
        restartButton.on("pointerdown", () => this.restartGame());
        restartButton.on("pointerover", () => {
            restartButton.setFillStyle(0x51422d, 1);
        });
        restartButton.on("pointerout", () => {
            restartButton.setFillStyle(0x25211d, 0.96);
        });

        const restartLabel = this.add.text(
            this.scale.width / 2,
            buttonY,
            "VOLVER A JUGAR",
            {
                fontSize: "26px",
                color: "#ffffff",
                fontStyle: "bold",
                align: "center"
            }
        ).setOrigin(0.5);
        restartLabel.setDepth(11);
        restartLabel.setInteractive();
        restartLabel.on("pointerdown", () => this.restartGame());

        this.restartKey = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
    }

    update(): void {
        if (
            this.restartKey &&
            Phaser.Input.Keyboard.JustDown(this.restartKey)
        ) {
            this.restartGame();
        }
    }

    private restartGame(): void {
        if (this.restartRequested) {
            return;
        }

        this.restartRequested = true;
        this.scene.start("GameScene");
    }
}

export default GameOverScene;