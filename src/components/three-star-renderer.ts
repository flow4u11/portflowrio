import { BufferAttribute, BufferGeometry, Color, LineSegments, PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from 'three';

export type SpatialStarConfig = { color: string; count: number; speed: number; scale: number; reduced: boolean };

/** One point cloud; finite navigation trails add one draw without frame React work. */
export function createSpatialStars(canvas: HTMLCanvasElement, initial: SpatialStarConfig, onFailure: () => void) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  const scene = new Scene();
  const camera = new PerspectiveCamera(48, 1, .1, 90);
  camera.position.z = 8;
  const geometry = new BufferGeometry();
  const positions = new Float32Array(240 * 3);
  const seeds = new Float32Array(240);
  for (let index = 0; index < 240; index++) {
    positions[index * 3] = (Math.random() - .5) * 72;
    positions[index * 3 + 1] = (Math.random() - .5) * 44;
    positions[index * 3 + 2] = -2 - Math.random() * 58;
    seeds[index] = .45 + Math.random() * .55;
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { uColor: { value: new Color(initial.color) }, uTime: { value: 0 }, uDensity: { value: 1 }, uScale: { value: initial.scale } },
    vertexShader: `attribute float aSeed; uniform float uTime; uniform float uDensity; uniform float uScale; varying float vAlpha;
      void main() {
        vec3 p = position;
        p.z = -mod(-p.z - uTime * 1.15, 58.0) - 2.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(65.0 / -mv.z, 1.0, 3.4) * mix(0.65, 1.5, aSeed) * uScale * uDensity;
        vAlpha = aSeed * smoothstep(2.0, 10.0, -p.z) * (1.0 - smoothstep(46.0, 60.0, -p.z));
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vAlpha;
      void main() {
        float distanceToCenter = length(gl_PointCoord - 0.5);
        float alpha = (1.0 - smoothstep(0.15, 0.5, distanceToCenter)) * vAlpha;
        gl_FragColor = vec4(uColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const cloud = new Points(geometry, material);
  cloud.frustumCulled = false;
  scene.add(cloud);
  // Each trail shares its head's position, seed, clock, color and camera.
  const trailGeometry = new BufferGeometry();
  const trailPositions = new Float32Array(240 * 6);
  const trailSeeds = new Float32Array(240 * 2);
  const tail = new Float32Array(240 * 2);
  for (let index = 0; index < 240; index++) {
    for (let end = 0; end < 2; end++) {
      trailPositions.set(positions.subarray(index * 3, index * 3 + 3), index * 6 + end * 3);
      trailSeeds[index * 2 + end] = seeds[index];
      tail[index * 2 + end] = end;
    }
  }
  trailGeometry.setAttribute('position', new BufferAttribute(trailPositions, 3));
  trailGeometry.setAttribute('aSeed', new BufferAttribute(trailSeeds, 1));
  trailGeometry.setAttribute('aTail', new BufferAttribute(tail, 1));
  const trailMaterial = new ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { uColor: material.uniforms.uColor, uTime: material.uniforms.uTime,
      uWarp: { value: 0 }, uDirection: { value: 1 } },
    vertexShader: `attribute float aSeed; attribute float aTail;
      uniform float uTime; uniform float uWarp; uniform float uDirection; varying float vAlpha;
      void main() {
        vec3 p = position;
        p.z = -mod(-p.z - uTime * 1.15, 58.0) - 2.0;
        vAlpha = aSeed * smoothstep(2.0, 10.0, -p.z)
          * (1.0 - smoothstep(46.0, 60.0, -p.z)) * uWarp * mix(0.9, 0.08, aTail);
        p.z = min(-2.0, p.z - aTail * uWarp * 12.0 * uDirection);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uColor, vAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const trails = new LineSegments(trailGeometry, trailMaterial);
  trails.frustumCulled = false;
  trails.visible = false;
  scene.add(trails);
  let config = initial;
  let disposed = false;
  let frame = 0;
  let resizeFrame = 0;
  let last = 0;
  let phase = 0;
  let visible = true;
  let pageDepth = 0;
  let warp: { began: number; duration: number; direction: number } | null = null;
  const stopWarp = () => {
    warp = null; trails.visible = false;
    trailMaterial.uniforms.uWarp.value = 0;
    delete canvas.dataset.warp;
    if (!disposed) paint();
  };
  const pointer = { x: 0, y: 0 };
  const mobile = matchMedia('(pointer: coarse)').matches;
  const paint = () => {
    if (disposed || document.hidden || !visible) return;
    camera.position.x += (pointer.x * .7 - camera.position.x) * .07;
    camera.position.y += ((pointer.y * .45 - pageDepth * .7) - camera.position.y) * .07;
    cloud.rotation.y += (pointer.x * .012 - cloud.rotation.y) * .07;
    material.uniforms.uTime.value = phase;
    trails.rotation.copy(cloud.rotation);
    renderer.render(scene, camera);
  };
  const tick = (now: number) => {
    if (disposed || document.hidden || !visible || config.reduced) return;
    if (!last || now - last >= 1000 / 30 - 1) {
      const progress = warp ? Math.min(1, (now - warp.began) / warp.duration) : 1;
      const strength = warp ? Math.sin(Math.PI * progress) ** 2 : 0;
      const direction = warp?.direction ?? 1;
      phase += last ? Math.min(.1, (now - last) / 1000) * config.speed * (1 + strength * 32 * direction) : 0;
      trails.visible = strength > .001;
      trailMaterial.uniforms.uWarp.value = strength;
      trailMaterial.uniforms.uDirection.value = direction;
      if (warp) canvas.dataset.warp = strength.toFixed(3);
      if (progress >= 1 && warp) stopWarp();
      last = now;
      paint();
    }
    frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    cancelAnimationFrame(frame);
    last = 0;
    paint();
    if (!disposed && !document.hidden && visible && !config.reduced) frame = requestAnimationFrame(tick);
  };
  const update = (next: SpatialStarConfig) => {
    config = next;
    if (next.reduced) stopWarp();
    material.uniforms.uScale.value = next.scale;
    canvas.dataset.starScale = String(next.scale);
    material.uniforms.uColor.value.set(next.color);
    const count = Math.min(mobile || innerWidth < 600 ? 120 : 240, Math.max(20, next.count));
    geometry.setDrawRange(0, count);
    trailGeometry.setDrawRange(0, count * 2);
    canvas.dataset.starCount = String(count);
    canvas.dataset.starSpeed = String(next.speed);
    resume();
  };
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const density = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.25, Math.sqrt(900_000 / (width * height)));
    renderer.setPixelRatio(density);
    renderer.setSize(width, height, false);
    material.uniforms.uDensity.value = density;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    update(config);
  };
  const onPointer = (event: PointerEvent) => {
    if (config.reduced || event.pointerType === 'touch') return;
    pointer.x = (event.clientX / innerWidth - .5) * 2;
    pointer.y = -((event.clientY / innerHeight - .5) * 2);
  };
  const onScroll = () => { pageDepth = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); };
  const onLost = (event: Event) => { event.preventDefault(); onFailure(); };
  const onNavigation = (event: Event) => {
    const detail = (event as CustomEvent<{ duration: number; direction: number; warp: boolean }>).detail;
    if (!detail.warp || config.reduced || document.hidden) return;
    warp = { began: performance.now(), duration: detail.duration, direction: detail.direction };
  };
  const onVisibility = () => { if (document.hidden) stopWarp(); resume(); };
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  });
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
  observer.observe(canvas);
  visibility.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('portfolio:navigation-start', onNavigation);
  window.addEventListener('portfolio:navigation-end', stopWarp);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  canvas.addEventListener('webglcontextlost', onLost);
  onScroll();
  resize();
  canvas.dataset.renderer = 'three';
  return {
    update,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('portfolio:navigation-start', onNavigation);
      window.removeEventListener('portfolio:navigation-end', stopWarp);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('webglcontextlost', onLost);
      geometry.dispose();
      material.dispose();
      trailGeometry.dispose();
      trailMaterial.dispose();
      renderer.dispose();
    },
  };
}
