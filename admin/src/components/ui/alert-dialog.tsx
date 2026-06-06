import type * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';
import { Button } from './button';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export function AlertDialogContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-red-950/80 bg-[#120404] p-6 shadow-xl shadow-red-950/30',
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="space-y-2" {...props} />;
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-lg font-semibold text-orange-50', className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-sm text-red-100/55', className)}
      {...props}
    />
  );
}

export function AlertDialogFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="mt-6 flex justify-end gap-2" {...props} />;
}

export function AlertDialogCancel(
  props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>,
) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button variant="outline" {...props} />
    </AlertDialogPrimitive.Cancel>
  );
}

export function AlertDialogAction(
  props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>,
) {
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button variant="destructive" {...props} />
    </AlertDialogPrimitive.Action>
  );
}
