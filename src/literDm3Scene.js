export function getLiterDm3State(pourProgress) {
  const progress = Math.min(1, Math.max(0, Number(pourProgress) || 0));
  const rounded = Math.round(progress * 100) / 100;

  return {
    progress,
    cupLevel: Math.round((1 - progress) * 100) / 100,
    cubeLevel: rounded,
    streamVisible: progress > 0.05 && progress < 0.95,
    equivalence: `${formatLiters(rounded)} L = ${formatLiters(rounded)} dm3`,
    conclusionVisible: progress >= 1
  };
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

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const progress = { value: 0 };
  let animationFrame = 0;
  let disposed = false;

  camera.position.set(4.4, 3.2, 5.2);
  camera.lookAt(0, 0.6, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 2.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
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
    new THREE.MeshPhysicalMaterial({
      color: 0xbdefff,
      metalness: 0,
      roughness: 0.06,
      transmission: 0.62,
      transparent: true,
      opacity: 0.22,
      thickness: 0.3
    })
  );
  cubeGroup.add(cubeGlass);

  const cubeEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.5, 1.5)),
    new THREE.LineBasicMaterial({ color: 0x123141, transparent: true, opacity: 0.72 })
  );
  cubeGroup.add(cubeEdges);

  const cubeWater = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 1.5, 1.42),
    new THREE.MeshPhysicalMaterial({
      color: 0x2f9fbe,
      transparent: true,
      opacity: 0.56,
      roughness: 0.1,
      metalness: 0.02
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
    new THREE.MeshPhysicalMaterial({
      color: 0xd8f7ff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.04,
      transmission: 0.5,
      thickness: 0.18
    })
  );
  cupGroup.add(cupWall);

  const cupRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.015, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x123141, transparent: true, opacity: 0.7 })
  );
  cupRim.position.y = 0.88;
  cupRim.rotation.x = Math.PI / 2;
  cupGroup.add(cupRim);

  const cupWater = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.4, 1.62, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x2f9fbe,
      transparent: true,
      opacity: 0.62,
      roughness: 0.08
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

  addCupTicks(cupGroup, THREE);

  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.05, 1.65, 16),
    new THREE.MeshBasicMaterial({ color: 0x2f9fbe, transparent: true, opacity: 0.72 })
  );
  stream.position.set(0.02, 1.62, 0);
  stream.rotation.z = -0.92;
  stream.visible = false;
  scene.add(stream);

  const timeline = gsap.timeline({ paused: true });
  timeline
    .to(cupGroup.position, { x: 0.68, y: 1.72, duration: 0.9, ease: 'power2.inOut' }, 0)
    .to(cupGroup.rotation, { z: 0.98, duration: 0.95, ease: 'power2.inOut' }, 0.65)
    .to(progress, { value: 1, duration: 2.2, ease: 'none', onUpdate: updateScene }, 1)
    .to(cupGroup.rotation, { z: 0.98, duration: 0.35 }, 3.1);

  function updateScene() {
    const state = getLiterDm3State(progress.value);

    cubeWater.scale.y = Math.max(0.001, state.cubeLevel);
    cubeWater.position.y = -0.75 + (1.5 * state.cubeLevel) / 2;

    cupWater.scale.y = Math.max(0.001, state.cupLevel);
    cupWater.position.y = -0.83 + (1.62 * state.cupLevel) / 2;

    stream.visible = state.streamVisible;
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
    cubeGroup.rotation.y = Math.sin(Date.now() * 0.00045) * 0.05;
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(tick);
  }

  function startPour() {
    timeline.restart();
    if (pauseButton) pauseButton.textContent = 'Pauze';
  }

  function resetPour() {
    timeline.pause(0);
    progress.value = 0;
    cupGroup.position.set(1.55, 0.85, 0);
    cupGroup.rotation.set(0, 0, 0);
    updateScene();
    if (pauseButton) pauseButton.textContent = 'Pauze';
  }

  function togglePause() {
    if (timeline.paused()) {
      timeline.play();
      if (pauseButton) pauseButton.textContent = 'Pauze';
    } else {
      timeline.pause();
      if (pauseButton) pauseButton.textContent = 'Verder';
    }
  }

  startButton?.addEventListener('click', startPour);
  resetButton?.addEventListener('click', resetPour);
  pauseButton?.addEventListener('click', togglePause);
  window.addEventListener('resize', resize);

  resize();
  updateScene();
  tick();

  return {
    destroy() {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      timeline.kill();
      startButton?.removeEventListener('click', startPour);
      resetButton?.removeEventListener('click', resetPour);
      pauseButton?.removeEventListener('click', togglePause);
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

function addCupTicks(group, THREE) {
  const material = new THREE.MeshBasicMaterial({ color: 0x123141, transparent: true, opacity: 0.62 });
  const levels = [-0.44, -0.02, 0.42, 0.82];
  levels.forEach((y, index) => {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(index === 3 ? 0.28 : 0.2, 0.018, 0.018), material);
    tick.position.set(0.5, y, 0.02);
    group.add(tick);
  });
}

function formatLiters(value) {
  if (value === 0 || value === 1) return String(value);
  return value.toLocaleString('nl-NL', { maximumFractionDigits: 2, useGrouping: false });
}
