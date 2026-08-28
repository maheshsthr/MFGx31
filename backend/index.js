import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createApp } from './src/app.js';

const app = createApp();

// Compare the resolved filesystem paths. process.argv[1] is a plain path on most
// runtimes (e.g. Windows), so we must NOT run fileURLToPath() on it (that would
// throw ERR_INVALID_URL_SCHEME); resolve() handles both forms.
const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

// Only listen when run directly (local `node index.js`).
// When Vercel imports this module as a serverless Function it must NOT bind a
// port — the default-exported `app` is what Vercel uses.
if (isDirectRun) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`MFGx31 API running on http://localhost:${port}`);
  });
}

export default app;