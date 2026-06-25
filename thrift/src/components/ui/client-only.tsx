'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  /** Optional fallback shown during SSR / before mount */
  fallback?: ReactNode;
}

/**
 * Renders children ONLY after the component mounts on the client.
 *
 * WHY THIS EXISTS:
 * Browser security extensions (Bitdefender, Kaspersky) inject attributes like
 * `bis_skin_checked`, `bis_register`, and `__processed_<uuid>__` into <div>
 * elements before React hydrates. This causes hydration mismatches because the
 * SSR HTML doesn't have those attributes.
 *
 * Wrapping sections with <ClientOnly> prevents SSR entirely for that subtree,
 * so React never tries to reconcile server vs client HTML — eliminating the
 * mismatch without suppressing legitimate warnings elsewhere.
 *
 * USAGE: Wrap sections that are interactive-only and don't need SSR for SEO.
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
