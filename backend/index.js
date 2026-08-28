import { fileURLToPath } from 'node:url';
import { createApp } from './src/app.js';

const app = createApp();

const isDirectRun =
  process.argv[1] && import.meta.url === fileURLToPath(process.argv[1]).href;

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