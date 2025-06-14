// This layout is intentionally minimal to resolve a routing conflict.
// The active layout can be found at /admin/layout.tsx
import type React from 'react';

export default function DisabledLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
