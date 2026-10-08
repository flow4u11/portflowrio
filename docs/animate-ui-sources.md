# Animate UI component provenance

The portfolio uses adapted **official source**, fetched on 7 October 2026 from [imskyleen/animate-ui](https://github.com/imskyleen/animate-ui), pinned to revision `efeb96ffd7a3b7a4868667e4ac3c346620fb3044`. The implementation is stored locally and remains editable.

| Local component | Official sources | Preserved behavior and portfolio adaptations |
| --- | --- | --- |
| `src/components/animate-ui/theme-toggler.tsx` | [ThemeTogglerButton](https://github.com/imskyleen/animate-ui/blob/efeb96ffd7a3b7a4868667e4ac3c346620fb3044/apps/www/registry/components/buttons/theme-toggler/index.tsx), [ThemeToggler primitive](https://github.com/imskyleen/animate-ui/blob/efeb96ffd7a3b7a4868667e4ac3c346620fb3044/apps/www/registry/primitives/effects/theme-toggler/index.tsx), [documentation](https://animate-ui.com/docs/components/buttons/theme-toggler) | Retains directional inset keyframes, native View Transition capture, `flushSync`, 700 ms reveal, and Sun/Moon icons. Uses controlled light/dark props instead of `next-themes`, the root `data-theme` attribute, a 44 px minimum target, stable toggle label, graceful fallback, and an immediate reduced-motion change. Parent theme state persists to `portfolio-theme`. |
| `src/components/animate-ui/avatar-group.tsx` | [AvatarGroup component](https://github.com/imskyleen/animate-ui/blob/efeb96ffd7a3b7a4868667e4ac3c346620fb3044/apps/www/registry/components/animate/avatar-group/index.tsx), [AvatarGroup primitive](https://github.com/imskyleen/animate-ui/blob/efeb96ffd7a3b7a4868667e4ac3c346620fb3044/apps/www/registry/primitives/animate/avatar-group/index.tsx), [documentation](https://animate-ui.com/docs/components/animate/avatar-group) | Retains overlapping containers, inverted stacking order, default `-30%` spring lift, stiffness 300 / damping 17, and tooltip spring stiffness 300 / damping 35. Adapts the official tooltip integration to Radix Avatar and Tooltip. Adds real keyboard-focusable buttons, focus lift, explicit visitor names, and disabled movement for reduced motion. Tooltip offset is 18 px for the compact portfolio treatment. |
| `src/components/animate-ui/stars-background.tsx` | [StarsBackground source](https://github.com/imskyleen/animate-ui/blob/efeb96ffd7a3b7a4868667e4ac3c346620fb3044/apps/www/registry/components/backgrounds/stars/index.tsx), [documentation](https://animate-ui.com/docs/components/backgrounds/stars) | Retains the public component API and decorative shared-background surface. The default is an original bounded Three.js perspective point cloud; reduced motion and unavailable WebGL use an original Canvas2D star renderer. Both preserve theme color and star count/speed controls. See [spatial background details](three-scene.md). |

Dependencies used by these adaptations: React, React DOM, Motion, Lucide React, Radix Avatar, Radix Tooltip, `clsx`, and `tailwind-merge`. Tailwind CSS v4 generates component utility styles. No `next-themes` provider is required.

Usage preserves the source's original composition: an `AvatarGroup` contains `Avatar` children; each avatar may contain `AvatarImage`, `AvatarFallback`, and `AvatarGroupTooltip`. Provide a meaningful `aria-label` on each `Avatar`. `ThemeTogglerButton` accepts `theme` and `onThemeChange`. `StarsBackground` accepts `factor`, `speed`, `transition`, `starColor`, `pointerEvents`, standard div props, and optional children.

The official documentation credits **Magic UI** for the theme effect, **shadcn/ui** for button styling, **Jhey** for AvatarGroup inspiration, and **umangladani** for StarsBackground inspiration. The upstream license is **MIT + Commons Clause**, not unmodified MIT. Its complete notice follows, copied from the [pinned upstream license](https://github.com/imskyleen/animate-ui/blob/efeb96ffd7a3b7a4868667e4ac3c346620fb3044/LICENSE.md).

---

MIT + Commons Clause License Condition

Copyright (c) 2025 Elliot Sutton

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell or redistribute the components themselves in their original form—whether alone or in a bundle.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
