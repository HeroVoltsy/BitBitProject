# Brand assets

## Rounded app icon

Prepared from the user's updated emerald parrot-envelope reference using the
built-in ImageGen edit tool. The icon has a green parrot, golden-yellow beak,
white invitation card, navy envelope lining, and transparent outer corners.
Shared navigation/auth icons and browser/touch icons all use this artwork.
No additional frame is applied in either theme.

- Source: `public/sali-ka-app-icon.png` (1024 x 1024, RGBA)
- Responsive icons: `public/sali-ka-app-icon-128.png` and `-256.png`
- Browser icons: `public/sali-ka-favicon-32.png` and `-64.png`
- Touch icon: `public/sali-ka-touch-icon.png` (180 x 180)

PNG resizing used high-quality bicubic sampling after the ImageGen edit.
Browser/touch links include a version parameter to refresh previously cached icons.

Final ImageGen prompt:

Use case: background-extraction. Asset type: production Sali Ka app icon, browser favicon and touch icon. Edit target: ONLY the provided JPEG showing the dark emerald rounded-square tile with a bright lime envelope, navy-blue inner envelope lining, a WHITE invitation card, and a GREEN parrot head with a GOLDEN YELLOW beak and a glossy dark eye with one white highlight. Preserve this exact supplied icon, including its bird proportions, feather shapes, cheek, yellow beak, white card, navy lining, envelope folds, emerald tile gradients and rounded corners. Remove ONLY the black canvas outside the rounded-square tile and replace it with genuine transparent alpha. Do not alter any dark areas within the tile. Keep the entire tile with approximately 1% transparent padding on a square canvas; do not crop or stretch it. No redesign, no different bird, no text, no white outline, no added background, no checkerboard, no watermark. Clean antialiased alpha edges with no black halo. Output one high-resolution square transparent PNG.

## Full wordmark update

The full logo now uses the user's green perched-parrot artwork in the Home
welcome banner and the login/signup brand panel. Prepared using the built-in
ImageGen edit tool, then resized with high-quality bicubic sampling to transparent
PNG assets: `public/sali-ka-logo.png` (960 x 720) and
`public/sali-ka-logo-480.png` (480 x 360). Both placements retain the existing
white outline through `.auth-hero__logo`.

Final ImageGen prompt:

Use case: background-extraction. Asset type: production Sali Ka website full wordmark logo. Edit target: ONLY the attached local JPEG of the green parrot perched on the curved leafy branch beside the two-line text 'sali ka?'. Remove the flat white background and the excessive empty margins, producing genuine transparent alpha. Preserve the supplied artwork exactly: green parrot with red face/chest and orange beak/feet, its pose and wing shapes, dark green outlines, curved branch and leaves, the green 'sali' and dark teal 'ka?' letterforms, placement, proportions, and colors. Do not use the older turquoise hanging-parrot logo. Do not redraw, redesign, add shading, change letters, or introduce any new elements. Keep the complete branch, leaves, question mark and parrot within the canvas. Landscape framing closely around the complete artwork with about 3% transparent padding on each side. Clean antialiased transparent edges, no white matte, no checkerboard pattern, no border, no watermark. Output a single high-resolution transparent PNG.
