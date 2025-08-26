'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

/**
 * Submit button that shows a pending label and supports multiple actions.
 * Props:
 * - pendingText: string shown while the form is pending
 * - name, value: to distinguish which submit was pressed (e.g., "action" / "save"|"regen")
 * - variant, className, children, ...rest: forwarded to Button
 */
export default function PendingSubmit({
  pendingText = 'Saving…',
  name,
  value,
  variant,
  className,
  children,
  ...rest
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name={name}
      value={value}
      variant={variant}
      className={className}
      disabled={pending}
      {...rest}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
