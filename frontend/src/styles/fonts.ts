// Self-hosted font bundling (charter 3.1: zero external requests at
// runtime). Only the weights actually used by the design system are
// imported -- keeps the base bundle lean per the WASM doctrine's budget
// note (spec 02.7). Never add a <link> to fonts.googleapis.com or any CDN.

import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
