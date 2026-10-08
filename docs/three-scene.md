# Spatial background

The shared background is an original Three.js scene, using a single point cloud and a perspective camera. Pointer movement gently changes the camera; scrolling changes its depth framing. The Hero entrance uses independent spring-driven 3D transforms so text, links and controls retain their native semantics.

- Three.js is pinned to **0.186.1** (MIT); the renderer is a separate dynamically loaded module.
- At most 240 stars render (120 on mobile), at 30 frames per second, with a 900,000-pixel / 1.25 DPR cap. No textures, shadows or postprocessing are used.
- Hidden pages stop rendering. Reduced-motion and unavailable/lost WebGL use the original bounded Canvas2D fallback.
- Startup waits for the scene's first render and the selected gallery presentation, or an explicit fallback. Text completion and the final progress hold finish before the Hero entrance.

Official reference: [Three.js WebGLRenderer](https://threejs.org/docs/#WebGLRenderer). The technology icon is the [official r186 icon](https://github.com/mrdoob/three.js/blob/r186/files/icon.svg), used as a brand identifier. The full library license is in [three-LICENSE.md](../src/assets/icons/three-LICENSE.md).
