# Style anchors

Reference images passed as BitForge `style_image` on every batch generation —
this is what keeps hundreds of generated assets reading as one game.

The category manifests expect these filenames (see `styleRef` in
`art/manifests/*.json`):

| File | Used by | Suggested source |
|---|---|---|
| `creatures.png` | monsters | your favorite existing monster sprite |
| `characters.png` | players (deferred) | your favorite existing class sprite |
| `icons.png` | items, ui-icons | your favorite existing item icon |
| `terrain.png` | environment, backgrounds | a representative background crop |

## How to set them

Existing sprites make perfect anchors — copy the cleanest ones straight from
`art/src/` (zero API cost), e.g.:

```powershell
Copy-Item art/src/sprites/monsters/wolf.png art/style/creatures.png
Copy-Item art/src/items/weapons/sword-3.png art/style/icons.png
```

Or generate fresh candidates once and promote a winner here.

Notes:

- Any entry can override its category anchor with its own `styleRef`
  (e.g. slimes referencing your best existing slime).
- Changing an anchor changes the request hash, so affected pending entries
  regenerate on the next `art:generate` instead of being skipped as cached.
- `art:generate` fails fast with a clear error if a referenced anchor is
  missing — set these up before the first batch run.
