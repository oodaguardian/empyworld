# LICENSES & ATTRIBUTIONS — Empy TV

## Overview
All game assets in Empy TV are **self-contained** and require no external asset downloads at runtime (except optional book cover images).

## Code & Frameworks
| Dependency | License |
|---|---|
| React | MIT |
| React Router DOM | MIT |
| Vite | MIT |
| Tailwind CSS | MIT |
| DaisyUI | MIT |
| Framer Motion | MIT |

## Assets

### Emoji
All game graphics use **Unicode emoji** rendered by the operating system's native emoji font. No emoji image files are bundled.

### SVG Graphics
All SVG shapes, coloring book scenes, and dress-up character art are **original inline SVG** created for this project. No external SVG files or icon libraries are used.

### Sound Effects
All sounds are generated at runtime using the **Web Audio API** (OscillatorNode). No audio files are bundled or downloaded.

### Text-to-Speech
Uses the browser's built-in **Web Speech API** (SpeechSynthesis). No third-party TTS service.

## External APIs

### YouTube Data API v3
Used for fetching video lists in the Videos section. Subject to [YouTube API Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service).

### Open Library API
Used in the Book Reader to fetch children's book covers from `openlibrary.org`. Open Library data is available under [OL license terms](https://openlibrary.org/developers/api). Cover images are hotlinked, not bundled.

### Poki.com / CrazyGames.com / Scratch.mit.edu
External game links open in a new tab or sandboxed iframe. No Poki/CrazyGames/Scratch code or assets are bundled.

## Fonts
- **Nunito** (Google Fonts) — OFL (SIL Open Font License)

## Content
All story text in the Book Reader is from **public domain** works:
- *The Tale of Peter Rabbit* — Beatrix Potter (1902, public domain)
- *The Tortoise and the Hare* — Aesop's Fables (ancient, public domain)
- *Goldilocks and the Three Bears* — Robert Southey (1837, public domain)
- *The Three Little Pigs* — English fairy tale (traditional, public domain)
- *The Ugly Duckling* — Hans Christian Andersen (1843, public domain)
