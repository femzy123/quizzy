'use client';

import { useFormStatus } from 'react-dom';

export default function FormPendingFieldset({ children }) {
  const { pending } = useFormStatus();
  return <fieldset disabled={pending} className="space-y-4">{children}</fieldset>;
}
