/* =========================================================================
   =========================================================================
   ✨ LOGO OFICIAL 'EV' EN PARTÍCULAS 3D · EVA VIDAL NUTRICIÓN
   WebGL (Three.js) + Micro-Relieve Táctil 3D + GSAP + Lenis + Mobile
   Estilo: High-End Creative WebGL / Quiet Luxury Stardust Experience
   ========================================================================= */

const SPATIAL_CONFIG = {
  // 1. ARCHIVO 3D EXTERNO (.GLB O .GLTF) OPCIONAL:
  MODEL_URL: '',

  // 2. ESCALA GENERAL DEL LOGO EN EL HERO:
  MODEL_SCALE: 1.15,

  // 3. POSICIÓN BASE EN EL HERO:
  MODEL_BASE_POSITION: { x: 2.35, y: -0.05, z: 0 },

  // 4. MOVIMIENTO SUAVE Y LENTO (EL LOGO SE MANTIENE ESTABLE Y LEGIBLE):
  SWAY_SPEED: 0.14,
  SWAY_ANGLE_Y: 0.035,
  SWAY_ANGLE_X: 0.015,

  // 5. EFECTO DE LEVITACIÓN Y RESPIRACIÓN:
  FLOAT_AMPLITUDE: 0.06,
  FLOAT_SPEED: 0.9,

  // 6. SENSIBILIDAD AL RATÓN (PARALLAX CON LERP FLUIDO):
  MOUSE_TILT_INTENSITY: 0.05,
  MOUSE_LERP_FACTOR: 0.015,

  // 7. MICRO-INTERACCIÓN 3D (ILUMINACIÓN Y RELIEVE SIN DEFORMAR EL LOGO):
  ZOOM_RADIUS: 0.35,        // Radio enfocado bajo el cursor o dedo
  ZOOM_DEPTH_Z: 0.12,       // Elevación Z sutil hacia el usuario
  SWIRL_ENVELOPE: 0.005,    // Micro-desplazamiento casi nulo (¡cero deformación de letras!)
  SMOOTH_LERP_SPEED: 0.04, // Interpolación líquida continua a 60-120 FPS

  // 8. AMBIENTE ESPACIAL EN TODA LA WEB:
  AMBIENT_PARTICLES_COUNT: 280
};

/* =========================================================================
   MOTOR 3D Y CONTROLADORES ESPACIALES
   ========================================================================= */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.warn('[Spatial 3D] Three.js no está disponible.');
    return;
  }

  let canvas = document.getElementById('webgl-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'webgl-canvas';
    document.body.prepend(canvas);
  }

  /* ── 1. ESCENA, CÁMARA Y RENDERER ──────────────────────────────────────── */
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    150
  );
  camera.position.set(0, 0, 8.2);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  if (THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  /* ── 2. ILUMINACIÓN CINEMATOGRÁFICA ────────────────────────────────────── */
  const ambientLight = new THREE.AmbientLight(0x101a2c, 2.5);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(6, 8, 5);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x88b4f0, 5.5, 35);
  rimLight.position.set(-5, 3, -2);
  scene.add(rimLight);

  const mouseLight = new THREE.PointLight(0xb2d6fc, 2.8, 10);
  mouseLight.position.set(0, 0, 3);
  scene.add(mouseLight);

  /* ── 3. JERARQUÍA DEL MODELO 3D (VINCULADO AL HERO) ────────────────────── */
  const isMobile = window.innerWidth <= 768;

  const modelRoot = new THREE.Group();
  const startX = isMobile ? 0 : SPATIAL_CONFIG.MODEL_BASE_POSITION.x;
  const startY = isMobile ? -0.55 : SPATIAL_CONFIG.MODEL_BASE_POSITION.y;
  const startZ = isMobile ? -0.4 : SPATIAL_CONFIG.MODEL_BASE_POSITION.z;
  modelRoot.position.set(startX, startY, startZ);
  scene.add(modelRoot);

  const modelPivot = new THREE.Group();
  modelRoot.add(modelPivot);

  const modelSpin = new THREE.Group();
  modelPivot.add(modelSpin);

  /* ── 4. TEXTURA CIRCULAR SUAVE DE POLVO ESTELAR (STARDUST) ─────────────── */
  function createStardustTexture() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    g.addColorStop(0.25, 'rgba(230, 245, 255, 0.9)');
    g.addColorStop(0.55, 'rgba(136, 180, 240, 0.35)');
    g.addColorStop(1, 'rgba(136, 180, 240, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  const stardustTexture = createStardustTexture();

  /* ── 5. LOGO OFICIAL 'EV' EN 22.000 PARTÍCULAS ULTRA-FINAS ─────────────── */
  let evGeometry, evPositions, evOrigins;
  let hasEvParticles = false;

  if (window.EV_LOGO_PARTICLES && window.EV_LOGO_PARTICLES.length > 0) {
    const rawCoords = window.EV_LOGO_PARTICLES;
    const totalCount = rawCoords.length / 3;

    evPositions = new Float32Array(rawCoords.length);
    evOrigins = new Float32Array(rawCoords.length);

    const scale = isMobile ? SPATIAL_CONFIG.MODEL_SCALE * 0.92 : SPATIAL_CONFIG.MODEL_SCALE;

    for (let i = 0; i < rawCoords.length; i += 3) {
      const ox = rawCoords[i] * scale;
      const oy = rawCoords[i + 1] * scale;
      const oz = rawCoords[i + 2] * scale;

      evOrigins[i] = ox;
      evOrigins[i + 1] = oy;
      evOrigins[i + 2] = oz;

      evPositions[i] = ox;
      evPositions[i + 1] = oy;
      evPositions[i + 2] = oz;
    }

    evGeometry = new THREE.BufferGeometry();
    evGeometry.setAttribute('position', new THREE.BufferAttribute(evPositions, 3));

    const evMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.044 : 0.038,
      map: stardustTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffffff
    });

    const evParticleMesh = new THREE.Points(evGeometry, evMaterial);
    modelSpin.add(evParticleMesh);
    hasEvParticles = true;
    console.log(`[Spatial 3D] Logo oficial 'EV' cargado con ${totalCount} partículas fieles.`);
  }

  /* ── 6. CARGADOR DE MODELOS EXTERNOS .GLTF / .GLB (OPCIONAL) ──────────── */
  if (SPATIAL_CONFIG.MODEL_URL && SPATIAL_CONFIG.MODEL_URL.trim() !== '') {
    if (typeof THREE.GLTFLoader !== 'undefined') {
      const loader = new THREE.GLTFLoader();
      loader.load(
        SPATIAL_CONFIG.MODEL_URL,
        function (gltf) {
          const loadedScene = gltf.scene;
          const box = new THREE.Box3().setFromObject(loadedScene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const normalizedScale = (2.5 / maxDim) * SPATIAL_CONFIG.MODEL_SCALE;

          loadedScene.position.sub(center);
          loadedScene.scale.set(normalizedScale, normalizedScale, normalizedScale);

          modelSpin.clear();
          modelSpin.add(loadedScene);
          hasEvParticles = false;
        }
      );
    }
  }

  /* ── 7. ECOSISTEMA 3D AMBIENTAL (PARTÍCULAS SUAVES SIN CUADRADOS) ───────── */
  const particlesCount = SPATIAL_CONFIG.AMBIENT_PARTICLES_COUNT;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount; i++) {
    particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 32;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0x88b4f0,
    size: 0.045,
    map: stardustTexture,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  /* ── 8. LENIS SMOOTH SCROLL & BARRA ESTABLE ─────────────────────────────── */
  let lenisInstance = null;
  if (typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
      smoothTouch: false
    });

    const mainNav = document.getElementById('main-nav');

    lenisInstance.on('scroll', function (e) {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.update();
      }

      // Al scrollear: oscurece el fondo de la nav discretamente sin cambiar ancho
      if (mainNav) {
        if (e.scroll > 40) {
          mainNav.classList.add('nav-scrolled');
        } else {
          mainNav.classList.remove('nav-scrolled');
        }
      }
    });

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add(function (time) {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ── 9. SCROLLTRIGGER: VINCULADO EXCLUSIVAMENTE AL HERO ─────────────────── */
  
  // PATCH: Hide the massive EV logo on subpages, keep only ambient stardust
  if (!document.getElementById('inicio')) {
    modelRoot.visible = false;
  }

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const heroSection = document.getElementById('inicio');

    if (heroSection) {
      const tlHero = gsap.timeline({
        scrollTrigger: {
          trigger: '#inicio',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.0,
          onLeave: function () {
            modelRoot.visible = false;
          },
          onEnterBack: function () {
            modelRoot.visible = true;
          }
        }
      });

      tlHero.to(modelRoot.position, {
        y: 6.8,
        x: startX + 0.5,
        z: -2.0,
        ease: 'power1.in'
      }, 0);

      tlHero.to(modelSpin.rotation, {
        y: Math.PI * 0.8,
        x: 0.16,
        ease: 'none'
      }, 0);

      tlHero.to(modelRoot.scale, {
        x: 0.25,
        y: 0.25,
        z: 0.25,
        ease: 'power1.in'
      }, 0);

      gsap.to(particleSystem.rotation, {
        y: Math.PI * 0.8,
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2.0
        }
      });
    }

    setTimeout(function() {
      ScrollTrigger.refresh();
    }, 400);
  }

  /* ── 10. INTERACCIÓN CON RATÓN Y PANTALLA TÁCTIL MÓVIL ─────────────────── */
  const raycaster = new THREE.Raycaster();
  const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouseNormalized = new THREE.Vector2(-999, -999);
  const worldIntersect = new THREE.Vector3();

  const targetLocalMouse = new THREE.Vector2(-999, -999);
  const smoothLocalMouse = new THREE.Vector2(-999, -999);

  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;
  let isPointerOverLogo = false;

  function updatePointer3D(clientX, clientY) {
    targetMouseX = (clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(clientY / window.innerHeight) * 2 + 1;

    mouseNormalized.x = targetMouseX;
    mouseNormalized.y = targetMouseY;

    raycaster.setFromCamera(mouseNormalized, camera);
    mousePlane.constant = -modelRoot.position.z;

    if (raycaster.ray.intersectPlane(mousePlane, worldIntersect)) {
      const tempVec = worldIntersect.clone();
      modelSpin.worldToLocal(tempVec);

      targetLocalMouse.x = tempVec.x;
      targetLocalMouse.y = tempVec.y;

      mouseLight.position.set(worldIntersect.x, worldIntersect.y, worldIntersect.z + 1.0);

      isPointerOverLogo = Math.abs(tempVec.x) < 2.2 && Math.abs(tempVec.y) < 2.2;
    }
  }

  window.addEventListener('mousemove', function (e) {
    updatePointer3D(e.clientX, e.clientY);
  });

  window.addEventListener('mouseleave', function () {
    isPointerOverLogo = false;
    targetLocalMouse.set(-999, -999);
  });

  window.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length > 0) {
      updatePointer3D(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 0) {
      updatePointer3D(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchend', function () {
    isPointerOverLogo = false;
    targetLocalMouse.set(-999, -999);
  }, { passive: true });

  /* ── 11. TRANSICIONES LIMPIAS AL CAMBIAR DE PESTAÑA ─────────────────────── */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      isPointerOverLogo = false;
      targetLocalMouse.set(-999, -999);
      smoothLocalMouse.set(-999, -999);
    } else {
      clock.start();
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }
  });

  /* ── 12. BUCLE DE RENDERIZADO (RELIEVE TÁCTIL QUE NO DEFORMA EL LOGO) ──── */
  const clock = new THREE.Clock();

  function renderLoop() {
    requestAnimationFrame(renderLoop);

    const elapsedTime = clock.getElapsedTime();

    if (modelRoot.visible) {
      // Inclinación orgánica sutil
      currentMouseX += (targetMouseX - currentMouseX) * SPATIAL_CONFIG.MOUSE_LERP_FACTOR;
      currentMouseY += (targetMouseY - currentMouseY) * SPATIAL_CONFIG.MOUSE_LERP_FACTOR;

      modelPivot.rotation.x = currentMouseY * SPATIAL_CONFIG.MOUSE_TILT_INTENSITY;
      modelPivot.rotation.y = currentMouseX * SPATIAL_CONFIG.MOUSE_TILT_INTENSITY;

      // Flotación pausada
      modelPivot.position.y = Math.sin(elapsedTime * SPATIAL_CONFIG.FLOAT_SPEED) * SPATIAL_CONFIG.FLOAT_AMPLITUDE;

      // Balanceo ultra-sutil (el logo permanece estable, frontal y legible)
      modelSpin.rotation.y = Math.sin(elapsedTime * SPATIAL_CONFIG.SWAY_SPEED) * SPATIAL_CONFIG.SWAY_ANGLE_Y;
      modelSpin.rotation.x = Math.cos(elapsedTime * (SPATIAL_CONFIG.SWAY_SPEED * 0.85)) * SPATIAL_CONFIG.SWAY_ANGLE_X;

      // Suavizado LERP del cursor
      if (isPointerOverLogo) {
        smoothLocalMouse.x += (targetLocalMouse.x - smoothLocalMouse.x) * 0.12;
        smoothLocalMouse.y += (targetLocalMouse.y - smoothLocalMouse.y) * 0.12;
      } else {
        smoothLocalMouse.x += (-999 - smoothLocalMouse.x) * 0.12;
        smoothLocalMouse.y += (-999 - smoothLocalMouse.y) * 0.12;
      }

      /* ── MICRO-INTERACCIÓN TÁCTIL: RELIEVE 3D SIN DEFORMAR EL LOGO ─────── */
      if (hasEvParticles && evPositions && evOrigins) {
        const radius = SPATIAL_CONFIG.ZOOM_RADIUS;
        const radiusSq = radius * radius;
        const zoomZ = SPATIAL_CONFIG.ZOOM_DEPTH_Z;
        const microSwirl = SPATIAL_CONFIG.SWIRL_ENVELOPE;
        const lerpSpeed = SPATIAL_CONFIG.SMOOTH_LERP_SPEED;

        const mx = smoothLocalMouse.x;
        const my = smoothLocalMouse.y;
        const active = isPointerOverLogo;

        const len = evPositions.length;

        for (let i = 0; i < len; i += 3) {
          let px = evPositions[i];
          let py = evPositions[i + 1];
          let pz = evPositions[i + 2];

          const ox = evOrigins[i];
          const oy = evOrigins[i + 1];
          const oz = evOrigins[i + 2];

          let targetX = ox;
          let targetY = oy;
          let targetZ = oz;

          if (active) {
            const dx = ox - mx;
            const dy = oy - my;
            const distSq = dx * dx + dy * dy;

            if (distSq < radiusSq) {
              const dist = Math.sqrt(distSq);
              // Factor smoothstep suave
              const u = 1.0 - dist / radius;
              const factor = u * u * (3.0 - 2.0 * u);

              // 1. RELIEVE 3D: Las partículas se elevan suavemente hacia el usuario
              targetZ = oz + factor * zoomZ;

              // 2. MICRO-DISPERSIÓN IMPERCEPTIBLE: Las letras jamás se deforman
              targetX = ox + Math.cos(Math.atan2(dy, dx)) * (factor * microSwirl);
              targetY = oy + Math.sin(Math.atan2(dy, dx)) * (factor * microSwirl);
            }
          }

          // Respiración suave en reposo
          if (!active) {
            targetZ = oz + Math.sin(elapsedTime * 1.4 + i * 0.12) * 0.010;
          }

          // LERP matemático continuo: 0 saltitos, 0 tirones
          px += (targetX - px) * lerpSpeed;
          py += (targetY - py) * lerpSpeed;
          pz += (targetZ - pz) * lerpSpeed;

          evPositions[i] = px;
          evPositions[i + 1] = py;
          evPositions[i + 2] = pz;
        }

        evGeometry.attributes.position.needsUpdate = true;
      }
    }

    particleSystem.rotation.y += 0.0003;

    renderer.render(scene, camera);
  }

  renderLoop();

  /* ── 13. REDIMENSIONAMIENTO RESPONSIVE ─────────────────────────────────── */
  window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });

  console.log('[Spatial 3D] Logo oficial EV activado: silueta exacta, relieve táctil sin deformación y diseño sobrio.');
})();
