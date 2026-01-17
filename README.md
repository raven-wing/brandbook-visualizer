# Brandbook Visualizer

A client-side web application for creating brand identity guidelines. Define your brand colors, typography, upload logos, and preview your brand across various mockups. Export to a portable `.brandbook` JSON format or generate professional PDF brandbooks.

## Features

- **Color Palette**: Define primary, secondary, and accent colors with custom names
- **Typography**: Choose from 50+ Google Fonts with live preview
- **Logo Upload**: Support for SVG and PNG formats
- **Live Mockups**: Preview your brand on:
  - Business cards
  - Letterheads
  - Envelopes
  - Social media avatars
  - Presentation slides
- **Export Options**:
  - `.brandbook` JSON format for portability
  - Professional multi-page PDF brandbook
  - Shareable URL links
- **Persistence**: Auto-saves to localStorage

## Getting Started

**[Live version](https://raven-wing.github.io/brandbook-visualizer/)**

### Local Development

This is a vanilla JavaScript application with no build system required.

1. Serve the project with any static file server:
   ```bash
   python -m http.server 8000
   ```

2. Open [http://localhost:8000](http://localhost:8000) in your browser

No package manager, bundler, or compilation needed.

## Usage

1. Enter your brand name
2. Pick your color palette (primary, secondary, optional accent)
3. Select fonts for headings and body text
4. Upload your logo (SVG or PNG)
5. Preview across different mockups using the tabs
6. Export as `.brandbook` file or PDF

### Importing a Brandbook

Click "Import .brandbook" to load a previously saved brandbook file.

### Sharing

Click "Share Link" to generate a URL containing your brand settings (logo not included due to size constraints).

## Debug Mode

Add `?debug` to the URL to enable PDF generation timing reports:

```
http://localhost:8000/?debug
```

This logs detailed performance metrics to the browser console when generating PDFs, useful for profiling and optimization.

Example output:
```
═══════════════════════════════════════════
  PDF Generation Timing Report
═══════════════════════════════════════════
  Total:                    4819ms
───────────────────────────────────────────
  Mockup Captures:          4319ms (90%)
    ├─ Business Card    1665ms
    ├─ Social Avatar    1087ms
    └─ ...
───────────────────────────────────────────
```

## File Format

The `.brandbook` export is JSON with this structure:

```json
{
  "version": "1.0",
  "meta": {
    "name": "My Brand",
    "created": "2026-01-17T12:00:00.000Z",
    "generator": "brandbook-visualizer"
  },
  "colors": {
    "primary": { "hex": "#FF5733", "name": "Sunset Orange" },
    "secondary": { "hex": "#2C3E50", "name": "Midnight Blue" },
    "accent": { "hex": "#27AE60", "name": "Emerald" }
  },
  "typography": {
    "primary": {
      "family": "Montserrat",
      "source": "google",
      "weights": [400, 500, 600, 700],
      "usage": "Headings"
    },
    "secondary": {
      "family": "Open Sans",
      "source": "google",
      "weights": [400, 500, 600, 700],
      "usage": "Body text"
    }
  },
  "logo": {
    "svg": "data:image/svg+xml;base64,...",
    "png": "data:image/png;base64,...",
    "usage": ""
  }
}
```

## Dependencies

All loaded via CDN (no installation required):

- [jsPDF 2.5.1](https://github.com/parallax/jsPDF) - PDF generation
- [html-to-image 1.11.11](https://github.com/bubkoo/html-to-image) - DOM-to-image capture
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) - QR code generation
- [Google Fonts](https://fonts.google.com/) - Dynamic font loading

## License

This software is provided "as is", without warranty of any kind. Use at your own risk.
