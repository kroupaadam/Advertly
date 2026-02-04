'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { Slot as SlotPrimitive } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'cursor-pointer group whitespace-nowrap focus-visible:outline-none inline-flex items-center justify-center has-[[data-slot=button-arrow]]:justify-between whitespace-nowrap text-sm font-medium ring-offset-background transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90 data-[state=open]:bg-primary/90',
        mono: 'bg-slate-950 text-white dark:bg-slate-300 dark:text-black hover:bg-slate-950/90 dark:hover:bg-slate-300/90 data-[state=open]:bg-slate-950/90 dark:data-[state=open]:bg-slate-300/90',
        destructive:
          'bg-red-500 text-white hover:bg-red-500/90 data-[state=open]:bg-red-500/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90 data-[state=open]:bg-secondary/90',
        outline: 'bg-background text-slate-900 border border-slate-200 hover:bg-slate-100 data-[state=open]:bg-slate-100 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-800',
        dashed:
          'text-slate-900 border border-slate-200 border-dashed bg-background hover:bg-slate-100 hover:text-slate-900 data-[state=open]:text-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-800',
        ghost:
          'text-slate-900 hover:bg-slate-100 hover:text-slate-900 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
        dim: 'text-slate-500 hover:text-slate-900 data-[state=open]:text-slate-900 dark:hover:text-slate-100',
        foreground: '',
        inverse: '',
      },
      appearance: {
        default: '',
        ghost: '',
      },
      underline: {
        solid: '',
        dashed: '',
      },
      underlined: {
        solid: '',
        dashed: '',
      },
      size: {
        lg: 'h-10 rounded-md px-4 text-sm gap-1.5 [&_svg:not([class*=size-])]:size-4',
        md: 'h-9 rounded-md px-3 gap-1.5 text-sm [&_svg:not([class*=size-])]:size-4',
        sm: 'h-8 rounded-md px-2.5 gap-1.25 text-xs [&_svg:not([class*=size-])]:size-3.5',
        icon: 'size-9 rounded-md [&_svg:not([class*=size-])]:size-4 shrink-0',
      },
      autoHeight: {
        true: '',
        false: '',
      },
      shape: {
        default: '',
        circle: 'rounded-full',
      },
      mode: {
        default: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        icon: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        link: 'text-primary h-auto p-0 bg-transparent rounded-none hover:bg-transparent data-[state=open]:bg-transparent',
        input: `
            justify-start font-normal hover:bg-background [&_svg]:transition-colors [&_svg]:hover:text-foreground data-[state=open]:bg-background 
            focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 
            [[data-state=open]>&]:border-ring [[data-state=open]>&]:outline-none [[data-state=open]>&]:ring-[3px] 
            [[data-state=open]>&]:ring-ring/30 
            aria-invalid:border-red-500/60 aria-invalid:ring-red-500/10 dark:aria-invalid:border-red-500 dark:aria-invalid:ring-red-500/20
            in-data-[invalid=true]:border-red-500/60 in-data-[invalid=true]:ring-red-500/10  dark:in-data-[invalid=true]:border-red-500 dark:in-data-[invalid=true]:ring-red-500/20
          `,
      },
      placeholder: {
        true: 'text-slate-500',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      mode: 'default',
      size: 'md',
      shape: 'default',
      appearance: 'default',
    },
  },
);

function Button({
  className,
  selected,
  variant,
  shape,
  appearance,
  mode,
  size,
  autoHeight,
  underlined,
  underline,
  asChild = false,
  placeholder = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    selected?: boolean;
    asChild?: boolean;
  }) {
  const Comp = asChild ? SlotPrimitive : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          shape,
          appearance,
          mode,
          autoHeight,
          placeholder,
          underlined,
          underline,
          className,
        }),
        asChild && props.disabled && 'pointer-events-none opacity-50',
      )}
      {...(selected && { 'data-state': 'open' })}
      {...props}
    />
  );
}

interface ButtonArrowProps extends React.SVGProps<SVGSVGElement> {
  icon?: LucideIcon; // Allows passing any Lucide icon
}

function ButtonArrow({ icon: Icon = ChevronDown, className, ...props }: ButtonArrowProps) {
  return <Icon data-slot="button-arrow" className={cn('ms-auto -me-1', className)} {...props} />;
}

export { Button, ButtonArrow, buttonVariants };
