'use client';

import { useId, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * SourceTextBox: textarea with live length + approx token meter.
 * - We assume ~4 chars ≈ 1 token (rough estimate).
 * - Soft warning at ~24k chars (~6k tokens).
 * - Strong warning at ~36k chars (~9k tokens).
 */
export default function SourceTextBox({
  id,
  name = 'source_text',
  defaultValue = '',
  rows = 6,
  placeholder = 'Paste specific instructions or content. This guides AI question generation.',
}) {
  const [val, setVal] = useState(defaultValue ?? '');
  const descId = useId();

  const chars = val.length;
  const estTokens = Math.ceil(chars / 4); // rough
  const SOFT = 24000;  // ~6k tokens
  const HARD = 36000;  // ~9k tokens
  const pct = Math.min(100, Math.round((chars / HARD) * 100));
  const level = chars >= HARD ? 'danger' : chars >= SOFT ? 'warn' : 'ok';

  return (
    <div className="space-y-2">
      <textarea
        id={id || name}
        name={name}
        rows={rows}
        className="w-full border rounded-md p-2"
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        aria-describedby={descId}
      />

      {/* Meter */}
      <div className="h-2 w-full rounded bg-muted overflow-hidden">
        <div
          className={[
            'h-full transition-[width]',
            level === 'danger' ? 'bg-red-600' : level === 'warn' ? 'bg-yellow-500' : 'bg-green-600',
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stats + message */}
      <div id={descId} className="text-xs text-muted-foreground flex items-center gap-2">
        <span>{chars.toLocaleString()} chars · ~{estTokens.toLocaleString()} tokens</span>
        {level !== 'ok' && (
          <>
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {level === 'warn'
                ? 'Getting long; consider trimming or splitting.'
                : 'Very long; responses may truncate. Trim or split the content.'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
