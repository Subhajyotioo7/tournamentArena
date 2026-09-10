import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-500/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#FF5500] text-white hover:bg-[#E64D00]',
        secondary: 'bg-[#1A1D24] text-white hover:bg-[#252A33]',
        outline: 'border border-[#8E9AA8]/40 bg-transparent text-current hover:border-[#FF5500] hover:text-[#FF5500]',
        ghost: 'text-current hover:bg-[#1A1D24] hover:text-white',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        link: 'text-[#FF5500] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
