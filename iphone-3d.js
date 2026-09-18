const stage = document.querySelector('.hero-3d-stage');
const heroVisual = document.querySelector('.hero-visual');
const canvas = document.getElementById('iphone-3d');

if (stage && heroVisual && canvas && 'WebGLRenderingContext' in window) {
  import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js')
    .then(THREE => startScene(THREE))
    .catch(() => heroVisual.classList.add('is-3d-fallback'));
}

function startScene(THREE) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compact = window.matchMedia('(max-width: 680px)').matches;
  const lowPower = compact || (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.65;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.05, compact ? 15.6 : 12.8);

  scene.add(new THREE.HemisphereLight(0x8edbff, 0x080015, 2.2));
  const cyanLight = new THREE.PointLight(0x00d9ff, 40, 20, 2);
  cyanLight.position.set(-4, 4, 6);
  scene.add(cyanLight);
  const violetLight = new THREE.PointLight(0x784cff, 48, 20, 2);
  violetLight.position.set(4, -2.5, 5);
  scene.add(violetLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 2.7);
  rimLight.position.set(1, 3, 6);
  scene.add(rimLight);

  const device = new THREE.Group();
  scene.add(device);

  const roundedShape = (width, height, radius) => {
    const x = -width / 2, y = -height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  };

  const roundedSolid = (width, height, depth, radius, material, bevel = 0.055) => {
    const geometry = new THREE.ExtrudeGeometry(roundedShape(width, height, radius), {
      depth, bevelEnabled: true, bevelSegments: compact ? 4 : 6, steps: 1,
      bevelSize: bevel, bevelThickness: bevel, curveSegments: compact ? 14 : 20
    });
    geometry.center();
    return new THREE.Mesh(geometry, material);
  };

  const frameMaterial = new THREE.MeshPhysicalMaterial({ color: 0x183a58, emissive: 0x001428, emissiveIntensity: .55, metalness: 0.92, roughness: 0.19, clearcoat: 1, clearcoatRoughness: 0.12 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x020712, metalness: 0.18, roughness: 0.08, transmission: 0.12, clearcoat: 1 });
  const chassis = roundedSolid(3.7, 7.35, 0.46, 0.48, frameMaterial);
  chassis.position.z = -0.28;
  device.add(chassis);
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 640; screenCanvas.height = 1280;
  const context = screenCanvas.getContext('2d');
  const gradient = context.createLinearGradient(40, 0, 600, 1280);
  gradient.addColorStop(0, '#020611'); gradient.addColorStop(.46, '#06152e'); gradient.addColorStop(.76, '#081b3e'); gradient.addColorStop(1, '#070b1c');
  context.fillStyle = gradient; context.fillRect(0, 0, 640, 1280);
  const cyanGlow = context.createRadialGradient(470, 360, 15, 470, 360, 430);
  cyanGlow.addColorStop(0, 'rgba(0,220,255,.46)'); cyanGlow.addColorStop(.42, 'rgba(0,100,255,.16)'); cyanGlow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = cyanGlow; context.fillRect(0, 0, 640, 1280);
  const violetGlow = context.createRadialGradient(150, 990, 20, 150, 990, 390);
  violetGlow.addColorStop(0, 'rgba(105,50,255,.32)'); violetGlow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = violetGlow; context.fillRect(0, 0, 640, 1280);
  context.strokeStyle = 'rgba(73,224,255,.09)'; context.lineWidth = 1;
  for (let x = 0; x <= 640; x += 64) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 1280); context.stroke(); }
  for (let y = 0; y <= 1280; y += 64) { context.beginPath(); context.moveTo(0, y); context.lineTo(640, y); context.stroke(); }
  context.strokeStyle = 'rgba(73,224,255,.22)'; context.lineWidth = 3;
  context.beginPath(); context.arc(320, 640, 205, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = 'rgba(115,82,255,.18)'; context.lineWidth = 2;
  context.beginPath(); context.arc(320, 640, 250, 0, Math.PI * 2); context.stroke();
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const display = roundedSolid(3.42, 7.02, 0.085, 0.4, new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }), .025);
  display.position.z = 0.12;
  device.add(display);

  const logoTexture = new THREE.TextureLoader().load(new URL('assets/img-tech-logo-v2.png', document.baseURI).href);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const phoneLogo = new THREE.Mesh(
    new THREE.CircleGeometry(1.14, 64),
    new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, toneMapped: false, depthWrite: false })
  );
  phoneLogo.position.set(0, -.05, .105);
  display.add(phoneLogo);

  const notch = roundedSolid(1.15, 0.25, 0.07, 0.13, glassMaterial, .015);
  notch.position.set(0, 3.05, 0.24);
  device.add(notch);

  const componentBase = roundedSolid(3.15, 6.75, 0.12, 0.32, new THREE.MeshStandardMaterial({ color: 0x17496d, emissive: 0x00223c, emissiveIntensity: .85, metalness: .72, roughness: .3 }), .025);
  componentBase.position.z = -0.2;
  device.add(componentBase);

  const battery = roundedSolid(1.72, 3.55, 0.16, 0.22, new THREE.MeshStandardMaterial({ color: 0x244b64, metalness: .42, roughness: .34, emissive: 0x003953, emissiveIntensity: .72 }), .02);
  battery.position.set(-.35, -.6, -.16);
  device.add(battery);
  const batteryMark = new THREE.Mesh(new THREE.RingGeometry(.18, .26, 32), new THREE.MeshBasicMaterial({ color: 0x20d9ff, transparent: true, opacity: .8, side: THREE.DoubleSide }));
  batteryMark.position.set(-.35, -.6, -.05);
  device.add(batteryMark);

  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x087d78, metalness: .62, roughness: .3, emissive: 0x004a48, emissiveIntensity: .8 });
  const board = roundedSolid(.92, 3.7, .18, .13, boardMaterial, .018);
  board.position.set(1.02, .85, -.17);
  device.add(board);
  const chips = [];
  for (let index = 0; index < 7; index += 1) {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(.44, .3, .08), new THREE.MeshStandardMaterial({ color: index % 2 ? 0x172337 : 0x263850, metalness: .8, roughness: .25 }));
    chip.position.set(1.02, -.45 + index * .48, -.04);
    chips.push(chip);
    device.add(chip);
  }

  const cameraCluster = new THREE.Group();
  [[-.78, 2.48], [-.05, 2.48], [-.42, 1.8]].forEach(([x, y]) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .18, 32), new THREE.MeshPhysicalMaterial({ color: 0x101827, metalness: .9, roughness: .12 }));
    ring.rotation.x = Math.PI / 2; ring.position.set(x, y, .13); cameraCluster.add(ring);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(.24, 32), new THREE.MeshPhysicalMaterial({ color: 0x010207, roughness: .03, clearcoat: 1, emissive: 0x08154a, emissiveIntensity: .7 }));
    lens.position.set(x, y, .24); cameraCluster.add(lens);
  });
  cameraCluster.position.z = -.55;
  device.add(cameraCluster);

  const scanCanvas = document.createElement('canvas');
  scanCanvas.width = 256; scanCanvas.height = 32;
  const scanContext = scanCanvas.getContext('2d');
  const scanGradient = scanContext.createLinearGradient(0, 0, 0, 32);
  scanGradient.addColorStop(0, 'rgba(30,220,255,0)');
  scanGradient.addColorStop(.5, 'rgba(90,235,255,.8)');
  scanGradient.addColorStop(1, 'rgba(30,220,255,0)');
  scanContext.fillStyle = scanGradient; scanContext.fillRect(0, 0, 256, 32);
  const scanTexture = new THREE.CanvasTexture(scanCanvas);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(2.82, .1), new THREE.MeshBasicMaterial({ map: scanTexture, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false }));
  scan.position.z = .3;
  device.add(scan);

  const pointCount = lowPower ? 48 : 110;
  const positions = new Float32Array(pointCount * 3);
  for (let index = 0; index < pointCount; index += 1) {
    positions[index * 3] = (Math.random() - .5) * 11;
    positions[index * 3 + 1] = (Math.random() - .5) * 11;
    positions[index * 3 + 2] = (Math.random() - .5) * 5 - 2;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x31cfff, size: .025, transparent: true, opacity: .65, blending: THREE.AdditiveBlending }));
  scene.add(particles);

  let pointerX = 0, pointerY = 0, inViewport = true;
  stage.addEventListener('pointermove', event => {
    const rect = stage.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; }, { passive: true });
  const visibility = new IntersectionObserver(entries => { inViewport = entries[0]?.isIntersecting ?? true; }, { rootMargin: '180px' });
  visibility.observe(stage);

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  const clock = new THREE.Clock();
  const frameInterval = 1000 / (lowPower ? 30 : 50);
  let previousFrame = 0;
  const animate = now => {
    requestAnimationFrame(animate);
    if (!inViewport || document.hidden || now - previousFrame < frameInterval) return;
    previousFrame = now;
    const time = clock.getElapsedTime();
    const movement = reducedMotion ? 0 : 1;
    device.rotation.y += ((-.24 + pointerX * .14) - device.rotation.y) * .045;
    device.rotation.x += ((-.11 + pointerY * .11) - device.rotation.x) * .045;
    device.rotation.z = Math.sin(time * .52) * .018 * movement;
    device.position.y = Math.sin(time * .7) * .08 * movement;
    scan.position.y = reducedMotion ? 0 : ((time * .82) % 6.2) - 3.1;
    scan.material.opacity = reducedMotion ? .2 : .2 + Math.sin(time * 3.2) * .08;
    particles.rotation.y = time * .018 * movement;
    particles.rotation.z = time * .012 * movement;
    renderer.render(scene, camera);
  };

  heroVisual.classList.add('is-3d-ready');
  requestAnimationFrame(animate);
}
