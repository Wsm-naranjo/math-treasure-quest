/* Math Treasure Quest - Player Character Controller */
import { gameAudio } from './audio.js';

const THREE = window.THREE;

export class Player {
    constructor(scene) {
        this.scene = scene;
        
        // Physics variables
        this.position = new THREE.Vector3(0, 5, 0); // Start raised
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0.13;
        this.gravity = -0.009;
        this.jumpForce = 0.22;
        this.isGrounded = false;
        
        // Dimensions
        this.radius = 0.8;
        
        // Input state
        this.keys = {
            w: false, a: false, s: false, d: false,
            ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
            space: false
        };
        
        // Create 3D Drone Model
        this.mesh = this.createDroneMesh();
        this.scene.add(this.mesh);
        
        // Set initial position
        this.mesh.position.copy(this.position);
        
        // Particle exhaust helpers
        this.exhaustParticles = [];
        this.particleGroup = new THREE.Group();
        this.scene.add(this.particleGroup);
        
        this.setupInputListeners();
    }

    createDroneMesh() {
        const droneGroup = new THREE.Group();
        
        // Materials (Premium glass/chrome & emission)
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xe0e7ff,
            metalness: 0.95,
            roughness: 0.05,
            envMapIntensity: 1.5
        });
        
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00f2fe
        });
        
        const metallicMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            metalness: 0.8,
            roughness: 0.2
        });

        // 1. Center Core (Chrome Sphere)
        const coreGeo = new THREE.SphereGeometry(this.radius * 0.7, 32, 32);
        const coreMesh = new THREE.Mesh(coreGeo, bodyMat);
        coreMesh.castShadow = true;
        coreMesh.receiveShadow = true;
        droneGroup.add(coreMesh);
        
        // 2. Visor/Eye (Glowing neon band)
        const visorGeo = new THREE.BoxGeometry(this.radius * 0.9, this.radius * 0.18, this.radius * 0.5);
        const visorMesh = new THREE.Mesh(visorGeo, glowMat);
        visorMesh.position.set(0, 0.08, this.radius * 0.45);
        droneGroup.add(visorMesh);
        
        // Store visor mesh reference to animate color later
        this.visorMesh = visorMesh;
        
        // 3. Floating Orbiting Ring (Torus)
        const ringGeo = new THREE.TorusGeometry(this.radius * 1.05, 0.04, 8, 48);
        const ringMesh = new THREE.Mesh(ringGeo, metallicMat);
        ringMesh.rotation.x = Math.PI / 2;
        droneGroup.add(ringMesh);
        this.orbitRing = ringMesh;
        
        // 4. Side Thruster Pods
        const thrusterGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.4, 16);
        
        const leftThruster = new THREE.Mesh(thrusterGeo, metallicMat);
        leftThruster.position.set(-this.radius * 0.9, -0.1, 0);
        leftThruster.rotation.z = Math.PI / 12;
        droneGroup.add(leftThruster);
        
        const rightThruster = new THREE.Mesh(thrusterGeo, metallicMat);
        rightThruster.position.set(this.radius * 0.9, -0.1, 0);
        rightThruster.rotation.z = -Math.PI / 12;
        droneGroup.add(rightThruster);
        
        // Glowing exhaust points
        const exhaustGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const leftExhaust = new THREE.Mesh(exhaustGeo, glowMat);
        leftExhaust.position.set(-this.radius * 0.9, -0.3, 0);
        droneGroup.add(leftExhaust);
        
        const rightExhaust = new THREE.Mesh(exhaustGeo, glowMat);
        rightExhaust.position.set(this.radius * 0.9, -0.3, 0);
        droneGroup.add(rightExhaust);

        return droneGroup;
    }

    setupInputListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.w = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.a = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.s = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.d = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.keys.space = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.w = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.a = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.s = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.d = false;
            if (e.code === 'Space') this.keys.space = false;
        });
    }

    setVisorColor(hexColor) {
        if (this.visorMesh) {
            this.visorMesh.material.color.setHex(hexColor);
        }
    }

    update(camera, groundColliders) {
        // 1. Movement vector relative to camera direction
        const moveVector = new THREE.Vector3(0, 0, 0);
        
        // Active movement checking
        const forward = this.keys.w || this.keys.ArrowUp;
        const backward = this.keys.s || this.keys.ArrowDown;
        const left = this.keys.a || this.keys.ArrowLeft;
        const right = this.keys.d || this.keys.ArrowRight;
        
        if (forward) moveVector.z -= 1;
        if (backward) moveVector.z += 1;
        if (left) moveVector.x -= 1;
        if (right) moveVector.x += 1;

        if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
            
            // Rotate movement vector to match camera yaw (horizontal angle)
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            camDir.y = 0; // flatten
            camDir.normalize();
            
            const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x);
            
            const actualMove = new THREE.Vector3()
                .addScaledVector(camDir, -moveVector.z) // Forward is along -z in camera look space but we want forward
                .addScaledVector(camRight, moveVector.x);
            
            actualMove.normalize();
            
            this.velocity.x = actualMove.x * this.speed;
            this.velocity.z = actualMove.z * this.speed;
            
            // Rotate drone mesh smoothly towards travel direction
            const targetRotation = Math.atan2(actualMove.x, actualMove.z);
            let diff = targetRotation - this.mesh.rotation.y;
            
            // Normalize diff to -PI to PI
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            this.mesh.rotation.y += diff * 0.15;
            
            // Tilt animation (banking and pitching)
            this.mesh.rotation.z = -moveVector.x * 0.15; // roll
            this.mesh.rotation.x = -moveVector.z * 0.1;  // pitch
        } else {
            // Decelerate
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
            this.mesh.rotation.z *= 0.85;
            this.mesh.rotation.x *= 0.85;
        }

        // 2. Vertical Jump & Gravity
        this.velocity.y += this.gravity;
        
        // Jump Trigger
        if (this.keys.space && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            gameAudio.playJump();
        }

        // Apply velocities
        this.position.add(this.velocity);

        // 3. Collision with Ground/Islands
        let groundY = -999;
        
        // Check if player is over any platform/collider
        for (const col of groundColliders) {
            if (col.type === 'circle') {
                const dx = this.position.x - col.x;
                const dz = this.position.z - col.z;
                const distSq = dx * dx + dz * dz;
                if (distSq < col.radius * col.radius) {
                    groundY = Math.max(groundY, col.y);
                }
            } else if (col.type === 'box') {
                // Box bounds check (AABB)
                if (this.position.x >= col.minX && this.position.x <= col.maxX &&
                    this.position.z >= col.minZ && this.position.z <= col.maxZ) {
                    groundY = Math.max(groundY, col.y);
                }
            } else if (col.type === 'rotated_box') {
                // Rotated Box check (Bridge with railings constraint)
                const dx = this.position.x - col.startX;
                const dz = this.position.z - col.startZ;
                
                // Project player position onto bridge direction (local Z) and perpendicular (local X)
                const localZ = dx * col.dirX + dz * col.dirZ;
                const localX = -dx * col.dirZ + dz * col.dirX;
                
                // Check if inside rotated rectangle
                if (localZ >= -0.5 && localZ <= col.length + 0.5 &&
                    localX >= -col.width / 2 && localX <= col.width / 2) {
                    
                    groundY = Math.max(groundY, col.y);
                    
                    // Constrain player movement within bridge railings!
                    const limit = col.width / 2 - this.radius;
                    if (localX < -limit) {
                        const correctionX = -limit - localX;
                        this.position.x += correctionX * (-col.dirZ);
                        this.position.z += correctionX * col.dirX;
                    } else if (localX > limit) {
                        const correctionX = limit - localX;
                        this.position.x += correctionX * (-col.dirZ);
                        this.position.z += correctionX * col.dirX;
                    }
                }
            }
        }

        // Apply ground snap
        if (groundY > -900) {
            // Check if player is falling onto the platform
            if (this.position.y - this.radius <= groundY && this.velocity.y <= 0) {
                this.position.y = groundY + this.radius;
                this.velocity.y = 0;
                this.isGrounded = true;
            }
        } else {
            this.isGrounded = false;
        }

        // Set limits or checks for out of bounds falling
        if (this.position.y < -15) {
            this.respawn();
        }

        // Copy position to mesh
        this.mesh.position.copy(this.position);
        
        // Animate Core floating effect (gentle sinus bobbing)
        const time = performance.now() * 0.003;
        this.mesh.position.y += Math.sin(time) * 0.06;
        
        // Spin the outer ring
        if (this.orbitRing) {
            this.orbitRing.rotation.z += 0.02;
            this.orbitRing.rotation.y = Math.sin(time * 0.5) * 0.15;
        }

        // Spawn exhaust sparkles
        if (Math.random() < 0.35) {
            this.spawnExhaustParticle();
        }
        
        this.updateExhaustParticles();
    }

    respawn() {
        gameAudio.playRespawn();
        
        // Reset player state
        this.position.set(0, 6, 0); // Drop on central island
        this.velocity.set(0, 0, 0);
        this.mesh.position.copy(this.position);
        this.isGrounded = false;
        
        // visual screen flash is handled by game controller
        if (this.onRespawnCallback) {
            this.onRespawnCallback();
        }
    }

    spawnExhaustParticle() {
        const pGeo = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 4, 4);
        const pMat = new THREE.MeshBasicMaterial({
            color: this.visorMesh.material.color.getHex(),
            transparent: true,
            opacity: 0.8
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        
        // Spawn from thruster offset
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            -0.3,
            -0.3 // slightly behind drone
        );
        offset.applyQuaternion(this.mesh.quaternion);
        pMesh.position.copy(this.position).add(offset);
        
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            -0.03 - Math.random() * 0.03, // fall down
            (Math.random() - 0.5) * 0.02
        );
        
        this.particleGroup.add(pMesh);
        this.exhaustParticles.push({
            mesh: pMesh,
            velocity: vel,
            life: 1.0,
            decay: 0.04 + Math.random() * 0.03
        });
    }

    updateExhaustParticles() {
        for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
            const p = this.exhaustParticles[i];
            p.mesh.position.add(p.velocity);
            p.life -= p.decay;
            p.mesh.material.opacity = p.life;
            p.mesh.scale.setScalar(p.life);
            
            if (p.life <= 0) {
                this.particleGroup.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.exhaustParticles.splice(i, 1);
            }
        }
    }

    resetParticles() {
        this.exhaustParticles.forEach(p => {
            this.particleGroup.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        });
        this.exhaustParticles = [];
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.scene.remove(this.particleGroup);
        this.resetParticles();
    }
}
export default Player;
