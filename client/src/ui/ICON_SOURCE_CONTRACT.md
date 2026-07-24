# Icon source contract

`GameIcon` is the layout owner for UI icons. Its `IconSource` accepts three
interchangeable source kinds:

- `atlasIcon(frameName, atlas?)` for a packed atlas frame;
- `assetIcon(src)` for a standalone image URL;
- `nodeIcon(node)` for supplied React/SVG content.

The source never determines the outer footprint. Callers provide `size`, and
the fallback occupies that same footprint while an atlas manifest or image is
loading and when a source is missing. This lets Phase 10 replace art without
changing component layout.

Accessibility is explicit at every direct use:

- use `decorative` when adjacent text or the containing control already has the
  accessible name;
- use `label="..."` when the icon communicates information on its own.

Use `fallback={null}` only when the owning component already renders its own
fallback beneath the icon. `UIIcon` and `ItemIcon` remain thin convenience
wrappers for existing atlas-specific call sites; new reusable component props
should accept `IconSource`, not a frame-name string.
