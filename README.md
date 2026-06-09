# PDF No-Black Color Changer for the Printer

Browser-based web app for replacing black and very dark pixels in PDFs with dark substitute colors. Processing happens locally in the browser. No Python or command line is required for normal use.

## Links

- GitHub profile: [ChrisFle2003](https://github.com/ChrisFle2003)
- Repository: [PDF-Color-Changer_Website](https://chrisfle2003.github.io/PDF-Color-Changer_Website/)

## What the tool does

- Renders each PDF page in the browser with PDF.js
- Reads pixels through Canvas/ImageData
- Replaces black, near-black, and dark gray areas with dark substitute colors
- Exports the processed pages as a rasterized PDF with pdf-lib

## Who it is for

- People who want a PDF output without pure black
- Users who do not want a Python installation
- Simple local use without a server or build system

## Usage

1. Open `index.html` in a browser
2. Select a PDF or drag and drop one onto the page
3. Choose a mode and settings
4. Click `Convert PDF`
5. Save the new file with `Download Converted PDF`

If your browser blocks local `file://` scripts or WebAssembly, open the page through a small local web server in the project folder:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/index.html` in your browser.

## Important Notes

- Higher quality levels produce larger files and take more time
- The output is rasterized, so text is usually no longer selectable as native PDF text after conversion
- The tool changes RGB colors visually inside the PDF
- It cannot guarantee that every printer driver will avoid black ink, because drivers and color management may remap colors internally

## No-Black Mode

The special mode `Printer has no black ink - use everything except black` replaces dark content more aggressively. It is intended as a visual approximation, not a technical guarantee at the ink-channel level.

## Developer Note

- The color logic is based on the original Python prototype `pdf-color-changer.py`
- The main workflow is now fully browser-based
- A Python CLI can remain as an optional companion variant
- Pyodide could be used for browser Python experiments, but it is intentionally **not** the primary solution here

## Files

- `index.html`
- `style.css`
- `app.js`
- `README.md`

`lib/` can contain local library files so the page also runs directly from the file system without a server.
