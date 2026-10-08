# ReactBits component provenance

This portfolio adapts official [ReactBits](https://reactbits.dev) component source by David Haz, fetched on 8 October 2026 from [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits), pinned to revision `63a008de65732d73010bd219d25d15c47739bb31`. The source remains local and editable.

| Portfolio component | Official source | Retained behavior and portfolio adaptations |
| --- | --- | --- |
| `src/components/react-bits/FlexCarousel.tsx` and `.css`, integrated by `ProjectGallery.tsx` | [FlexCarousel TSX](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Components/FlexCarousel/FlexCarousel.tsx), [CSS](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Components/FlexCarousel/FlexCarousel.css), [demo](https://reactbits.dev/components/flex-carousel) | Retains the actual OGL WebGL2 image and lens shaders, four lens presets, spring navigation, drag momentum, image parallax, movement squeeze, chromatic dispersion and reveal animation. The gallery preloads its module and decoded covers with the page, constructs the renderer after a scroll-quiet idle period, and paints one finite offscreen warmup before showing it. A reserved stage and persistent information shell prevent layout changes; late preparation keeps the native renderer for the current visit and adopts WebGL after leaving. The portfolio uses its own two project covers and three original future-slot covers, bounded first/last navigation, keyboard and external controls, and semantic active-project details. The larger artwork fades into the page; individual hit images smoothly enlarge while other images dim in the WebGL scene and hit geometry updates. Project selection opens the existing accessible dialog. Vertical wheel scrolling remains native. Rendering stops when hidden, offscreen or settled and pauses during page scrolling. GPU draws are capped at 60 Hz, 1.25 DPR and 900,000 pixels (630,000 on narrow stages), with six dispersion samples and no per-frame render-target mipmaps. Neo Brutalism uses an ink-framed multicolor native-scroll layout without constructing WebGL. Reduced motion, unavailable WebGL2, image failure or context loss also preserves the semantic native-scroll gallery, all five finite slots, controls, keyboard navigation and dialogs. |
| `src/components/PixelAvatar.tsx` and `pixel-avatar.css` | [PixelTransition TSX](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Animations/PixelTransition/PixelTransition.tsx), [CSS](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Animations/PixelTransition/PixelTransition.css), [demo](https://reactbits.dev/animations/pixel-transition) | Adapts the randomized square-mask cover, image swap and uncover sequence to the existing portrait and keyboard/touch interaction, with bounded DOM animation and browser preference controls. |
| `src/components/PixelTrail.tsx` and `pixel-trail.css` | [PixelTrail TSX](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Animations/PixelTrail/PixelTrail.tsx), [CSS](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Animations/PixelTrail/PixelTrail.css), [demo](https://reactbits.dev/animations/pixel-trail) | Adapts the source's snapped pixel grid and age-based trail fade to a bounded Canvas2D layer. It avoids the source's Three.js rendering dependency while retaining the pointer trail behavior, with settings and reduced/hidden/offscreen safeguards. |

The carousel adds `ogl` 1.0.11 (Unlicense) as a dependency. OGL is included in the gallery's separate dynamic-import chunk. Source: [oframe/ogl](https://github.com/oframe/ogl). React is an existing application dependency. The avatar and trail adaptations do not add GSAP or Three.js.

Local portrait/project assets and future-slot artwork are portfolio material. Upstream demo photographs are not included.

Active-project details add a finite decorative erase-then-type transition, a blinking caret only while characters change, and numbers that count from their previous visible value in `ProjectMotionText.tsx`. Complete text, emphasis, links and final numbers remain available to assistive technology, with static reduced-motion output and no animation-driven React renders.

The gallery animation preference defaults on for desktop and off for mobile. Disabling it releases the WebGL renderer, stops automatic hover movement and keeps all five native cards, the selected position, immediate keyboard/button navigation and project dialogs. Neo Brutalism always uses native cards. When gallery animation is enabled, both presentations center an adjacent card after a short mouse dwell; the next move requires fresh pointer movement after settling, preventing stationary-pointer cascades. Touch remains swipe and button driven. Page entry waits for an actual prepared GPU paint or a bounded native fallback, with resource and renderer deadlines so preparation cannot restart visibly on arrival.

The ReactBits source uses **MIT + Commons Clause**, rather than unmodified MIT. Its complete notice is retained in `src/components/react-bits/LICENSE.md` and reproduced below from the [pinned upstream license](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/LICENSE.md).

---

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
