/* Math Treasure Quest - 3D World Scene Setup & Animations */
import { gameAudio } from './audio.js';

const THREE = window.THREE;

export class World {
    constructor(scene) {
        this.scene = scene;
        
        // Ground colliders array for player physics
        this.colliders = [];
        
        // Animatable elements
        this.bobbingElements = [];
        this.particles = null;
        
        // Portals / Monoliths
        this.monoliths = [];
        this.keys = [];
        
        // Bridge structures
        this.bridges = {
            arithmetic: { active: false, slabs: [], boundingBoxes: [] },
            algebra: { active: false, slabs: [], boundingBoxes: [] },
            geometry: { active: false, slabs: [], boundingBoxes: [] }
        };
        
        // Define color palette (Spatial.io vibe)
        this.colors = {
            cyan: 0x00f2fe,
            magenta: 0xff007f,
            emerald: 0x10b981,
            gold: 0xf59e0b,
            islandBase: 0x0f172a, // Deep slate
            islandTop: 0x1e293b,  // Muted dark slate
            crystalCyan: 0x06b6d4,
            crystalMagenta: 0xd946ef,
            crystalEmerald: 0x10b981
        };
        
        this.buildEnvironment();
        this.createLights();
        this.createFloatingParticles();
    }

    createLights() {
        // Soft ambient illumination
        const ambientLight = new THREE.HemisphereLight(0xffffff, 0x060913, 0.45);
        this.scene.add(ambientLight);
        
        // Main directional light casting soft shadows
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
        dirLight.position.set(15, 30, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 80;
        
        const d = 25;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        
        this.scene.add(dirLight);
        
        // Ethereal glowing point lights near islands
        const colors = [this.colors.cyan, this.colors.magenta, this.colors.emerald];
        const positions = [
            new THREE.Vector3(-28, 2, 8),
            new THREE.Vector3(28, 2, 8),
            new THREE.Vector3(0, 2, 28)
        ];
        
        positions.forEach((pos, idx) => {
            const pLight = new THREE.PointLight(colors[idx], 1.5, 15);
            pLight.position.copy(pos);
            this.scene.add(pLight);
        });
    }

    buildEnvironment() {
        // 1. SKYBOX GRADIENT BACKGROUND
        // We will configure a custom CSS background on the container, 
        // but let's add a soft distance fog to blend the 3D meshes beautifully.
        this.scene.fog = new THREE.FogExp2(0x060913, 0.022);

        // 2. MAIN HUB ISLAND (Center, Y=0)
        this.createIsland(0, 0, 0, 12, this.colors.islandTop, 'hub');
        this.colliders.push({ type: 'circle', x: 0, z: 0, radius: 12, y: 0 });
        
        // 3. CENTRAL GOLDEN VAULT (Pedestal & Treasure Shield)
        this.createCentralVault();
        
        // 4. THREE OUTER ISLANDS
        // Arithmetic Island (West-ish)
        this.createIsland(-32, 0, 8, 7, this.colors.crystalCyan, 'arithmetic');
        this.colliders.push({ type: 'circle', x: -32, z: 8, radius: 7, y: 0 });
        this.createMonolith(-32, 1, 8, 'key_arithmetic', this.colors.cyan, "➖ Llave Aritmética");
        this.createCrystalsAround(-32, 8, 7, this.colors.cyan);

        // Algebra Island (East-ish)
        this.createIsland(32, 0, 8, 7, this.colors.crystalMagenta, 'algebra');
        this.colliders.push({ type: 'circle', x: 32, z: 8, radius: 7, y: 0 });
        this.createMonolith(32, 1, 8, 'key_algebra', this.colors.magenta, "x Llave Álgebra");
        this.createCrystalsAround(32, 8, 7, this.colors.magenta);

        // Geometry Island (North-ish)
        this.createIsland(0, 0, 32, 7, this.colors.crystalEmerald, 'geometry');
        this.colliders.push({ type: 'circle', x: 0, z: 32, radius: 7, y: 0 });
        this.createMonolith(0, 1, 32, 'key_geometry', this.colors.emerald, "📐 Llave Geometría");
        this.createCrystalsAround(0, 32, 7, this.colors.emerald);

        // 5. BRIDGE PORTAL MONOLITHS (Edge of Central Island, triggers bridge building)
        // Arithmetic portal node: faces West
        this.createMonolith(-10.5, 1, 2.5, 'bridge_arithmetic', this.colors.cyan, "➕ Activar Puente Aritmética");
        // Algebra portal node: faces East
        this.createMonolith(10.5, 1, 2.5, 'bridge_algebra', this.colors.magenta, "x Activar Puente Álgebra");
        // Geometry portal node: faces North
        this.createMonolith(0, 1, 10.5, 'bridge_geometry', this.colors.emerald, "📐 Activar Puente Geometría");

        // 6. DECORATIVE OCEAN GRID (Y=-12)
        const gridHelper = new THREE.GridHelper(160, 40, 0x1e293b, 0x0f172a);
        gridHelper.position.y = -12;
        this.scene.add(gridHelper);

        // 7. DISTANT SPACE SCENERY
        this.createSpaceScenery();
    }

    createSpaceScenery() {
        // Distant Ringed Planet
        const planetGroup = new THREE.Group();
        planetGroup.position.set(40, 15, -45);
        
        const planetGeo = new THREE.SphereGeometry(6, 32, 32);
        const planetMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1, // indigo
            roughness: 0.6,
            metalness: 0.2,
            emissive: 0x312e81,
            emissiveIntensity: 0.5
        });
        const planet = new THREE.Mesh(planetGeo, planetMat);
        planetGroup.add(planet);

        // Planet Rings
        const ringGeo = new THREE.RingGeometry(8, 12, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff007f, // magenta
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
        });
        const rings = new THREE.Mesh(ringGeo, ringMat);
        rings.rotation.x = Math.PI / 2.3;
        rings.rotation.y = Math.PI / 8;
        planetGroup.add(rings);
        
        this.scene.add(planetGroup);
        this.bobbingElements.push({
            mesh: planetGroup,
            offset: 0,
            speed: 0.0002,
            range: 0.5,
            startY: 15
        });

        // Distant Glowing Sun/Moon
        const moonGeo = new THREE.SphereGeometry(3.5, 32, 32);
        const moonMat = new THREE.MeshBasicMaterial({
            color: 0x00f2fe
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.position.set(-45, 20, 45);
        this.scene.add(moon);
    }

    createIsland(x, y, z, radius, glowColor, type) {
        const islandGroup = new THREE.Group();
        islandGroup.position.set(x, y, z);
        
        // Standard high-quality dark plastic/matte surface
        const topMat = new THREE.MeshStandardMaterial({
            color: this.colors.islandTop,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Rough stone underbelly
        const baseMat = new THREE.MeshStandardMaterial({
            color: this.colors.islandBase,
            roughness: 0.9,
            metalness: 0.2
        });

        // 1. Top Flat Cylinder (Grass/Surface)
        const topGeo = new THREE.CylinderGeometry(radius, radius - 0.5, 1, 24);
        const topMesh = new THREE.Mesh(topGeo, topMat);
        topMesh.position.y = -0.5;
        topMesh.receiveShadow = true;
        islandGroup.add(topMesh);

        // 2. Procedural bottom cone (craggy low poly rocky underbelly)
        const baseHeight = radius * 1.2;
        const baseGeo = new THREE.ConeGeometry(radius - 0.4, baseHeight, 12, 1);
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = -baseHeight/2 - 1.0;
        baseMesh.rotation.x = Math.PI; // upside down
        baseMesh.castShadow = true;
        islandGroup.add(baseMesh);

        // 3. Glowing neon edge ring
        const ringGeo = new THREE.TorusGeometry(radius - 0.1, 0.05, 8, 36);
        const ringMat = new THREE.MeshBasicMaterial({
            color: type === 'hub' ? this.colors.gold : glowColor
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = -0.05;
        islandGroup.add(ringMesh);

        this.scene.add(islandGroup);
        
        // Gentle bobbing effect for outer islands
        if (type !== 'hub') {
            this.bobbingElements.push({
                mesh: islandGroup,
                offset: Math.random() * 10,
                speed: 0.001 + Math.random() * 0.001,
                range: 0.15 + Math.random() * 0.1,
                startY: y
            });
        }
    }

    createMonolith(x, y, z, id, glowColor, label) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Dark monolithic pillar
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.2,
            metalness: 0.95
        });
        
        const coreGeo = new THREE.BoxGeometry(0.8, 2.0, 0.4);
        const coreMesh = new THREE.Mesh(coreGeo, pillarMat);
        coreMesh.position.y = 1.0;
        coreMesh.castShadow = true;
        group.add(coreMesh);

        // Glowing math symbol inset
        const symbolGeo = new THREE.BoxGeometry(0.1, 0.8, 0.42);
        const symbolMat = new THREE.MeshBasicMaterial({
            color: glowColor
        });
        const symbolMesh = new THREE.Mesh(symbolGeo, symbolMat);
        symbolMesh.position.set(0, 1.1, 0.02);
        group.add(symbolMesh);
        
        // Point light glow
        const pLight = new THREE.PointLight(glowColor, 0.8, 4);
        pLight.position.set(0, 1.2, 0.4);
        group.add(pLight);

        this.scene.add(group);

        this.monoliths.push({
            id: id,
            mesh: group,
            glowColor: glowColor,
            light: pLight,
            symbol: symbolMesh,
            position: new THREE.Vector3(x, y, z),
            label: label,
            solved: false,
            radius: 2.2 // Interaction distance
        });
    }

    createCentralVault() {
        const vaultGroup = new THREE.Group();
        vaultGroup.position.set(0, 0, 0);

        // Pedestal
        const pedMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            metalness: 0.7,
            roughness: 0.3
        });
        const pedGeo = new THREE.CylinderGeometry(2, 2.2, 0.8, 8);
        const pedMesh = new THREE.Mesh(pedGeo, pedMat);
        pedMesh.position.y = 0.4;
        pedMesh.castShadow = true;
        pedMesh.receiveShadow = true;
        vaultGroup.add(pedMesh);

        // Glass Shield (Translucent Cylinder)
        const shieldGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.2, 16, 1, true);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.25,
            roughness: 0.1,
            metalness: 0.9,
            side: THREE.DoubleSide
        });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.y = 1.8;
        vaultGroup.add(shieldMesh);
        this.vaultShield = shieldMesh; // save reference to animate down

        // Glowing 3D Hypercube / Tesseract (The Treasure)
        // Outer Wireframe Box
        const tesserGroup = new THREE.Group();
        tesserGroup.position.set(0, 1.8, 0);
        
        const outerGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const wireframe = new THREE.EdgesGeometry(outerGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: this.colors.gold, linewidth: 2 });
        const outerWire = new THREE.LineSegments(wireframe, lineMat);
        tesserGroup.add(outerWire);

        // Inner solid glowing cube
        const innerGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        const innerMat = new THREE.MeshStandardMaterial({
            color: this.colors.gold,
            emissive: this.colors.gold,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.85
        });
        const innerCube = new THREE.Mesh(innerGeo, innerMat);
        tesserGroup.add(innerCube);

        vaultGroup.add(tesserGroup);
        this.treasureCube = tesserGroup; // save reference to spin/scale

        // Glow light
        const goldLight = new THREE.PointLight(this.colors.gold, 2.0, 8);
        goldLight.position.set(0, 2.0, 0);
        vaultGroup.add(goldLight);
        this.treasureLight = goldLight;

        // 3 Key Locking Orbs surrounding the pedestal
        const lockColors = [this.colors.cyan, this.colors.magenta, this.colors.emerald];
        this.vaultLocks = [];

        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const radius = 1.6;
            
            const lockGeo = new THREE.SphereGeometry(0.18, 16, 16);
            const lockMat = new THREE.MeshStandardMaterial({
                color: 0x475569, // Unactivated grey state
                emissive: 0x334155,
                emissiveIntensity: 0.2
            });
            const lockMesh = new THREE.Mesh(lockGeo, lockMat);
            lockMesh.position.set(Math.cos(angle) * radius, 0.9, Math.sin(angle) * radius);
            vaultGroup.add(lockMesh);
            
            // Neon circle frame beneath each lock
            const circleGeo = new THREE.RingGeometry(0.24, 0.28, 16);
            const circleMat = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide });
            const circleMesh = new THREE.Mesh(circleGeo, circleMat);
            circleMesh.position.copy(lockMesh.position);
            circleMesh.position.y = 0.81; // flat on pedestal top
            circleMesh.rotation.x = Math.PI / 2;
            vaultGroup.add(circleMesh);

            this.vaultLocks.push({
                mesh: lockMesh,
                circle: circleMesh,
                activeColor: lockColors[i],
                activated: false
            });
        }

        this.scene.add(vaultGroup);
    }

    activateVaultLock(index) {
        if (index < 0 || index >= this.vaultLocks.length) return;
        const lock = this.vaultLocks[index];
        lock.activated = true;
        
        // Animate colors
        lock.mesh.material.color.setHex(lock.activeColor);
        lock.mesh.material.emissive.setHex(lock.activeColor);
        lock.mesh.material.emissiveIntensity = 2.0;
        lock.circle.material.color.setHex(lock.activeColor);
        
        // Trigger small burst of colored particles
        this.triggerKeyBurst(lock.mesh.position, lock.activeColor);
    }

    openVaultShield() {
        // Animate glass shield sliding down
        let duration = 80;
        let count = 0;
        const slide = () => {
            if (count < duration) {
                this.vaultShield.position.y -= 0.03;
                this.treasureCube.position.y += 0.015;
                this.treasureLight.intensity += 0.05;
                count++;
                requestAnimationFrame(slide);
            }
        };
        slide();
        gameAudio.playVictory();
    }

    createCrystalsAround(centerX, centerZ, islandRadius, color) {
        const crystalMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.6,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.85
        });

        // Spawn 3-4 glowing crystals bobbing around the island edge
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4 + 0.5;
            const r = islandRadius - 0.6;
            const x = centerX + Math.cos(angle) * r;
            const z = centerZ + Math.sin(angle) * r;
            
            // Low poly crystal structure
            const geom = new THREE.OctahedronGeometry(0.25 + Math.random() * 0.2, 0);
            const mesh = new THREE.Mesh(geom, crystalMat);
            mesh.position.set(x, 0.4 + Math.random() * 0.4, z);
            mesh.scale.set(0.6, 1.5, 0.6); // Stretch to look like shards
            this.scene.add(mesh);

            this.bobbingElements.push({
                mesh: mesh,
                offset: Math.random() * 5,
                speed: 0.002 + Math.random() * 0.002,
                range: 0.1 + Math.random() * 0.05,
                startY: mesh.position.y
            });
        }
    }

    createFloatingParticles() {
        const count = 150;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 90;
            positions[i * 3 + 1] = Math.random() * 15 - 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
        }
        
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Ethereal circular texture/sprite
        const pMat = new THREE.PointsMaterial({
            color: 0x94a3b8,
            size: 0.18,
            transparent: true,
            opacity: 0.65,
            sizeAttenuation: true
        });
        
        this.particles = new THREE.Points(geom, pMat);
        this.scene.add(this.particles);
    }

    buildBridge(type) {
        // Build bridge based on path key: 'arithmetic', 'algebra', or 'geometry'
        if (this.bridges[type].active) return;
        this.bridges[type].active = true;

        let startPos = new THREE.Vector3(0, 0, 0);
        let endPos = new THREE.Vector3(0, 0, 0);
        
        if (type === 'arithmetic') {
            startPos.set(-10.0, -0.4, 2.5);
            endPos.set(-25.5, -0.4, 7.5);
        } else if (type === 'algebra') {
            startPos.set(10.0, -0.4, 2.5);
            endPos.set(25.5, -0.4, 7.5);
        } else if (type === 'geometry') {
            startPos.set(0, -0.4, 10.0);
            endPos.set(0, -0.4, 25.5);
        }

        const steps = 8;
        const bridgeObj = this.bridges[type];
        
        const dir = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = dir.length();
        dir.normalize();
        
        // Calculate the angle of rotation for the slabs to align along the path
        const bridgeAngle = Math.atan2(dir.x, dir.z);
        
        // Slabs will be wider (3.6) and exactly long enough to overlap (2.2)
        const slabWidth = 3.6;
        const slabLength = 2.2;

        // Procedurally spawn slabs along the path with animation delay
        for (let i = 0; i < steps; i++) {
            const ratio = (i + 1) / (steps + 1);
            const slabPos = new THREE.Vector3().lerpVectors(startPos, endPos, ratio);
            
            // Build the main slab mesh
            const slabGeo = new THREE.BoxGeometry(slabWidth, 0.4, slabLength);
            const slabMat = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                metalness: 0.5,
                roughness: 0.6
            });
            const slab = new THREE.Mesh(slabGeo, slabMat);
            slab.rotation.y = bridgeAngle;
            
            // Neon glowing track line down center of bridge
            const trackGeo = new THREE.BoxGeometry(0.12, 0.05, slabLength);
            const trackMat = new THREE.MeshBasicMaterial({
                color: type === 'arithmetic' ? this.colors.cyan :
                       type === 'algebra' ? this.colors.magenta : this.colors.emerald
            });
            const track = new THREE.Mesh(trackGeo, trackMat);
            track.position.y = 0.22;
            slab.add(track);

            // Left Railing Post (Dark Slate)
            const railGeo = new THREE.BoxGeometry(0.12, 0.6, slabLength);
            const railMat = new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                metalness: 0.8,
                roughness: 0.2
            });
            const leftRail = new THREE.Mesh(railGeo, railMat);
            leftRail.position.set(-slabWidth / 2 + 0.06, 0.3, 0);
            leftRail.castShadow = true;
            slab.add(leftRail);

            // Right Railing Post
            const rightRail = new THREE.Mesh(railGeo, railMat);
            rightRail.position.set(slabWidth / 2 - 0.06, 0.3, 0);
            rightRail.castShadow = true;
            slab.add(rightRail);

            // Glowing tube on top of railings
            const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, slabLength, 8);
            const tubeMat = new THREE.MeshBasicMaterial({
                color: trackMat.color.getHex()
            });
            
            const leftTube = new THREE.Mesh(tubeGeo, tubeMat);
            leftTube.rotation.x = Math.PI / 2;
            leftTube.position.set(-slabWidth / 2 + 0.06, 0.6, 0);
            slab.add(leftTube);

            const rightTube = new THREE.Mesh(tubeGeo, tubeMat);
            rightTube.rotation.x = Math.PI / 2;
            rightTube.position.set(slabWidth / 2 - 0.06, 0.6, 0);
            slab.add(rightTube);
            
            // Hide slab initially
            slab.position.copy(slabPos);
            slab.position.y = -15; // submerge
            slab.scale.set(0.01, 0.01, 0.01);
            slab.castShadow = true;
            slab.receiveShadow = true;
            
            this.scene.add(slab);
            bridgeObj.slabs.push(slab);
            
            // Create a rotated_box physical collider aligned with this slab
            // Shift starting position by half slabLength backward along bridge direction
            const colliderStart = slabPos.clone().addScaledVector(dir, -slabLength / 2);
            
            const bbox = {
                type: 'rotated_box',
                startX: colliderStart.x,
                startZ: colliderStart.z,
                dirX: dir.x,
                dirZ: dir.z,
                length: slabLength,
                width: slabWidth,
                y: -0.2
            };
            
            // Trigger anim delay
            setTimeout(() => {
                this.animateSlabSpawning(slab, slabPos.y, i);
                this.colliders.push(bbox);
                this.triggerKeyBurst(slabPos, trackMat.color.getHex());
            }, i * 220);
        }
    }

    animateSlabSpawning(slab, targetY, index) {
        let val = 0.0;
        const speed = 0.07;
        
        const anim = () => {
            if (val < 1.0) {
                val += speed;
                // scale up
                const scale = THREE.MathUtils.lerp(0.01, 1.0, val);
                slab.scale.set(scale, scale, scale);
                // rise up
                slab.position.y = THREE.MathUtils.lerp(-15, targetY, val);
                
                requestAnimationFrame(anim);
            } else {
                slab.scale.set(1.0, 1.0, 1.0);
                slab.position.y = targetY;
                gameAudio.playBridgeStep(index);
            }
        };
        anim();
    }

    triggerKeyBurst(position, colorHex) {
        const count = 25;
        const pGroup = new THREE.Group();
        const pGeo = new THREE.SphereGeometry(0.06, 4, 4);
        const pMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
        const list = [];
        
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(pGeo, pMat);
            mesh.position.copy(position);
            pGroup.add(mesh);
            
            list.push({
                mesh: mesh,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.16,
                    Math.random() * 0.15 + 0.05,
                    (Math.random() - 0.5) * 0.16
                ),
                life: 1.0
            });
        }
        
        this.scene.add(pGroup);
        
        const tick = () => {
            let active = false;
            list.forEach(p => {
                p.mesh.position.add(p.vel);
                p.vel.y -= 0.005; // gravity
                p.life -= 0.025;
                p.mesh.material.opacity = p.life;
                p.mesh.scale.setScalar(p.life);
                if (p.life > 0) active = true;
            });
            
            if (active) {
                requestAnimationFrame(tick);
            } else {
                this.scene.remove(pGroup);
                pGeo.dispose();
                pMat.dispose();
            }
        };
        tick();
    }

    update() {
        const time = performance.now();
        
        // 1. Animate bobbing crystals & islands
        this.bobbingElements.forEach(el => {
            const bob = Math.sin((time * el.speed) + el.offset) * el.range;
            el.mesh.position.y = el.startY + bob;
            el.mesh.rotation.y += 0.008; // slow rotate
        });

        // 2. Rotate monolith symbols slowly
        this.monoliths.forEach(m => {
            if (!m.solved) {
                m.symbol.rotation.y += 0.015;
            } else {
                m.symbol.rotation.y = 0;
            }
        });

        // 3. Slowly spin particles
        if (this.particles) {
            this.particles.rotation.y += 0.0003;
            // Float up and down slightly
            this.particles.position.y = Math.sin(time * 0.0004) * 0.8;
        }

        // 4. Spin treasure
        if (this.treasureCube) {
            this.treasureCube.rotation.x += 0.005;
            this.treasureCube.rotation.y += 0.01;
            this.treasureCube.rotation.z += 0.003;
            
            // slow float
            this.treasureCube.position.y = 1.8 + Math.sin(time * 0.0015) * 0.15;
        }
    }
}
export default World;
