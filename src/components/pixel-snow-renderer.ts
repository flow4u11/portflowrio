import { Color, GLSL3, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three';
import { fragmentShader, vertexShader } from './pixel-snow-shaders';

export type PixelSnowConfig = {
  color: string; speed: number; density: number; flakeSize: number;
  pixelResolution: number; direction: number; variant: 'square' | 'round' | 'snowflake';
  brightness: number; depth: number;
};

/** Supplied ReactBits shader, bounded to one small framebuffer and 30 paints/s. */
export function createPixelSnow(canvas: HTMLCanvasElement, initial: PixelSnowConfig, onFailure: () => void, onReady: () => void) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power', stencil: false, depth: false });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  let shaderFailed = false;
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    shaderFailed = true;
    console.warn('Pixel snow shader failed:', gl.getShaderInfoLog(vertex) || gl.getShaderInfoLog(fragment) || gl.getProgramInfoLog(program));
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader, fragmentShader, glslVersion: GLSL3,
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uResolution: { value: new Vector2(1, 1) },
      uFlakeSize: { value: initial.flakeSize }, uMinFlakeSize: { value: 1.25 },
      uPixelResolution: { value: initial.pixelResolution }, uSpeed: { value: 1 },
      uDepthFade: { value: 8 }, uFarPlane: { value: initial.depth },
      uColor: { value: new Color(initial.color) }, uBrightness: { value: initial.brightness },
      uGamma: { value: 0.4545 }, uDensity: { value: initial.density },
      uVariant: { value: 0 }, uDirection: { value: initial.direction * Math.PI / 180 },
    },
  });
  scene.add(new Mesh(geometry, material));
  let config = initial;
  let disposed = false;
  let failed = false;
  let frame = 0;
  let resizeFrame = 0;
  let previous = 0;
  let phase = 0;
  let visible = true;
  let initialized = false;
  let ready = false;
  const fail = () => { if (!failed && !disposed) { failed = true; cancelAnimationFrame(frame); onFailure(); } };
  const paint = () => {
    if (disposed || failed || document.hidden || !visible) return;
    try {
      material.uniforms.uTime.value = phase;
      renderer.render(scene, camera);
      if (shaderFailed) fail();
      else if (!ready) { ready = true; onReady(); }
    } catch { fail(); }
  };
  const tick = (now: number) => {
    if (disposed || failed || document.hidden || !visible) return;
    if (!previous || now - previous >= 1000 / 30 - 1) {
      phase += previous ? Math.min(0.1, (now - previous) / 1000) * config.speed : 0;
      previous = now;
      paint();
    }
    if (!failed) frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    if (!disposed && !failed && !document.hidden && visible) { paint(); if (!failed) frame = requestAnimationFrame(tick); }
  };
  const resize = () => {
    if (disposed || failed) return;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const mobile = width < 641 || matchMedia('(pointer: coarse)').matches;
    const density = Math.min(1, config.pixelResolution * 2 / width, Math.sqrt((mobile ? 90_000 : 180_000) / (width * height)));
    const renderWidth = Math.max(1, Math.floor(width * density));
    const renderHeight = Math.max(1, Math.floor(height * density));
    renderer.setSize(renderWidth, renderHeight, false);
    material.uniforms.uResolution.value.set(renderWidth, renderHeight);
    canvas.dataset.snowPixels = String(renderWidth * renderHeight);
    resume();
  };
  const update = (next: PixelSnowConfig) => {
    const resized = config.pixelResolution !== next.pixelResolution;
    config = next;
    material.uniforms.uColor.value.set(next.color);
    material.uniforms.uFlakeSize.value = next.flakeSize;
    material.uniforms.uPixelResolution.value = next.pixelResolution;
    material.uniforms.uFarPlane.value = next.depth;
    material.uniforms.uDensity.value = next.density;
    material.uniforms.uBrightness.value = next.brightness;
    material.uniforms.uVariant.value = next.variant === 'round' ? 1 : next.variant === 'snowflake' ? 2 : 0;
    material.uniforms.uDirection.value = next.direction * Math.PI / 180;
    canvas.dataset.snowVariant = next.variant;
    if (initialized) { if (resized) resize(); else resume(); }
  };
  const onLost = (event: Event) => { event.preventDefault(); fail(); };
  const sizeObserver = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(resize); });
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(resizeFrame);
    sizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener('visibilitychange', resume);
    canvas.removeEventListener('webglcontextlost', onLost);
    geometry.dispose(); material.dispose(); renderer.dispose();
    renderer.forceContextLoss();
  };
  sizeObserver.observe(canvas);
  visibilityObserver.observe(canvas);
  document.addEventListener('visibilitychange', resume);
  canvas.addEventListener('webglcontextlost', onLost);
  update(initial);
  initialized = true;
  resize();
  if (failed) { dispose(); throw new Error('Pixel snow renderer failed'); }
  canvas.dataset.renderer = 'pixel-snow-three';
  return { update, dispose };
}
