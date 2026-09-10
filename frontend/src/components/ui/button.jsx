import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button-variants';

const Button = forwardRef(({ className, variant, size, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  />
));

Button.displayName = 'Button';

export { Button };
