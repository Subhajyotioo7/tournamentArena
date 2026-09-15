import { memo, useEffect, useMemo, useState } from 'react';
import { toast, useSonner } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

const POSITIONS = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const POSITION_CLASSES = {
  'top-left': 'top-6 left-6',
  'top-center': 'top-3 left-2 right-2 md:top-6 md:left-1/2 md:right-auto md:-translate-x-1/2',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-3 left-2 right-2 md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2',
  'bottom-right': 'bottom-6 right-6',
};

const GRADIENTS = {
  success: 'radial-gradient(circle at center, #34d399, #047857)',
  warning: 'radial-gradient(circle at center, #fbbf24, #b45309)',
  error: 'radial-gradient(circle at center, #f43f5e, #be123c)',
  info: 'radial-gradient(circle at center, #38bdf8, #1d4ed8)',
  loading: 'radial-gradient(circle at center, #818cf8, #4338ca)',
  default: 'radial-gradient(circle at center, #a1a1aa, #3f3f46)',
};

const getTitle = (item) => (
  typeof item.title === 'string' ? item.title : 'Notification'
);

const getDescription = (item) => (
  typeof item.description === 'string' ? item.description : ''
);

const ToastStack = memo(({ position, items, duration }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const displayedItems = useMemo(() => [...items].reverse(), [items]);

  useEffect(() => {
    if (hoveredId !== null && !items.some((item) => item.id === hoveredId)) {
      setHoveredId(null);
    }
  }, [items, hoveredId]);

  useEffect(() => {
    const timers = items
      .filter((item) => item.duration !== Infinity)
      .map((item) => window.setTimeout(() => toast.dismiss(item.id), item.duration || duration));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [items, duration]);

  return (
    <div className={`pointer-events-none fixed z-[9999] ${POSITION_CLASSES[position]}`}>
      <div className="flex max-w-full items-center justify-center">
        <AnimatePresence initial={false}>
          {displayedItems.map((item, index) => {
            const expanded = hoveredId !== null
              ? hoveredId === item.id
              : index === displayedItems.length - 1;
            const gradient = GRADIENTS[item.type] || GRADIENTS.default;
            let marginLeft = -12;
            if (index === 0) {
              marginLeft = 0;
            } else if (hoveredId === item.id) {
              marginLeft = 6;
            }

            return (
              <motion.div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                initial={{ width: 40, opacity: 0, scale: 0.9, marginLeft: index ? -24 : 0 }}
                animate={{ width: expanded ? 'auto' : 40, opacity: 1, scale: expanded ? 1.05 : 1, marginLeft }}
                exit={{ width: 0, opacity: 0, scale: 0.8, marginLeft: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 25 }}
                style={{ zIndex: hoveredId === item.id ? 50 : index + 1 }}
                className="pointer-events-auto relative flex h-10 max-w-full shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-stone-200 bg-white p-1 pr-3 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="group/avatar relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 shadow-inner">
                  <motion.div
                    className="absolute inset-0"
                    style={{ backgroundImage: gradient }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                  {item.type === 'loading' && (
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  <button
                    type="button"
                    onClick={() => toast.dismiss(item.id)}
                    aria-label="Dismiss notification"
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover/avatar:opacity-100"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                <motion.div
                  animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -10 }}
                  className="ml-2 flex min-w-0 max-w-[calc(100vw-5rem)] shrink items-start text-left md:max-w-56"
                >
                  <p className="max-w-full truncate text-[13px] font-medium leading-none text-stone-700">{getTitle(item)}</p>
                  {getDescription(item) && (
                    <p className="mt-0.5 max-w-full truncate text-[10px] leading-tight text-stone-500">{getDescription(item)}</p>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});

export function PebbleToaster({ duration = 6000, position = 'top-center' }) {
  const { toasts } = useSonner();
  const groups = useMemo(() => toasts.reduce((result, item) => {
    const itemPosition = item.position || position;
    if (!result[itemPosition]) result[itemPosition] = [];
    result[itemPosition].push(item);
    return result;
  }, {}), [toasts, position]);

  return POSITIONS.map((itemPosition) => (
    <ToastStack
      key={itemPosition}
      position={itemPosition}
      items={groups[itemPosition] || []}
      duration={duration}
    />
  ));
}
