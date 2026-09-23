/**
 * Keep puppeteer's Chrome INSIDE node_modules. Netlify caches node_modules
 * between builds but not ~/.cache, so with the default location a build that
 * restores node_modules from cache skips puppeteer's postinstall download and
 * the prerender step dies with "Could not find Chrome" (hit on the sister site
 * sreemoulika.com, same setup). `npm run prerender` also runs `puppeteer
 * browsers install chrome` first — a no-op when the browser is present.
 */
const { join } = require('path');

module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};
