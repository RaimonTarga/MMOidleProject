/* eslint-disable @typescript-eslint/no-explicit-any */
// A few tests import the repo's plain-JS gate scripts (`scripts/*.mjs`). They have
// no types of their own and predate `test/` being typechecked at all. This keeps
// the imports from failing the build without inventing a shape for them: `any` is
// the honest description of an untyped JS helper, and it is confined to this file
// rather than spread across the tests as casts.
declare module '*.mjs' {
  export const verifyDeclaredApplied: (...args: any[]) => any;
  export const shouldRunDependentBlock: (...args: any[]) => any;
  export const isGlobalIdentityFailure: (...args: any[]) => any;
  const _default: any;
  export default _default;
}
