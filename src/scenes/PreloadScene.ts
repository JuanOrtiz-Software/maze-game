import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
        //cargar personajes
        //cargar el jugador
        for (let i = 1; i <= 6; i++) {

            this.load.image(
                `player${i}_derecha`,
                `/assets/characters/player/right/player${i}_derecha.png`
            );
            this.load.image(
                `player${i}_izq`,
                `/assets/characters/player/left/player${i}_izq.png`
            );
        }
        //cargar el cultista
         for (let i = 1; i <= 5; i++) {

            this.load.image(
                `villano${i}_der`,
                `/assets/enemies/cultista/right/villano${i}_der.png`
            );
            this.load.image(
                `villano${i}_izq`,
                `/assets/enemies/cultista/left/villano${i}_izq.png`
            );
        }
        //cargar el fondo
    }
    create(): void {
        this.scene.start("GameScene");
    }
}  
//export default PreloadScene;
