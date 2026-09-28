const fs = require('fs');

const path = '/Users/juanortiz/Downloads/maze-game/src/scenes/GameScene.ts';
let code = fs.readFileSync(path, 'utf8');

// Add properties
code = code.replace(
    'private currentOffset!: {',
    `private worldConfig: any;
    private lastPlayerChunk: { x: number; y: number } | null = null;
    private renderedChunks: Set<string> = new Set();
    
    private currentOffset!: {`
);

// Save worldConfig
code = code.replace(
    'const worldConfig =',
    'this.worldConfig =\n            WorldConfigFactory.create'
);
code = code.replace(
    'WorldConfigFactory.create(\n                this.scale.width,\n                this.scale.height,\n                928371\n            );',
    ''
);

// Start camera follow
code = code.replace(
    'this.createPlayer();',
    'this.createPlayer();\n        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);\n        this.cameras.main.setZoom(1);'
);

// Remove chunkTransitionSystem usage in create
code = code.replace(
    'this.chunkTransitionSystem =\n            new ChunkTransitionSystem();',
    ''
);

// Remove chunkTransitionSystem usage in shutdown
// code = code.replace(
//     'this.chunkTransitionSystem.destroy();',
//     ''
// );

// In setupCollisions, remove offset parameter
code = code.replace(
    'this.collisionSystem.buildWalls(\n            this.currentChunk,\n            this.tileSize,\n            offset\n        );',
    'this.collisionSystem.buildWalls(\n            this.currentChunk,\n            this.tileSize\n        );'
);

// We will overwrite update() entirely, let's just do it directly using a regex
code = code.replace(/\/\*\n\s+\*\s+============================================================\n\s+\*\s+UPDATE\n\s+\*\s+============================================================\n\s+\*\/\n\n\s+update\([\s\S]*?\n\s+\}\n\n\s+\/\*\n\s+\*\s+============================================================\n\s+\*\s+CREATE PLAYER/g,
`/*
     * ============================================================
     * UPDATE
     * ============================================================
     */

    update(
        time: number,
        delta: number
    ): void {
        if (!this.player) {
            return;
        }

        this.player.update();
        this.chunkStreamManager.update();

        const cw = this.worldConfig.chunkWidth * this.tileSize;
        const ch = this.worldConfig.chunkHeight * this.tileSize;

        const currentChunkX = Math.floor(this.player.x / cw);
        const currentChunkY = Math.floor(this.player.y / ch);

        if (!this.lastPlayerChunk || this.lastPlayerChunk.x !== currentChunkX || this.lastPlayerChunk.y !== currentChunkY) {
            this.lastPlayerChunk = { x: currentChunkX, y: currentChunkY };
            
            this.chunkStreamManager.preloadAround(this.lastPlayerChunk);
            this.chunkStreamManager.unloadDistantChunks(this.lastPlayerChunk);
            
            const centerChunk = this.chunkStreamManager.getChunk(this.lastPlayerChunk);
            if (centerChunk) {
                this.currentChunk = centerChunk;
                this.currentOffset = { x: currentChunkX * cw, y: currentChunkY * ch };
                this.spawnEnemyForCurrentChunk();
            }
        }

        const visibleKeys = new Set<string>();
        const renderDist = 2;

        for (let y = -renderDist; y <= renderDist; y++) {
            for (let x = -renderDist; x <= renderDist; x++) {
                const cx = currentChunkX + x;
                const cy = currentChunkY + y;
                const key = \`\${cx},\${cy}\`;
                visibleKeys.add(key);

                if (!this.renderedChunks.has(key)) {
                    const chunk = this.chunkStreamManager.getChunk({x: cx, y: cy});
                    if (chunk) {
                        this.mazeRenderer.render(chunk, this.tileSize);
                        this.collisionSystem.buildWalls(chunk, this.tileSize);
                        this.renderedChunks.add(key);
                    }
                }
            }
        }

        for (const key of this.renderedChunks) {
            if (!visibleKeys.has(key)) {
                const [cx, cy] = key.split(',').map(Number);
                this.mazeRenderer.removeChunk({x: cx, y: cy});
                this.collisionSystem.removeChunk({x: cx, y: cy});
                this.renderedChunks.delete(key);
            }
        }

        if (this.enemySystem) {
            this.enemySystem.update(time, delta);
        }
    }

    /*
     * ============================================================
     * CREATE PLAYER`
);

fs.writeFileSync(path, code);
