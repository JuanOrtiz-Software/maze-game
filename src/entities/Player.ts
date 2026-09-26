import Phaser from "phaser";
export class Player extends Phaser.Physics.Arcade.Sprite{
  private readonly speed = 200;
    private readonly displayScale = 0.25;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
//teclas de movimiento
    private keys: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };

    constructor(

        scene: Phaser.Scene,

        x: number,

        y: number

    ) {

        super(scene, x, y, "player1_derecha");

        scene.add.existing(this);

        scene.physics.add.existing(this);

        this.setScale(this.displayScale);
        this.setCollideWorldBounds(true);

        this.cursors = scene.input.keyboard!.createCursorKeys();

        this.keys = scene.input.keyboard!.addKeys("W,A,S,D") as {

            W: Phaser.Input.Keyboard.Key;

            A: Phaser.Input.Keyboard.Key;

            S: Phaser.Input.Keyboard.Key;

            D: Phaser.Input.Keyboard.Key;

        };

        this.createAnimations();

        this.play("player-idle-right");

    }

    private createAnimations(): void {

        this.anims.create({

            key: "player-walk-right",

            frames: [

                { key: "player1_derecha" },

                { key: "player2_derecha" },

                { key: "player3_derecha" },

                { key: "player4_derecha" },

                { key: "player5_derecha" },

                { key: "player6_derecha" },

            ],

            frameRate: 10,

            repeat: -1,

        });

        this.anims.create({

            key: "player-walk-left",

            frames: [

                { key: "player1_izq" },

                { key: "player2_izq" },

                { key: "player3_izq" },

                { key: "player4_izq" },

                { key: "player5_izq" },

                { key: "player6_izq" },

            ],

            frameRate: 10,

            repeat: -1,

        });

        this.anims.create({

            key: "player-idle-right",

            frames: [

                { key: "player1_derecha" },

            ],

            frameRate: 1,

            repeat: -1,

        });

        this.anims.create({

            key: "player-idle-left",

            frames: [

                { key: "player1_izq" },

            ],

            frameRate: 1,

            repeat: -1,

        });

    }

    update(): void {

        let velocityX = 0;

        let velocityY = 0;

        const left =

            this.cursors.left.isDown ||

            this.keys.A.isDown;

        const right =

            this.cursors.right.isDown ||

            this.keys.D.isDown;

        const up =

            this.cursors.up.isDown ||

            this.keys.W.isDown;

        const down =

            this.cursors.down.isDown ||

            this.keys.S.isDown;

        if (left) {

            velocityX = -this.speed;

        } else if (right) {

            velocityX = this.speed;

        }

        if (up) {

            velocityY = -this.speed;

        } else if (down) {

            velocityY = this.speed;

        }

        this.setVelocity(velocityX, velocityY);

        if (velocityX === 0 && velocityY === 0) {
            this.stop();
            this.setVelocity(0, 0);

            if (this.anims.currentAnim?.key === "player-walk-left") {
                this.setTexture("player1_izq");
            } else {
                this.setTexture("player1_derecha");
            }

            return;
        }

        if (velocityX < 0) {

            this.play("player-walk-left", true);

        } else if (velocityX > 0) {

            this.play("player-walk-right", true);

        } else if (velocityY !== 0) {

            // Por ahora mantenemos la animación lateral

            // hasta que tengamos sprites de arriba/abajo.

            if (this.anims.currentAnim?.key !== "player-walk-right" &&

                this.anims.currentAnim?.key !== "player-walk-left") {

                this.play("player-walk-right", true);

            }

        } else {

            if (this.anims.currentAnim?.key === "player-walk-left") {

                this.play("player-idle-left", true);

            } else {

                this.play("player-idle-right", true);

            }

        }

    }
}

//export default Player;
