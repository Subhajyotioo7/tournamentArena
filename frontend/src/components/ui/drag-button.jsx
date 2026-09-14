import { forwardRef, useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

const HANDLE_SIZE = 40;
const GAP_PX = 4;

export const DragButton = forwardRef(function DragButton(
  {
    children,
    className,
    variant = 'default',
    onDragComplete,
    showConfirmation = true,
    successIcon = <Check className="size-5" />,
    colorLight = '#f59e0b',
    colorDark = '#b45309',
    ...props
  },
  externalRef,
) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [travelDistance, setTravelDistance] = useState(0);
  const dragX = useMotionValue(0);
  const containerRef = useRef(null);
  const textOpacity = useTransform(dragX, [0, Math.max(travelDistance, 1)], [1, 0.1]);
  const gradient = `linear-gradient(to top, ${colorLight}, ${colorDark})`;

  const mergedRef = useCallback((node) => {
    containerRef.current = node;
    if (typeof externalRef === 'function') externalRef(node);
    else if (externalRef) externalRef.current = node;
    if (!node) return undefined;

    const measure = () => setTravelDistance(Math.max(0, node.offsetWidth - HANDLE_SIZE - GAP_PX * 2.5));
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [externalRef]);

  const handleDragEnd = () => {
    if (dragX.get() >= travelDistance - 5) {
      onDragComplete?.();
      if (showConfirmation) {
        setIsSuccess(true);
        window.setTimeout(() => {
          setIsSuccess(false);
          dragX.set(0);
        }, 1500);
      } else {
        dragX.set(0);
      }
    } else {
      dragX.set(0);
    }
  };

  return (
    <Button
      ref={mergedRef}
      variant={variant}
      className={cn(
        'relative flex h-12 min-w-[200px] touch-none select-none items-center overflow-hidden rounded-xl p-1 text-sm font-medium',
        isSuccess && 'pointer-events-none',
        className,
      )}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute bottom-1 left-1 top-1 z-0 rounded-lg bg-white/10"
        style={{ width: useTransform(dragX, (value) => value + HANDLE_SIZE) }}
      />
      <motion.span
        style={{ opacity: textOpacity }}
        className="pointer-events-none relative z-10 mx-auto pl-8 text-shadow-lg"
      >
        {children}
      </motion.span>
      <motion.div
        drag={!isSuccess ? 'x' : false}
        dragConstraints={{ left: 0, right: travelDistance }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{
          x: dragX,
          background: gradient,
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          left: 4,
          top: 0,
          bottom: 0,
          marginTop: 'auto',
          marginBottom: 'auto',
          position: 'absolute',
          borderRadius: 10,
          zIndex: 40,
        }}
        animate={{ opacity: isSuccess ? 0 : 1, scale: isSuccess ? 0.8 : 1 }}
        className="flex cursor-grab items-center justify-center text-white active:cursor-grabbing"
      >
        <ArrowRight size={20} className="relative z-30 drop-shadow-sm" />
      </motion.div>
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-600 text-white"
          >
            {successIcon}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
});
