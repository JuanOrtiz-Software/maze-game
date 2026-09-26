import Phaser from "phaser";
import { Player } from "../entities/Player";

export class GameScene extends Phaser.Scene {
	private ground!: Phaser.GameObjects.Image;
	private title!: Phaser.GameObjects.Text;
	private subtitle!: Phaser.GameObjects.Text;
	private player!: Player;

	constructor() {
		super("GameScene");
	}

	create(): void {
		// Crear el fondo
		this.ground = this.add.image(0, 0, "ground");
		this.ground.setOrigin(0.5, 0.5);
		this.ground.setDepth(-1);

		// Título
		this.title = this.add.text(40, 40, "MAZE GAME", {
			fontSize: "32px",
			color: "#ffffff",
		});

		// Subtítulo
		this.subtitle = this.add.text(40, 85, "Primer prototipo", {
			fontSize: "18px",
			color: "#aaaaaa",
		});

		this.player = new Player(this, this.scale.width / 2, this.scale.height / 2);

		// Ajustar todo al tamaño actual
		this.resizeGame();

		// Detectar cambios de tamaño de ventana
		this.scale.on("resize", this.resizeGame, this);
	}

	update(): void {
		this.player.update();
	}

	private resizeGame(): void {
		const width = this.scale.width;
		const height = this.scale.height;

		// Centro de la pantalla
		const centerX = width / 2;
		const centerY = height / 2;

		// -------------------------
		// FONDO
		// -------------------------

		this.ground.setPosition(centerX, centerY);

		// Obtener dimensiones originales de la imagen
		const source = this.textures.get("ground").getSourceImage();

		const imageWidth = source.width;
		const imageHeight = source.height;

		// Escala necesaria para cubrir TODA la pantalla
		const scaleX = width / imageWidth;
		const scaleY = height / imageHeight;

		// Usamos la mayor para que no queden espacios
		const scale = Math.max(scaleX, scaleY);

		this.ground.setScale(scale);

		// -------------------------
		// TEXTO
		// -------------------------

		this.title.setPosition(40, 40);
		this.subtitle.setPosition(40, 85);
	}
}

export default GameScene;

