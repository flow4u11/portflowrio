# ReactBits component provenance

The original integrations in this portfolio adapt official [ReactBits](https://reactbits.dev) component source by David Haz, fetched on 8 October 2026 from [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits), pinned to revision `63a008de65732d73010bd219d25d15c47739bb31`. The source remains local and editable.

| Portfolio component | Official source | Retained behavior and portfolio adaptations |
| --- | --- | --- |
| `src/components/react-bits/FlexCarousel.tsx` and `.css`, integrated by `ProjectGallery.tsx` | [FlexCarousel TSX](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Components/FlexCarousel/FlexCarousel.tsx), [CSS](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Components/FlexCarousel/FlexCarousel.css), [demo](https://reactbits.dev/components/flex-carousel) | Retains the actual OGL WebGL2 image and lens shaders, four lens presets, spring navigation, drag momentum, image parallax, movement squeeze, chromatic dispersion and reveal animation. The gallery preloads its module and decoded covers with the page, constructs the renderer after a scroll-quiet idle period, and paints one finite offscreen warmup before showing it. A reserved stage and persistent information shell prevent layout changes; late preparation keeps the native renderer for the current visit and adopts WebGL after leaving. The portfolio uses its own two project covers and three original future-slot covers, bounded first/last navigation, keyboard and external controls, and semantic active-project details. The larger artwork fades into the page; individual hit images smoothly enlarge while other images dim in the WebGL scene and hit geometry updates. Project selection opens the existing accessible dialog. Vertical wheel scrolling remains native. Rendering stops when hidden, offscreen or settled and pauses during page scrolling. GPU draws are capped at 60 Hz, 1.25 DPR and 900,000 pixels (630,000 on narrow stages), with six dispersion samples and no per-frame render-target mipmaps. Neo Brutalism uses an ink-framed multicolor native-scroll layout without constructing WebGL. Reduced motion, unavailable WebGL2, image failure or context loss also preserves the semantic native-scroll gallery, all five finite slots, controls, keyboard navigation and dialogs. |
| `src/components/PixelAvatar.tsx` and `pixel-avatar.css` | [PixelTransition TSX](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Animations/PixelTransition/PixelTransition.tsx), [CSS](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Animations/PixelTransition/PixelTransition.css), [demo](https://reactbits.dev/animations/pixel-transition) | Adapts the randomized square-mask cover, image swap and uncover sequence to the existing portrait and keyboard/touch interaction, with bounded DOM animation and browser preference controls. |
| `src/components/PixelTrail.tsx` and `pixel-trail.css` | [PixelTrail TSX](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Animations/PixelTrail/PixelTrail.tsx), [CSS](https://github.com/DavidHDev/react-bits/blob/63a008de65732d73010bd219d25d15c47739bb31/src/ts-default/Animations/PixelTrail/PixelTrail.css), [demo](https://reactbits.dev/animations/pixel-trail) | Adapts the source's snapped pixel grid and age-based trail fade to a bounded Canvas2D layer. It avoids the source's Three.js rendering dependency while retaining the pointer trail behavior, with settings and reduced/hidden/offscreen safeguards. |

The carousel adds `ogl` 1.0.11 (Unlicense) as a dependency. OGL is included in the gallery's separate dynamic-import chunk. Source: [oframe/ogl](https://github.com/oframe/ogl). React is an existing application dependency. The avatar and trail adaptations do not add GSAP or Three.js.

Local portrait/project assets and future-slot artwork are portfolio material. Upstream demo photographs are not included.

Active-project details add a finite decorative erase-then-type transition, a blinking caret only while characters change, and numbers that count from their previous visible value in `ProjectMotionText.tsx`. Complete text, emphasis, links and final numbers remain available to assistive technology, with static reduced-motion output and no animation-driven React renders.

The gallery animation preference defaults on for desktop and off for mobile. Disabling it releases the WebGL renderer, stops automatic hover movement and keeps all five native cards, the selected position, immediate keyboard/button navigation and project dialogs. Neo Brutalism always uses native cards. When gallery animation is enabled, both presentations center an adjacent card after a short mouse dwell; the next move requires fresh pointer movement after settling, preventing stationary-pointer cascades. Touch remains swipe and button driven. Page entry waits for an actual prepared GPU paint or a bounded native fallback, with resource and renderer deadlines so preparation cannot restart visibly on arrival.


Upgrade 0.4 also uses owner-supplied ReactBits exports for [FlexCarousel](https://reactbits.dev/components/flex-carousel) and [Pixel Snow](https://reactbits.dev/backgrounds/pixel-snow). The exported files do not identify a source revision. Their SHA-256 hashes are `bd563e422deb8877dfe13ebe28d39bab34b47783f7d489cdd4925f7d1b05f03e` (carousel) and `beae8db9e3341e8c1cba889d2da9fa00899d74a72d1c397e753a4e929f9a239f` (snow). The existing complete upstream license notice below applies to these adaptations too. The carousel retains its existing shaders and lifecycle safeguards; its original center-card focus spring, neighbor parting and lens melt now respond to mouse hover, with click and keyboard activation still opening project details. Desktop layout reserves a viewport budget for the selected artwork and full project information; mobile remains readable and stacked.

Pixel Snow adapts the supplied three-dimensional cell traversal, wind, depth fade and square/round/snowflake distance shader. It runs as an alternative to the star field, with persisted controls, a bounded low-resolution framebuffer, finite shader traversal, a 30 Hz draw cap, visibility/reduced-motion handling, explicit first-paint readiness and a Canvas2D fallback. Only the selected background owns a renderer. Three.js is already installed; this addition does not require another dependency.

The October 9 followup adapts the owner-supplied [Shiny Text](https://reactbits.dev/text-animations/shiny-text) export (SHA-256 `6bbddeb90c5315191024e659dbf54bd7bea8c6fbe7bfeeb6dbf664621c181f74`) in `ShinyText.tsx`. A static clipped light band and pausable Web Animations timeline retain sweep speed, delay, width, softness, angle and direction controls while avoiding per-frame React work and color-string reconstruction. Name shine can be disabled or recolored independently of its five-stop gradient. Hidden/offscreen text pauses and reduced motion stays static. The upstream notice below is retained.

`ThemeLab.tsx` and `NavigationWarp.tsx` contain original effects inspired by the public [Ghost Type](https://pro.reactbits.dev/docs/components/ghost-type) and [Glitter Warp](https://pro.reactbits.dev/docs/components/glitter-warp) previews. No Pro source code was accessed or copied. The inline completion streams a finite suggestion and accepts with Tab; navigation paints a bounded perspective star tunnel only during the interruptible scroll journey.

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

## Upgrade 0.7 motion controls

The existing attributed Flex Carousel now exposes its Rise/Bloom/Spin/Deal entrances and fit, card height, gap, radius, tilt, roundness, reach, dispersion, liquid, cursor-follow and hover-focus controls. Offscreen warmup paints a ready frame without consuming the first visible entrance. Settings v6 keeps earlier personal preferences; reduced motion and the mobile static default remain. Reference: https://reactbits.dev/components/flex-carousel .

Contact shine uses a linear, continuous left-to-right band with both wrap endpoints outside the text; the static base fill remains readable. Nagi panel/reply entrances, word hover and Halloween silhouettes are original bounded opacity/transform motion. These additions do not include ReactBits Pro source.

## Upgrade 0.8 entrance timing

The prepared carousel bitmap stays hidden until its first entrance frame has been rendered. That short entrance can draw during arrival scrolling; the ordinary gallery retains its scroll-quiet gate. Native and reduced-motion fallbacks remain available.

Nagi's reply typewriter is original, finite and grapheme-aware, with a complete accessible text alternative. Closing, hiding or reduced motion settles the reply; reopening does not replay completed answers. Its localized interface reuses the portfolio's existing scramble. Special-theme emblems are original SVG artwork.
