import { StarsBackground, type StarsBackgroundProps } from './animate-ui/stars-background';
import { useMotionSettings } from './MotionSettings';
import { PixelSnow } from './PixelSnow';
import { cn } from '../lib/utils';

/** Retains the public wrapper API and children, mounting only the chosen field. */
export function PortfolioBackground({ children, className, factor, speed, starCount, transition, starColor, pointerEvents = true, style, ...props }: StarsBackgroundProps) {
  const { settings } = useMotionSettings();
  if (settings.backgroundStyle === 'stars') return <StarsBackground {...props} className={className} factor={factor} speed={speed} starCount={starCount} transition={transition} starColor={starColor} pointerEvents={pointerEvents} style={style}>{children}</StarsBackground>;
  return <div {...props} data-slot="pixel-snow-background" className={cn('relative size-full overflow-hidden', className)} style={{ pointerEvents: pointerEvents ? undefined : 'none', ...style }}>
    <PixelSnow config={{ speed: settings.snowSpeed, density: settings.snowDensity, flakeSize: settings.snowFlakeSize, pixelResolution: settings.snowPixelResolution, direction: settings.snowDirection, variant: settings.snowVariant, brightness: settings.snowBrightness, depth: settings.snowDepth }} />
    {children}
  </div>;
}
