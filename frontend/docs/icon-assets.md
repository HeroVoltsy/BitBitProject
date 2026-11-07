# Rounded app icon

Prepared from the user's supplied rounded emerald parrot-envelope reference using
the built-in ImageGen edit tool. The old logo assets remain available; the shared
icon component and browser/touch icons now use the new assets in public/.
Navbar and auth marks fill their existing holders, with no additional background
frame in either theme. The wordmark artwork remains separate.

- Source: public/sali-ka-app-icon.png (1254 x 1254, RGBA)
- Responsive icons: public/sali-ka-app-icon-128.png and -256.png
- Browser icons: public/sali-ka-favicon-32.png and -64.png
- Touch icon: public/sali-ka-touch-icon.png (180 x 180)

Deterministic PNG resizing used high-quality bicubic sampling after the image edit.

## Final ImageGen prompt

Use case: background-extraction. Asset type: production Sali Ka web app icon. Edit target: the user's attached icon, the dark emerald ROUNDED-SQUARE TILE containing a lime green envelope, cream invitation card and green parrot head, originally on a black outer canvas. Among the recent reference images, use ONLY that rounded-square tile as the target; the other images show an older standalone envelope and an unrelated cartoon parrot and must not be used. Preserve the user's supplied rounded-square icon itself exactly: same parrot head, eye, feathers, beak, cream card, envelope folds, lime accents, emerald tile, gradients and lighting. Do not redraw, reinterpret, add lettering, or introduce a different bird. Remove ONLY the black canvas outside the tile, replacing it with real transparent alpha. Tighten the framing so the full rounded-square tile nearly fills the square output, with about 2% transparent padding and all rounded corners intact. Clean antialiased alpha edges, no black halo, no white border, no shadow outside the tile, no text, no watermark. Deliver a single high-resolution square transparent PNG ready for app icon sizes.
