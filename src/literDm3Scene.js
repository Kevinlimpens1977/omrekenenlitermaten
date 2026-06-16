export function getLiterDm3State(pourProgress, activelyPouring = false) {
  const progress = Math.min(1, Math.max(0, Number(pourProgress) || 0));
  const rounded = Math.round(progress * 100) / 100;

  return {
    progress,
    cupLevel: Math.round((1 - progress) * 100) / 100,
    cubeLevel: rounded,
    streamVisible: progress > 0 && progress < 1 && activelyPouring,
    equivalence: `${formatLiters(rounded)} L = ${formatLiters(rounded)} dm3`,
    conclusionVisible: progress >= 1
  };
}

export function getCupWorldPositionFromPointer(pointer, bounds) {
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const xRatio = Math.min(1, Math.max(0, (pointer.clientX - bounds.left) / width));
  const yRatio = Math.min(1, Math.max(0, (pointer.clientY - bounds.top) / height));

  return {
    x: -2.15 + xRatio * 4.3,
    y: 0.5 + (1 - yRatio) * 1.75,
    z: 0
  };
}

export function isCupAboveCube(position) {
  return position.x > -0.25 && position.x < 1.05 && position.y > 1.2;
}

export function mountLiterDm3Scene({ root, THREE, gsap }) {
  if (!root || !THREE || !gsap) return { destroy() {} };

  const sceneRoot = root.querySelector('[data-liter-dm3-root]') ?? root;
  const canvas = root.querySelector('[data-liter-dm3-canvas]');
  const progressFill = root.querySelector('[data-pour-progress]');
  const statusLabel = root.querySelector('[data-pour-status]');
  const conclusion = root.querySelector('[data-pour-conclusion]');
  const startButton = root.querySelector('[data-liter-action="start"]');
  const resetButton = root.querySelector('[data-liter-action="reset"]');
  const pauseButton = root.querySelector('[data-liter-action="pause"]');
  const focusButton = root.querySelector('[data-liter-action="focus"]');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const progress = { value: 0 };
  let animationFrame = 0;
  let disposed = false;
  let dragging = false;
  let activelyPouring = false;
  let autoPouring = false;
  let paused = false;
  let lastTick = performance.now();

  camera.position.set(4.4, 3.2, 5.2);
  camera.lookAt(0, 0.6, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 2.6));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 64),
    new THREE.MeshBasicMaterial({ color: 0xdff0f2, transparent: true, opacity: 0.55 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.03;
  scene.add(floor);

  const cubeGroup = new THREE.Group();
  cubeGroup.position.set(-1.05, 0.75, 0);
  scene.add(cubeGroup);

  const cubeGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({
      color: 0xbdefff,
      metalness: 0,
      roughness: 0.2,
      transparent: true,
      opacity: 0.15,
      depthWrite: false
    })
  );
  cubeGroup.add(cubeGlass);

  const cubeEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.5, 1.5)),
    new THREE.LineBasicMaterial({ color: 0x123141, transparent: true, opacity: 0.72 })
  );
  cubeGroup.add(cubeEdges);

  const cubeWater = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 1.44, 1.36),
    new THREE.MeshStandardMaterial({
      color: 0x2f9fbe,
      transparent: true,
      opacity: 0.72,
      roughness: 0.18,
      metalness: 0.02,
      depthWrite: false
    })
  );
  cubeWater.scale.y = 0.001;
  cubeWater.position.y = -0.75;
  cubeGroup.add(cubeWater);

  const cupGroup = new THREE.Group();
  cupGroup.position.set(1.55, 0.85, 0);
  scene.add(cupGroup);

  const cupWall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.45, 1.75, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xf4fdff,
      transparent: true,
      opacity: 0.2,
      roughness: 0.18,
      depthWrite: false
    })
  );
  cupGroup.add(cupWall);

  const cupEdgeMaterial = new THREE.MeshBasicMaterial({ color: 0x536a72, transparent: true, opacity: 0.78 });

  const cupRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.018, 8, 48),
    cupEdgeMaterial
  );
  cupRim.position.y = 0.88;
  cupRim.rotation.x = Math.PI / 2;
  cupGroup.add(cupRim);

  const cupBottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.04, 48),
    new THREE.MeshBasicMaterial({ color: 0xd8f7ff, transparent: true, opacity: 0.32 })
  );
  cupBottom.position.y = -0.88;
  cupGroup.add(cupBottom);

  [-0.43, 0.43].forEach((x) => {
    const sideEdge = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.72, 10), cupEdgeMaterial);
    sideEdge.position.set(x, 0, 0.02);
    cupGroup.add(sideEdge);
  });

  const cupWater = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.4, 1.62, 48),
    new THREE.MeshStandardMaterial({
      color: 0x2f9fbe,
      transparent: true,
      opacity: 0.82,
      roughness: 0.12,
      depthWrite: false
    })
  );
  cupWater.position.y = -0.02;
  cupGroup.add(cupWater);

  const spout = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.26, 24),
    new THREE.MeshBasicMaterial({ color: 0xbdefff, transparent: true, opacity: 0.5 })
  );
  spout.position.set(-0.52, 0.77, 0);
  spout.rotation.z = Math.PI / 2;
  cupGroup.add(spout);

  const stream = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.085, 0.085),
    new THREE.MeshBasicMaterial({ color: 0x2f9fbe, transparent: true, opacity: 0.84 })
  );
  stream.position.set(-0.7, 1.45, 0.05);
  stream.rotation.z = -0.28;
  stream.visible = false;
  scene.add(stream);

  const streamHighlight = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.11, 0.11),
    new THREE.MeshBasicMaterial({ color: 0xbdf3ff, transparent: true, opacity: 0.9 })
  );
  streamHighlight.position.set(-0.12, 1.61, 0.08);
  streamHighlight.rotation.z = -0.28;
  streamHighlight.visible = false;
  scene.add(streamHighlight);

  const autoTween = { move: null };

  function updateScene() {
    const state = getLiterDm3State(progress.value, activelyPouring);

    cubeWater.scale.y = Math.max(0.001, state.cubeLevel);
    cubeWater.position.y = -0.75 + (1.5 * state.cubeLevel) / 2;

    cupWater.scale.y = Math.max(0.001, state.cupLevel);
    cupWater.position.y = -0.83 + (1.62 * state.cupLevel) / 2;

    stream.visible = state.streamVisible;
    streamHighlight.visible = state.streamVisible;
    streamHighlight.position.x = -1.1 + ((Date.now() * 0.0015) % 1.15);
    if (progressFill) progressFill.style.width = `${state.progress * 100}%`;
    if (statusLabel) statusLabel.textContent = state.equivalence;
    if (conclusion) conclusion.hidden = !state.conclusionVisible;
  }

  function resize() {
    const bounds = sceneRoot.getBoundingClientRect();
    const width = Math.max(320, Math.floor(bounds.width));
    const height = Math.max(280, Math.floor(bounds.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function tick() {
    if (disposed) return;
    const now = performance.now();
    const deltaSeconds = Math.min(0.05, (now - lastTick) / 1000);
    lastTick = now;

    cubeGroup.rotation.y = Math.sin(Date.now() * 0.00045) * 0.05;
    const overCube = isCupAboveCube(cupGroup.position);
    activelyPouring = !paused && (dragging || autoPouring) && overCube && progress.value < 1;

    cupGroup.rotation.z += (0 - cupGroup.rotation.z) * 0.18;

    if (activelyPouring) {
      progress.value = Math.min(1, progress.value + deltaSeconds * 0.2);
      if (progress.value >= 1) {
        autoPouring = false;
        activelyPouring = false;
        if (pauseButton) pauseButton.textContent = 'Pauze';
      }
    }

    updateScene();
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(tick);
  }

  function startPour() {
    paused = false;
    autoPouring = true;
    dragging = false;
    if (progress.value >= 1) progress.value = 0;
    autoTween.move?.kill?.();
    autoTween.move = gsap.to(cupGroup.position, {
      x: 0.48,
      y: 1.58,
      z: 0,
      duration: 0.8,
      ease: 'power2.inOut'
    });
    if (pauseButton) pauseButton.textContent = 'Pauze';
  }

  function resetPour() {
    autoTween.move?.kill?.();
    autoPouring = false;
    dragging = false;
    activelyPouring = false;
    paused = false;
    progress.value = 0;
    cupGroup.position.set(1.55, 0.85, 0);
    cupGroup.rotation.set(0, 0, 0);
    updateScene();
    if (pauseButton) pauseButton.textContent = 'Pauze';
  }

  function togglePause() {
    paused = !paused;
    if (paused) {
      autoTween.move?.pause?.();
      if (pauseButton) pauseButton.textContent = 'Verder';
    } else {
      autoTween.move?.resume?.();
      if (pauseButton) pauseButton.textContent = 'Pauze';
    }
  }

  function onPointerDown(event) {
    if (event.target.closest('button')) return;
    event.preventDefault();
    autoTween.move?.kill?.();
    autoPouring = false;
    paused = false;
    dragging = true;
    sceneRoot.classList.add('is-dragging');
    sceneRoot.setPointerCapture?.(event.pointerId);
    moveCupToPointer(event);
    if (pauseButton) pauseButton.textContent = 'Pauze';
  }

  function onPointerMove(event) {
    if (!dragging) return;
    event.preventDefault();
    moveCupToPointer(event);
  }

  function onPointerUp(event) {
    if (!dragging) return;
    dragging = false;
    activelyPouring = false;
    sceneRoot.classList.remove('is-dragging');
    sceneRoot.releasePointerCapture?.(event.pointerId);
  }

  function moveCupToPointer(event) {
    const position = getCupWorldPositionFromPointer(event, sceneRoot.getBoundingClientRect());
    cupGroup.position.set(position.x, position.y, position.z);
  }

  function toggleFocus() {
    const isFocused = root.classList.toggle('is-scene-focus');
    sceneRoot.classList.toggle('is-scene-focus-target', isFocused);
    if (focusButton) {
      focusButton.textContent = isFocused ? 'Minimaliseren' : 'Fullscreen';
      focusButton.setAttribute(
        'aria-label',
        isFocused ? 'Minimaliseer de animatie' : 'Toon de animatie fullscreen'
      );
    }
    if (isFocused) sceneRoot.requestFullscreen?.().catch?.(() => {});
    else if (document.fullscreenElement === sceneRoot) document.exitFullscreen?.();
    requestAnimationFrame(resize);
  }

  function onFullscreenChange() {
    if (document.fullscreenElement === sceneRoot) return;
    root.classList.remove('is-scene-focus');
    sceneRoot.classList.remove('is-scene-focus-target');
    if (focusButton) {
      focusButton.textContent = 'Fullscreen';
      focusButton.setAttribute('aria-label', 'Toon de animatie fullscreen');
    }
    requestAnimationFrame(resize);
  }

  startButton?.addEventListener('click', startPour);
  resetButton?.addEventListener('click', resetPour);
  pauseButton?.addEventListener('click', togglePause);
  focusButton?.addEventListener('click', toggleFocus);
  sceneRoot.addEventListener('pointerdown', onPointerDown);
  sceneRoot.addEventListener('pointermove', onPointerMove);
  sceneRoot.addEventListener('pointerup', onPointerUp);
  sceneRoot.addEventListener('pointercancel', onPointerUp);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  window.addEventListener('resize', resize);

  resize();
  updateScene();
  tick();

  return {
    destroy() {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      autoTween.move?.kill?.();
      if (document.fullscreenElement === sceneRoot) document.exitFullscreen?.();
      startButton?.removeEventListener('click', startPour);
      resetButton?.removeEventListener('click', resetPour);
      pauseButton?.removeEventListener('click', togglePause);
      focusButton?.removeEventListener('click', toggleFocus);
      sceneRoot.removeEventListener('pointerdown', onPointerDown);
      sceneRoot.removeEventListener('pointermove', onPointerMove);
      sceneRoot.removeEventListener('pointerup', onPointerUp);
      sceneRoot.removeEventListener('pointercancel', onPointerUp);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('resize', resize);
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
        else object.material?.dispose?.();
      });
      renderer.dispose();
    }
  };
}

function formatLiters(value) {
  if (value === 0 || value === 1) return String(value);
  return value.toLocaleString('nl-NL', { maximumFractionDigits: 2, useGrouping: false });
}
