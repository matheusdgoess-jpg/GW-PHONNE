const stage = document.querySelector('.hero-webgl-shell');
const heroVisual = document.querySelector('.hero-visual');
const canvas = document.getElementById('iphone-3d');

if (stage && heroVisual && canvas && 'WebGLRenderingContext' in window) {
  Promise.all([
    import('three'),
    import('three/addons/geometries/RoundedBoxGeometry.js'),
    import('three/addons/environments/RoomEnvironment.js')
  ]).then(([THREE, roundedModule, roomModule]) => {
    startScene(THREE, roundedModule.RoundedBoxGeometry, roomModule.RoomEnvironment);
  }).catch(() => heroVisual.classList.add('is-3d-fallback'));
}

function startScene(THREE, RoundedBoxGeometry, RoomEnvironment) {
  const compact = window.matchMedia('(max-width: 680px)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = compact || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.35 : 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, .1, 100);
  camera.position.set(0, .1, compact ? 17.2 : 15.7);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, .04).texture;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0x8cdcff, 0x030611, 1.4));
  const keyLight = new THREE.PointLight(0x9ee9ff, 54, 22, 2);
  keyLight.position.set(-4.8, 4.6, 7);
  scene.add(keyLight);
  const cyanLight = new THREE.PointLight(0x00cfff, 44, 19, 2);
  cyanLight.position.set(-4.5, -2.8, 4.5);
  scene.add(cyanLight);
  const violetLight = new THREE.PointLight(0x7457ff, 52, 20, 2);
  violetLight.position.set(5, -1.5, 5);
  scene.add(violetLight);

  const device = new THREE.Group();
  scene.add(device);

  const frameMaterial = new THREE.MeshPhysicalMaterial({ color: 0x182b3d, metalness: .96, roughness: .18, clearcoat: 1, clearcoatRoughness: .09, envMapIntensity: 1.65 });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(4.12, 8.18, .52, 10, .38), frameMaterial);
  frame.position.z = -.08;
  device.add(frame);

  const innerGlow = new THREE.Mesh(
    new RoundedBoxGeometry(3.88, 7.93, .18, 9, .33),
    new THREE.MeshBasicMaterial({ color: 0x00bfea, transparent: true, opacity: .24, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  innerGlow.position.z = .22;
  device.add(innerGlow);

  const board = new THREE.Mesh(
    new RoundedBoxGeometry(3.68, 7.7, .18, 8, .29),
    new THREE.MeshPhysicalMaterial({ color: 0x071c29, metalness: .72, roughness: .3, emissive: 0x00334b, emissiveIntensity: .55 })
  );
  board.position.z = .18;
  device.add(board);

  const copperMaterial = new THREE.MeshStandardMaterial({ color: 0x26b6d0, metalness: .82, roughness: .25, emissive: 0x003b4b, emissiveIntensity: .7 });
  [-1.18, -.38, .42, 1.22].forEach((x, index) => {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(.08, index % 2 ? 5.3 : 6.1, .04, 3, .035), copperMaterial);
    rail.position.set(x, index % 2 ? -.2 : .2, .3);
    device.add(rail);
  });

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 768;
  screenCanvas.height = 1536;
  const screenContext = screenCanvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const drawScreen = logo => {
    const gradient = screenContext.createLinearGradient(40, 0, 720, 1536);
    gradient.addColorStop(0, '#01040b');
    gradient.addColorStop(.46, '#06152c');
    gradient.addColorStop(1, '#030511');
    screenContext.fillStyle = gradient;
    screenContext.fillRect(0, 0, 768, 1536);
    const glow = screenContext.createRadialGradient(500, 620, 25, 500, 620, 540);
    glow.addColorStop(0, 'rgba(0,211,255,.33)');
    glow.addColorStop(.46, 'rgba(33,93,255,.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    screenContext.fillStyle = glow;
    screenContext.fillRect(0, 0, 768, 1536);
    screenContext.strokeStyle = 'rgba(81,215,255,.07)';
    screenContext.lineWidth = 1;
    for (let x = 0; x < 768; x += 64) {
      screenContext.beginPath(); screenContext.moveTo(x, 0); screenContext.lineTo(x, 1536); screenContext.stroke();
    }
    for (let y = 0; y < 1536; y += 64) {
      screenContext.beginPath(); screenContext.moveTo(0, y); screenContext.lineTo(768, y); screenContext.stroke();
    }
    screenContext.strokeStyle = 'rgba(0,222,255,.2)';
    screenContext.lineWidth = 3;
    screenContext.beginPath(); screenContext.arc(384, 770, 252, 0, Math.PI * 2); screenContext.stroke();
    screenContext.strokeStyle = 'rgba(116,87,255,.18)';
    screenContext.beginPath(); screenContext.arc(384, 770, 302, 0, Math.PI * 2); screenContext.stroke();
    if (logo) {
      screenContext.save();
      screenContext.shadowColor = 'rgba(0,214,255,.45)';
      screenContext.shadowBlur = 42;
      screenContext.beginPath();
      screenContext.arc(384, 770, 218, 0, Math.PI * 2);
      screenContext.clip();
      screenContext.drawImage(logo, 166, 552, 436, 436);
      screenContext.restore();
    }
    screenTexture.needsUpdate = true;
  };
  drawScreen(null);
  const logo = new Image();
  logo.decoding = 'async';
  logo.onload = () => drawScreen(logo);
  logo.src = new URL('assets/img-tech-logo-v2.png', document.baseURI).href;

  const screenMaterial = new THREE.MeshPhysicalMaterial({ map: screenTexture, color: 0xffffff, roughness: .065, metalness: .05, clearcoat: 1, clearcoatRoughness: .035, envMapIntensity: .72 });
  const screen = new THREE.Mesh(new RoundedBoxGeometry(3.76, 7.8, .1, 10, .32), screenMaterial);
  screen.position.z = .37;
  device.add(screen);

  const island = new THREE.Mesh(
    new RoundedBoxGeometry(1.2, .27, .08, 6, .13),
    new THREE.MeshPhysicalMaterial({ color: 0x000106, roughness: .08, metalness: .2, clearcoat: 1 })
  );
  island.position.set(0, 3.35, .47);
  device.add(island);
  const sensor = new THREE.Mesh(new THREE.SphereGeometry(.045, 20, 12), new THREE.MeshBasicMaterial({ color: 0x11336d }));
  sensor.position.set(.37, 3.35, .52);
  device.add(sensor);

  const buttonMaterial = new THREE.MeshPhysicalMaterial({ color: 0x18384d, metalness: .94, roughness: .17, clearcoat: 1 });
  [[-2.085, 1.55, .1, .72], [-2.085, .48, .1, 1.1], [2.085, .85, .1, 1.45]].forEach(([x, y, z, height]) => {
    const button = new THREE.Mesh(new RoundedBoxGeometry(.09, height, .16, 4, .04), buttonMaterial);
    button.position.set(x, y, z);
    device.add(button);
  });

  const scanCanvas = document.createElement('canvas');
  scanCanvas.width = 512; scanCanvas.height = 64;
  const scanContext = scanCanvas.getContext('2d');
  const scanGradient = scanContext.createLinearGradient(0, 0, 0, 64);
  scanGradient.addColorStop(0, 'rgba(0,220,255,0)');
  scanGradient.addColorStop(.46, 'rgba(72,228,255,.18)');
  scanGradient.addColorStop(.5, 'rgba(180,248,255,.92)');
  scanGradient.addColorStop(.54, 'rgba(116,87,255,.2)');
  scanGradient.addColorStop(1, 'rgba(0,220,255,0)');
  scanContext.fillStyle = scanGradient;
  scanContext.fillRect(0, 0, 512, 64);
  const scanTexture = new THREE.CanvasTexture(scanCanvas);
  const scanner = new THREE.Mesh(
    new THREE.PlaneGeometry(3.38, .24),
    new THREE.MeshBasicMaterial({ map: scanTexture, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scanner.position.z = .54;
  device.add(scanner);

  const ringGroup = new THREE.Group();
  const ringCyan = new THREE.Mesh(new THREE.TorusGeometry(3.52, .014, 8, 160), new THREE.MeshBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: .38, blending: THREE.AdditiveBlending }));
  ringCyan.rotation.x = 1.1;
  ringCyan.rotation.z = .26;
  ringGroup.add(ringCyan);
  const ringViolet = new THREE.Mesh(new THREE.TorusGeometry(4.05, .009, 8, 160), new THREE.MeshBasicMaterial({ color: 0x7457ff, transparent: true, opacity: .24, blending: THREE.AdditiveBlending }));
  ringViolet.rotation.x = 1.32;
  ringViolet.rotation.z = -.3;
  ringGroup.add(ringViolet);
  ringGroup.position.z = -1.2;
  scene.add(ringGroup);

  const pointCount = lowPower ? 45 : 90;
  const positions = new Float32Array(pointCount * 3);
  for (let index = 0; index < pointCount; index += 1) {
    positions[index * 3] = (Math.random() - .5) * 11;
    positions[index * 3 + 1] = (Math.random() - .5) * 10;
    positions[index * 3 + 2] = (Math.random() - .5) * 4 - 1;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x38d8ff, size: .028, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(particles);

  let pointerX = 0;
  let pointerY = 0;
  let manualYaw = 0;
  let manualPitch = 0;
  let dragging = false;
  let pointerMoved = false;
  let previousPointerX = 0;
  let previousPointerY = 0;
  let exploded = false;
  let inViewport = true;
  stage.addEventListener('pointerdown', event => {
    dragging = true;
    pointerMoved = false;
    previousPointerX = event.clientX;
    previousPointerY = event.clientY;
    stage.classList.add('is-dragging');
    canvas.setPointerCapture?.(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    const bounds = stage.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
    pointerY = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    stage.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    stage.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
    if (dragging) {
      const deltaX = event.clientX - previousPointerX;
      const deltaY = event.clientY - previousPointerY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 2) pointerMoved = true;
      manualYaw += deltaX * .009;
      manualPitch = THREE.MathUtils.clamp(manualPitch + deltaY * .006, -.46, .46);
      previousPointerX = event.clientX;
      previousPointerY = event.clientY;
    }
  }, { passive: true });
  const finishPointer = event => {
    if (dragging && !pointerMoved) exploded = !exploded;
    dragging = false;
    stage.classList.remove('is-dragging');
    canvas.releasePointerCapture?.(event.pointerId);
  };
  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);
  stage.addEventListener('pointerleave', () => { if (!dragging) { pointerX = 0; pointerY = 0; } }, { passive: true });

  const observer = new IntersectionObserver(entries => { inViewport = entries[0]?.isIntersecting ?? true; }, { rootMargin: '140px' });
  observer.observe(stage);
  const resize = () => {
    const bounds = stage.getBoundingClientRect();
    renderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
    camera.aspect = bounds.width / Math.max(1, bounds.height);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  const clock = new THREE.Clock();
  const frameInterval = 1000 / (lowPower ? 30 : 55);
  let previousFrame = 0;
  const animate = now => {
    requestAnimationFrame(animate);
    if (!inViewport || document.hidden || now - previousFrame < frameInterval) return;
    previousFrame = now;
    const time = clock.getElapsedTime();
    const movement = reducedMotion ? 0 : 1;
    const autoYaw = Math.sin(time * .38) * .13 * movement;
    const targetY = -.34 + autoYaw + pointerX * .38 + manualYaw;
    const targetX = .08 + pointerY * .2 + manualPitch;
    device.rotation.y += (targetY - device.rotation.y) * .075;
    device.rotation.x += (targetX - device.rotation.x) * .075;
    device.rotation.z = Math.sin(time * .42) * .014 * movement;
    device.position.y = Math.sin(time * .62) * .07 * movement;
    const screenDepth = exploded ? 1.05 : .37;
    screen.position.z += ((screenDepth + Math.sin(time * .9) * .018 * movement) - screen.position.z) * .075;
    innerGlow.position.z += (((exploded ? .52 : .22)) - innerGlow.position.z) * .075;
    board.position.z += (((exploded ? .05 : .18)) - board.position.z) * .075;
    island.position.z = screen.position.z + .1;
    sensor.position.z = island.position.z + .05;
    scanner.position.z = screen.position.z + .17;
    scanner.position.y = reducedMotion ? 0 : ((time * .78) % 6.4) - 3.2;
    scanner.material.opacity = reducedMotion ? .28 : .34 + Math.sin(time * 3) * .12;
    ringGroup.rotation.z = time * .055 * movement;
    ringGroup.rotation.y = Math.sin(time * .32) * .08 * movement;
    particles.rotation.z = time * .012 * movement;
    renderer.render(scene, camera);
  };

  heroVisual.classList.add('is-3d-ready');
  requestAnimationFrame(animate);
}
