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
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !compact, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.65;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.05, compact ? 13.6 : 12.2);

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
      depth, bevelEnabled: true, bevelSegments: compact ? 2 : 5, steps: 1,
      bevelSize: bevel, bevelThickness: bevel, curveSegments: compact ? 8 : 16
    });
    geometry.center();
    return new THREE.Mesh(geometry, material);
  };

  const frameMaterial = new THREE.MeshPhysicalMaterial({ color: 0x315b83, emissive: 0x00152f, emissiveIntensity: .7, metalness: 0.88, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.16 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x020712, metalness: 0.18, roughness: 0.08, transmission: 0.12, clearcoat: 1 });
  const chassis = roundedSolid(3.7, 7.35, 0.46, 0.48, frameMaterial);
  chassis.position.z = -0.28;
  device.add(chassis);
  const frameGlow = new THREE.LineSegments(new THREE.EdgesGeometry(chassis.geometry, 18), new THREE.LineBasicMaterial({ color: 0x42dcff, transparent: true, opacity: .62 }));
  chassis.add(frameGlow);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 640; screenCanvas.height = 1280;
  const context = screenCanvas.getContext('2d');
  const gradient = context.createLinearGradient(60, 0, 580, 1280);
  gradient.addColorStop(0, '#020714'); gradient.addColorStop(.42, '#032348'); gradient.addColorStop(.68, '#162b88'); gradient.addColorStop(1, '#4a117e');
  context.fillStyle = gradient; context.fillRect(0, 0, 640, 1280);
  const glow = context.createRadialGradient(430, 420, 20, 430, 420, 470);
  glow.addColorStop(0, 'rgba(0,230,255,.72)'); glow.addColorStop(.35, 'rgba(22,100,255,.28)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = glow; context.fillRect(0, 0, 640, 1280);
  context.strokeStyle = 'rgba(73,224,255,.16)'; context.lineWidth = 2;
  for (let y = 80; y < 1280; y += 80) { context.beginPath(); context.moveTo(0, y); context.lineTo(640, y); context.stroke(); }
  context.textAlign = 'center'; context.fillStyle = '#f6fbff'; context.font = '700 90px Arial'; context.fillText('IMG', 320, 630);
  context.fillStyle = '#55dcff'; context.font = '600 39px Arial'; context.letterSpacing = '18px'; context.fillText('T E C H', 320, 705);
  context.fillStyle = 'rgba(220,240,255,.65)'; context.font = '500 18px Arial'; context.fillText('PRECISÃO EM CADA CAMADA', 320, 765);
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const display = roundedSolid(3.42, 7.02, 0.085, 0.4, new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }), .025);
  display.position.z = 0.12;
  device.add(display);

  const notch = roundedSolid(1.15, 0.25, 0.07, 0.13, glassMaterial, .015);
  notch.position.set(0, 3.05, 0.24);
  device.add(notch);

  const componentBase = roundedSolid(3.15, 6.75, 0.12, 0.32, new THREE.MeshStandardMaterial({ color: 0x17496d, emissive: 0x00223c, emissiveIntensity: .85, metalness: .72, roughness: .3 }), .025);
  componentBase.position.z = -0.02;
  device.add(componentBase);

  const battery = roundedSolid(1.72, 3.55, 0.16, 0.22, new THREE.MeshStandardMaterial({ color: 0x244b64, metalness: .42, roughness: .34, emissive: 0x003953, emissiveIntensity: .72 }), .02);
  battery.position.set(-.35, -.6, .03);
  device.add(battery);
  const batteryMark = new THREE.Mesh(new THREE.RingGeometry(.18, .26, 32), new THREE.MeshBasicMaterial({ color: 0x20d9ff, transparent: true, opacity: .8, side: THREE.DoubleSide }));
  batteryMark.position.set(-.35, -.6, .13);
  device.add(batteryMark);

  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x087d78, metalness: .62, roughness: .3, emissive: 0x004a48, emissiveIntensity: .8 });
  const board = roundedSolid(.92, 3.7, .18, .13, boardMaterial, .018);
  board.position.set(1.02, .85, .05);
  device.add(board);
  const chips = [];
  for (let index = 0; index < 7; index += 1) {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(.44, .3, .08), new THREE.MeshStandardMaterial({ color: index % 2 ? 0x172337 : 0x263850, metalness: .8, roughness: .25 }));
    chip.position.set(1.02, -.45 + index * .48, .19);
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
  device.add(cameraCluster);

  const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.05, .035), new THREE.MeshBasicMaterial({ color: 0x59efff, transparent: true, opacity: .95, blending: THREE.AdditiveBlending }));
  scan.position.z = .3;
  device.add(scan);

  const pointCount = compact ? 80 : 170;
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

  let pointerX = 0, pointerY = 0, scrollProgress = 0, active = true;
  stage.addEventListener('pointermove', event => {
    const rect = stage.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; }, { passive: true });
  window.addEventListener('scroll', () => { scrollProgress = Math.min(1, window.scrollY / Math.max(360, window.innerHeight * .58)); }, { passive: true });

  const visibility = new IntersectionObserver(entries => { active = entries[0]?.isIntersecting ?? true; }, { rootMargin: '180px' });
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
  const animate = () => {
    requestAnimationFrame(animate);
    if (!active) return;
    const time = clock.getElapsedTime();
    const movement = reducedMotion ? 0 : 1;
    device.rotation.y += ((-.36 + pointerX * .17) - device.rotation.y) * .045;
    device.rotation.x += ((-.11 + pointerY * .11) - device.rotation.x) * .045;
    device.rotation.z = Math.sin(time * .52) * .018 * movement;
    device.position.y = Math.sin(time * .7) * .08 * movement;
    display.position.z += ((.12 + scrollProgress * 1.6) - display.position.z) * .055;
    display.position.x += ((scrollProgress * 1.15) - display.position.x) * .055;
    notch.position.z = display.position.z + .12;
    notch.position.x = display.position.x;
    scan.position.z = display.position.z + .17;
    scan.position.x = display.position.x;
    componentBase.position.z += ((-.02 + scrollProgress * .62) - componentBase.position.z) * .055;
    componentBase.position.x += ((scrollProgress * -.42) - componentBase.position.x) * .055;
    battery.position.z += ((.03 + scrollProgress * .86) - battery.position.z) * .055;
    battery.position.x += ((-.35 - scrollProgress * .82) - battery.position.x) * .055;
    batteryMark.position.z = battery.position.z + .1;
    batteryMark.position.x = battery.position.x;
    board.position.z += ((.05 + scrollProgress * 1.05) - board.position.z) * .055;
    board.position.x += ((1.02 + scrollProgress * .7) - board.position.x) * .055;
    chips.forEach(chip => { chip.position.x = board.position.x; chip.position.z = board.position.z + .14; });
    cameraCluster.position.z = scrollProgress * .98;
    scan.position.y = reducedMotion ? 0 : ((time * .82) % 6.2) - 3.1;
    scan.material.opacity = reducedMotion ? .5 : .45 + Math.sin(time * 3.2) * .35;
    particles.rotation.y = time * .018 * movement;
    particles.rotation.z = time * .012 * movement;
    renderer.render(scene, camera);
  };

  heroVisual.classList.add('is-3d-ready');
  animate();
}
