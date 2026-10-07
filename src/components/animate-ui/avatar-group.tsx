// Adapted from Animate UI, copyright (c) 2025 Elliot Sutton.
// Source and MIT + Commons Clause notice: docs/animate-ui-sources.md.
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { cn } from '../../lib/utils';

type TooltipPosition = Pick<React.ComponentProps<typeof TooltipPrimitive.Content>, 'side' | 'sideOffset' | 'align' | 'alignOffset'>;
type AvatarGroupContextValue = TooltipPosition & { tooltipTransition: Transition };
const AvatarGroupContext = React.createContext<AvatarGroupContextValue>({ tooltipTransition: { type: 'spring', stiffness: 300, damping: 35 } });

export type AvatarGroupProps = Omit<React.ComponentProps<'div'>, 'translate'> & TooltipPosition & {
  children: React.ReactNode;
  invertOverlap?: boolean;
  translate?: string | number;
  transition?: Transition;
  tooltipTransition?: Transition;
  openDelay?: number;
};

/** Keeps Animate UI's two-container spring lift and inverted stacking order. */
export function AvatarGroup({
  children,
  className,
  invertOverlap = true,
  translate = '-30%',
  transition = { type: 'spring', stiffness: 300, damping: 17 },
  tooltipTransition = { type: 'spring', stiffness: 300, damping: 35 },
  openDelay = 0,
  side = 'top',
  sideOffset = 18,
  align = 'center',
  alignOffset = 0,
  style,
  ...props
}: AvatarGroupProps) {
  const reduceMotion = useReducedMotion();
  const avatars = React.Children.toArray(children).filter(React.isValidElement);
  return (
    <AvatarGroupContext.Provider value={{ side, sideOffset, align, alignOffset, tooltipTransition }}>
      <TooltipPrimitive.Provider delayDuration={openDelay} skipDelayDuration={0}>
        <div
          {...props}
          data-slot="avatar-group"
          className={cn('flex h-12 items-center -space-x-3', className)}
          style={style}
        >
          {avatars.map((child, index) => {
            const childProps = child.props as { 'aria-label'?: string };
            return (
              <TooltipPrimitive.Root key={child.key ?? index}>
                <TooltipPrimitive.Trigger asChild>
                  <motion.button
                    type="button"
                    data-slot="avatar-container"
                    className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--text)]"
                    aria-label={childProps['aria-label'] ?? `Visitor ${index + 1}`}
                    initial="initial"
                    whileHover="hover"
                    whileFocus="hover"
                    whileTap="hover"
                    style={{ zIndex: invertOverlap ? avatars.length - index : index }}
                  >
                    <motion.div
                      className="size-full"
                      variants={{ initial: { y: 0 }, hover: { y: reduceMotion ? 0 : translate } }}
                      transition={reduceMotion ? { duration: 0 } : transition}
                    >
                      {child}
                    </motion.div>
                  </motion.button>
                </TooltipPrimitive.Trigger>
              </TooltipPrimitive.Root>
            );
          })}
        </div>
      </TooltipPrimitive.Provider>
    </AvatarGroupContext.Provider>
  );
}

export type AvatarGroupTooltipProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
  layout?: boolean | 'position' | 'size' | 'preserve-aspect';
};

export function AvatarGroupTooltip({ children, className, layout = 'preserve-aspect', ...props }: AvatarGroupTooltipProps) {
  const { tooltipTransition, ...position } = React.useContext(AvatarGroupContext);
  const reduceMotion = useReducedMotion();
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        {...position}
        {...props}
        data-slot="avatar-group-tooltip"
        className={cn('z-50 rounded-md bg-[var(--text)] px-3 py-2 text-xs text-[var(--bg)] shadow-md', className)}
      >
        <motion.div
          layout={reduceMotion ? false : layout}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : tooltipTransition}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
        <TooltipPrimitive.Arrow className="fill-[var(--text)]" width={10} height={5} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root {...props} data-slot="avatar" className={cn('relative flex size-full overflow-hidden rounded-full border-2 border-[var(--bg)] bg-[var(--surface)]', className)} />;
}

export function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image {...props} data-slot="avatar-image" className={cn('aspect-square size-full object-cover', className)} />;
}

export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return <AvatarPrimitive.Fallback {...props} data-slot="avatar-fallback" className={cn('flex size-full items-center justify-center rounded-full bg-[var(--surface)] text-xs text-[var(--text)]', className)} />;
}
