// ==========================================
// CHARACTER 3D MODELS
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { PokemonTypes } from '../utils/constants.js';

export function createPokemonModel(type) {
    const group = new THREE.Group();
    const colors = PokemonTypes[type];
    
    switch(type) {
        case 'charmander':
            createCharmanderModel(group, colors);
            break;
        case 'bulbasaur':
            createBulbasaurModel(group, colors);
            break;
        case 'squirtle':
            createSquirtleModel(group, colors);
            break;
        case 'pikachu':
            createPikachuModel(group, colors);
            break;
    }
    
    // Add HP bar above pokemon
    const hpBarGroup = createHPBar();
    hpBarGroup.position.y = 2;
    group.add(hpBarGroup);
    group.userData.hpBar = hpBarGroup;
    
    return group;
}

function createHPBar() {
    const hpBarGroup = new THREE.Group();
    
    const hpBg = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.2),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    hpBarGroup.add(hpBg);
    
    const hpFill = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x51cf66 })
    );
    hpFill.position.z = 0.01;
    hpFill.userData = { isHpFill: true };
    hpBarGroup.add(hpFill);
    
    return hpBarGroup;
}

function createCharmanderModel(group, colors) {
    // Body
    const charmBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    charmBody.position.y = 0.6;
    charmBody.castShadow = true;
    group.add(charmBody);
    
    // Belly
    const charmBelly = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0xffddaa })
    );
    charmBelly.position.set(0, 0.5, 0.35);
    charmBelly.scale.set(0.8, 0.8, 0.5);
    group.add(charmBelly);
    
    // Head
    const charmHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    charmHead.position.y = 1.3;
    charmHead.castShadow = true;
    group.add(charmHead);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.4, 0.35);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.4, 0.35);
    group.add(rightEye);
    
    // Tail with flame
    const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 1, 8),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    tail.rotation.x = Math.PI / 3;
    tail.position.set(0, 0.5, -0.7);
    group.add(tail);
    
    const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff4400 })
    );
    flame.position.set(0, 0.9, -0.95);
    group.add(flame);
    
    // Store flame for animation
    group.userData.flame = flame;
}

function createBulbasaurModel(group, colors) {
    // Body
    const bulbBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    bulbBody.position.y = 0.65;
    bulbBody.castShadow = true;
    group.add(bulbBody);
    
    // Bulb on back
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.secondary })
    );
    bulb.position.set(0, 1.1, -0.3);
    bulb.scale.set(1, 0.8, 1);
    bulb.castShadow = true;
    group.add(bulb);
    
    // Head
    const bulbHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    bulbHead.position.set(0, 1.25, 0.3);
    bulbHead.castShadow = true;
    group.add(bulbHead);
    
    // Eyes
    const bulbEyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const bulbEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x8b0000 });
    const bulbLeftEye = new THREE.Mesh(bulbEyeGeometry, bulbEyeMaterial);
    bulbLeftEye.position.set(-0.18, 1.35, 0.65);
    group.add(bulbLeftEye);
    const bulbRightEye = new THREE.Mesh(bulbEyeGeometry, bulbEyeMaterial);
    bulbRightEye.position.set(0.18, 1.35, 0.65);
    group.add(bulbRightEye);
    
    // Spots
    for (let i = 0; i < 3; i++) {
        const spot = new THREE.Mesh(
            new THREE.CircleGeometry(0.08, 8),
            new THREE.MeshBasicMaterial({ color: 0x2d6a4f })
        );
        spot.position.set(
            Math.sin(i * 2) * 0.4,
            0.7 + Math.cos(i * 1.5) * 0.3,
            0.55
        );
        spot.rotation.x = -0.3;
        group.add(spot);
    }
}

function createSquirtleModel(group, colors) {
    // Body
    const squirtBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    squirtBody.position.y = 0.6;
    squirtBody.castShadow = true;
    group.add(squirtBody);
    
    // Shell
    const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    shell.position.set(0, 0.7, -0.2);
    shell.scale.set(1, 0.8, 0.6);
    shell.castShadow = true;
    group.add(shell);
    
    // Head
    const squirtHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    squirtHead.position.set(0, 1.2, 0.25);
    squirtHead.castShadow = true;
    group.add(squirtHead);
    
    // Eyes
    const squirtEyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const squirtEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const squirtLeftEye = new THREE.Mesh(squirtEyeGeometry, squirtEyeMaterial);
    squirtLeftEye.position.set(-0.15, 1.3, 0.55);
    group.add(squirtLeftEye);
    const squirtRightEye = new THREE.Mesh(squirtEyeGeometry, squirtEyeMaterial);
    squirtRightEye.position.set(0.15, 1.3, 0.55);
    group.add(squirtRightEye);
    
    // Tail
    const squirtTail = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.6, 8),
        new THREE.MeshLambertMaterial({ color: 0x96c93d })
    );
    squirtTail.rotation.x = Math.PI / 4;
    squirtTail.position.set(0, 0.3, -0.7);
    group.add(squirtTail);
}

function createPikachuModel(group, colors) {
    // Body
    const pikaBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    pikaBody.position.y = 0.5;
    pikaBody.castShadow = true;
    group.add(pikaBody);
    
    // Head
    const pikaHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.color })
    );
    pikaHead.position.y = 1.1;
    pikaHead.castShadow = true;
    group.add(pikaHead);
    
    // Ears
    const earGeometry = new THREE.ConeGeometry(0.12, 0.8, 8);
    const earMaterial = new THREE.MeshLambertMaterial({ color: colors.color });
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.25, 1.5, 0);
    leftEar.rotation.z = 0.4;
    leftEar.rotation.x = -0.2;
    group.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.25, 1.5, 0);
    rightEar.rotation.z = -0.4;
    rightEar.rotation.x = -0.2;
    group.add(rightEar);
    
    // Ear tips (black)
    const tipGeometry = new THREE.ConeGeometry(0.12, 0.25, 8);
    const tipMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftTip = new THREE.Mesh(tipGeometry, tipMaterial);
    leftTip.position.set(-0.42, 1.85, -0.08);
    leftTip.rotation.z = 0.4;
    leftTip.rotation.x = -0.2;
    group.add(leftTip);
    
    const rightTip = new THREE.Mesh(tipGeometry, tipMaterial);
    rightTip.position.set(0.42, 1.85, -0.08);
    rightTip.rotation.z = -0.4;
    rightTip.rotation.x = -0.2;
    group.add(rightTip);
    
    // Eyes
    const pikaEyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const pikaEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pikaLeftEye = new THREE.Mesh(pikaEyeGeometry, pikaEyeMaterial);
    pikaLeftEye.position.set(-0.15, 1.2, 0.35);
    group.add(pikaLeftEye);
    const pikaRightEye = new THREE.Mesh(pikaEyeGeometry, pikaEyeMaterial);
    pikaRightEye.position.set(0.15, 1.2, 0.35);
    group.add(pikaRightEye);
    
    // Cheeks
    const cheekGeometry = new THREE.CircleGeometry(0.1, 8);
    const cheekMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
    const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
    leftCheek.position.set(-0.25, 1.05, 0.32);
    leftCheek.rotation.y = -0.4;
    group.add(leftCheek);
    const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
    rightCheek.position.set(0.25, 1.05, 0.32);
    rightCheek.rotation.y = 0.4;
    group.add(rightCheek);
}
