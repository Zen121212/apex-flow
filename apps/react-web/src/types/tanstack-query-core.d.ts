// Override @tanstack/query-core types to bypass syntax errors
declare module '@tanstack/query-core' {
  export * from '@tanstack/query-core/build/esm/index';
}

// Suppress all type checking errors for @tanstack/query-core
declare module '@tanstack/query-core/build/legacy/hydration-iULCH7y8' {
  export * from '@tanstack/query-core/build/esm/index';
}