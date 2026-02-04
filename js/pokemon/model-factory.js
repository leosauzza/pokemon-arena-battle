// ==========================================
// MODEL FACTORY - Creates 3D models from Pokemon type
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { pokemonRegistry } from './pokemon-registry.js';

export function createPokemonModel(pokemonId) {
    const pokemon = pokemonRegistry.get(pokemonId);
    if (!pokemon) {
        console.warn(`Pokemon ${pokemonId} not found, using default`);
        return createDefaultModel();
    }

    const group = new THREE.Group();
    const colors = pokemon.colors;

    switch(pokemonId) {
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
        default:
            createDefaultModel(group, colors);
    }

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
    const charmBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.primary })
    );
    charmBody.position.y = 0.6;
    charmBody.castShadow = true;
    group.add(charmBody);

    const charmBelly = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0xffddaa })
    );
    charmBelly.position.set(0, 0.5, 0.35);
    charmBelly.scale.set(0.8, 0.8, 0.5);
    group.add(charmBelly);

    const charmHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.primary })
    );
    charmHead.position.y = 1.3;
    charmHead.castShadow = true;
    group.add(charmHead);

    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.4, 0.35);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.4, 0.35);
    group.add(rightEye);

    const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 1, 8),
        new THREE.MeshLambertMaterial({ color: colors.primary })
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

    group.userData.flame = flame;
}

function createBulbasaurModel(group, colors) {
    const bulbBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.primary })
    );
    bulbBody.position.y = 0.65;
    bulbBody.castShadow = true;
    group.add(bulbBody);

    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.secondary })
    );
    bulb.position.set(0, 1.1, -0.3);
    bulb.scale.set(1, 0.8, 1);
    bulb.castShadow = true;
    group.add(bulb);

    const bulbHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.primary })
    );
    bulbHead.position.set(0, 1.25, 0.3);
    bulbHead.castShadow = true;
    group.add(bulbHead);

    const bulbEyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const bulbEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x8b0000 });
    const bulbLeftEye = new THREE.Mesh(bulbEyeGeometry, bulbEyeMaterial);
    bulbLeftEye.position.set(-0.18, 1.35, 0.65);
    group.add(bulbLeftEye);
    const bulbRightEye = new THREE.Mesh(bulbEyeGeometry, bulbEyeMaterial);
    bulbRightEye.position.set(0.18, 1.35, 0.65);
    group.add(bulbRightEye);

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
    const squirtBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.primary })
    );
    squirtBody.position.y = 0.6;
    squirtBody.castShadow = true;
    group.add(squirtBody);

    const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    shell.position.set(0, 0.7, -0.2);
    shell.scale.set(1, 0.8, 0.6);
    shell.castShadow = true;
    group.add(shell);

    const squirtHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.primary })
    );
    squirtHead.position.set(0, 1.2, 0.25);
    squirtHead.castShadow = true;
    group.add(squirtHead);

    const squirtEyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const squirtEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const squirtLeftEye = new THREE.Mesh(squirtEyeGeometry, squirtEyeMaterial);
    squirtLeftEye.position.set(-0.15, 1.3, 0.55);
    group.add(squirtLeftEye);
    const squirtRightEye = new THREE.Mesh(squirtEyeGeometry, squirtEyeMaterial);
    squirtRightEye.position.set(0.15, 1.3, 0.55);
    group.add(squirtRightEye);

    const squirtTail = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.6, 8),
        new THREE.MeshLambertMaterial({ color: 0x96c93d })
    );
    squirtTail.rotation.x = Math.PI / 4;
    squirtTail.position.set(0, 0.3, -0.7);
    group.add(squirtTail);
}

function createPikachuModel(group, colors) {
    const pikaBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.primary })
    );
    pikaBody.position.y = 0.5;
    pikaBody.castShadow = true;
    group.add(pikaBody);

    const pikaHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors.primary })
    );
    pikaHead.position.y = 1.1;
    pikaHead.castShadow = true;
    group.add(pikaHead);

    const earGeometry = new THREE.ConeGeometry(0.12, 0.8, 8);
    const earMaterial = new THREE.MeshLambertMaterial({ color: colors.primary });
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

    const pikaEyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const pikaEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pikaLeftEye = new THREE.Mesh(pikaEyeGeometry, pikaEyeMaterial);
    pikaLeftEye.position.set(-0.15, 1.2, 0.35);
    group.add(pikaLeftEye);
    const pikaRightEye = new THREE.Mesh(pikaEyeGeometry, pikaEyeMaterial);
    pikaRightEye.position.set(0.15, 1.2, 0.35);
    group.add(pikaRightEye);

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

function createDefaultModel(group, colors) {
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshLambertMaterial({ color: colors ? colors.primary : 0xcccccc })
    );
    body.position.y = 0.6;
    group.add(body);

    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.4, 0.35);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.4, 0.35);
    group.add(rightEye);
}
