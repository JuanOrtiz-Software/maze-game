import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
	constructor() {
		super("GameScene");
	}

	create(): void {
		this.add.image(640, 360, "ground")
			.setDisplaySize(1280, 720)
			.setDepth(-1);

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

export default GameScene;

