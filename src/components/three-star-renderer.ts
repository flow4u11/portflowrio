import { BufferAttribute, BufferGeometry, Color, PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from 'three';

export type SpatialStarConfig = { color: string; count: number; speed: number; scale: number; reduced: boolean };

/** One point cloud, one draw call, no textures, postprocessing or frame React work. */
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
  let config = initial;
  let disposed = false;
  let frame = 0;
  let resizeFrame = 0;
  let last = 0;
  let phase = 0;
  let visible = true;
  let pageDepth = 0;
  const pointer = { x: 0, y: 0 };
  const mobile = matchMedia('(pointer: coarse)').matches;
  const paint = () => {
    if (disposed || document.hidden || !visible) return;
    camera.position.x += (pointer.x * .7 - camera.position.x) * .07;
    camera.position.y += ((pointer.y * .45 - pageDepth * .7) - camera.position.y) * .07;
    cloud.rotation.y += (pointer.x * .012 - cloud.rotation.y) * .07;
    material.uniforms.uTime.value = phase;
    renderer.render(scene, camera);
  };
  const tick = (now: number) => {
    if (disposed || document.hidden || !visible || config.reduced) return;
    if (!last || now - last >= 1000 / 30 - 1) {
      phase += last ? Math.min(.1, (now - last) / 1000) * config.speed : 0;
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
    material.uniforms.uScale.value = next.scale;
    canvas.dataset.starScale = String(next.scale);
    material.uniforms.uColor.value.set(next.color);
    const count = Math.min(mobile || innerWidth < 600 ? 120 : 240, Math.max(20, next.count));
    geometry.setDrawRange(0, count);
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
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  });
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
  observer.observe(canvas);
  visibility.observe(canvas);
  document.addEventListener('visibilitychange', resume);
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
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('webglcontextlost', onLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
