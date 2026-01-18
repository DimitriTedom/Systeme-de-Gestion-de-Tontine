import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button-1';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

const alertVariants = cva('flex items-stretch w-full gap-2 group-[.toaster]:w-full', {
  variants: {
    variant: {
      secondary: '',
      primary: '',
      destructive: '',
      success: '',
      info: '',
      mono: '',
      warning: '',
    },
    icon: {
      primary: '',
      destructive: '',
      success: '',
      info: '',
      warning: '',
    },
    appearance: {
      solid: '',
      outline: '',
      light: '',
      stroke: 'text-foreground',
    },
    size: {
      lg: 'rounded-lg p-4 gap-3 text-base [&>[data-slot=alert-icon]>svg]:size-6 *:data-slot=alert-icon:mt-0.5 [&_[data-slot=alert-close]]:mt-1',
      md: 'rounded-lg p-3.5 gap-2.5 text-sm [&>[data-slot=alert-icon]>svg]:size-5 *:data-slot=alert-icon:mt-0 [&_[data-slot=alert-close]]:mt-0.5',
      sm: 'rounded-md px-3 py-2.5 gap-2 text-xs [&>[data-slot=alert-icon]>svg]:size-4 *:data-alert-icon:mt-0.5 [&_[data-slot=alert-close]]:mt-0.25 [&_[data-slot=alert-close]_svg]:size-3.5',
    },
  },
  compoundVariants: [
    /* Solid */
    {
      variant: 'secondary',
      appearance: 'solid',
      className: 'bg-muted text-foreground',
    },
    {
      variant: 'primary',
      appearance: 'solid',
      className: 'bg-emerald-600 text-white dark:bg-emerald-600',
    },
    {
      variant: 'destructive',
      appearance: 'solid',
      className: 'bg-destructive text-destructive-foreground',
    },
    {
      variant: 'success',
      appearance: 'solid',
      className: 'bg-emerald-500 text-white dark:bg-emerald-600',
    },
    {
      variant: 'info',
      appearance: 'solid',
      className: 'bg-blue-600 text-white dark:bg-blue-600',
    },
    {
      variant: 'warning',
      appearance: 'solid',
      className: 'bg-yellow-500 text-white dark:bg-yellow-600',
    },
    {
      variant: 'mono',
      appearance: 'solid',
      className: 'bg-zinc-950 text-white dark:bg-zinc-300 dark:text-black *:data-slot-[alert=close]:text-white',
    },

    /* Light */
    {
      variant: 'primary',
      appearance: 'light',
      className:
        'text-foreground bg-emerald-50 border border-emerald-100 [&_[data-slot=alert-icon]]:text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900',
    },
    {
      variant: 'destructive',
      appearance: 'light',
      className:
        'bg-red-50 border border-red-100 text-foreground [&_[data-slot=alert-icon]]:text-destructive dark:bg-red-950 dark:border-red-900',
    },
    {
      variant: 'success',
      appearance: 'light',
      className:
        'bg-emerald-50 border border-emerald-200 text-foreground [&_[data-slot=alert-icon]]:text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900',
    },
    {
      variant: 'info',
      appearance: 'light',
      className:
        'bg-blue-50 border border-blue-100 text-foreground [&_[data-slot=alert-icon]]:text-blue-600 dark:bg-blue-950 dark:border-blue-900',
    },
    {
      variant: 'warning',
      appearance: 'light',
      className:
        'bg-yellow-50 border border-yellow-200 text-foreground [&_[data-slot=alert-icon]]:text-yellow-600 dark:bg-yellow-950 dark:border-yellow-900',
    },
  ],
  defaultVariants: {
    variant: 'secondary',
    appearance: 'solid',
    size: 'md',
  },
});

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  close?: boolean;
  onClose?: () => void;
}

interface AlertIconProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

function Alert({ className, variant, size, icon, appearance, close = false, onClose, children, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, size, icon, appearance }), className)}
      {...props}
    >
      {children}
      {close && (
        <Button
          size="sm"
          variant="inverse"
          mode="icon"
          onClick={onClose}
          aria-label="Dismiss"
          data-slot="alert-close"
          className={cn('group shrink-0 size-4')}
        >
          <X className="opacity-60 group-hover:opacity-100 size-4" />
        </Button>
      )}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <div data-slot="alert-title" className={cn('grow tracking-tight', className)} {...props} />;
}

function AlertIcon({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-icon" className={cn('shrink-0', className)} {...props}>
      {children}
    </div>
  );
}

function AlertToolbar({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-toolbar" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('text-sm [&_p]:leading-relaxed [&_p]:mb-2', className)}
      {...props}
    />
  );
}

function AlertContent({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-content"
      className={cn('space-y-2 [&_[data-slot=alert-title]]:font-semibold', className)}
      {...props}
    />
  );
}

export { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle, AlertToolbar };
