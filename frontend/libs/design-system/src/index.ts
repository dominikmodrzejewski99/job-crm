// Barrel re-export — convenient single import for consumers that don't need
// fine-grained tree shaking. Prefer the per-component secondary entry points
// (`@frontend/design-system/button`, etc.) for production code.

export * from './lib/components/button/public-api';
export * from './lib/components/badge/public-api';
export * from './lib/components/chip/public-api';
export * from './lib/components/card/public-api';
export * from './lib/components/avatar/public-api';
export * from './lib/components/spinner/public-api';
export * from './lib/components/skeleton/public-api';
export * from './lib/components/empty/public-api';
export * from './lib/components/stat-card/public-api';
export * from './lib/theme/public-api';
