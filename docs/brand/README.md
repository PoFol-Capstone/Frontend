# Pofol brand assets

- `pofol-original.png`: unchanged user-provided artwork.
- `pofol-symbol-source.png`: isolated symbol produced with the built-in ImageGen editor.
- `../../public/brand/`: transparent, web-sized symbol, original wordmark, and original full lockup with outer whitespace removed.
- `../../app/favicon.ico`: 16, 32, and 48 px PNG-backed ICO entries.
- `../../app/icon.png`: 512 px symbol on white; `apple-icon.png`: 180 px with extra padding.
- `../../public/icons/`: synchronized compatibility copies for existing direct icon URLs. Next.js file-based metadata in `app/` is the canonical configuration.

The full lockup and wordmark retain the supplied artwork. Only the standalone symbol was processed by ImageGen. Resizing and ICO packaging used the installed Sharp library. White icon backgrounds preserve contrast in both light and dark browser chrome.

## ImageGen prompt

Use case: background-extraction. Edit target: attached Pofol logo. Produce a single square transparent PNG containing ONLY the existing folded ribbon P symbol from the upper half. Remove the Pofol wordmark and SHARE YOUR STORY slogan. Preserve exactly the original P silhouette, proportions, black graphite folded ribbon and silver-white inner curved fold. Do not redesign, add parts, change direction, add text, outline or drop shadow. Clean edge artifacts. Center symbol on square transparent canvas with about 10 percent padding on each side of longest dimension. This is the production mark for the existing Pofol website header and favicon; original identity preservation is essential. Background must have real alpha transparency.
