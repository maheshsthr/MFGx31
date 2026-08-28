import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { organizationsRouter } from './routes/organizations.js';
import { departmentsRouter } from './routes/departments.js';
import { employeesRouter } from './routes/employees.js';
import { machineryRouter } from './routes/machinery.js';
import { maintenanceRouter } from './routes/maintenance.js';
import { resourcesRouter } from './routes/resources.js';
import { transfersRouter } from './routes/transfers.js';
import { eventsRouter } from './routes/events.js';
import { documentsRouter } from './routes/documents.js';
import { notificationsRouter } from './routes/notifications.js';
import { requireAuth } from './middleware/auth.js';

function corsOrigin(origin, callback) {
  // Allow non-browser clients (curl, health checks) and same-origin requests.
  if (!origin) return callback(null, true);

  const configured = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const local = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  const allowed =
    configured.includes(origin) ||
    local.includes(origin) ||
    origin.endsWith('.vercel.app');

  if (allowed) return callback(null, true);
  return callback(new Error('Not allowed by CORS'));
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (req, res) => res.json({ ok: true, service: 'mfgx31-api' }));

  // Public + authenticated API, exposed at the bare path (e.g. /auth/login,
  // /departments). Mounted once — do NOT add a second `/api` prefix mount,
  // otherwise the root router intercepts /api/* and rejects it at auth.
  const api = express.Router();
  api.use('/auth', authRouter);

  // Everything below /auth requires a valid session.
  api.use(requireAuth);
  api.use(organizationsRouter);
  api.use(departmentsRouter);
  api.use(employeesRouter);
  api.use(machineryRouter);
  api.use(maintenanceRouter);
  api.use(resourcesRouter);
  api.use(transfersRouter);
  api.use(eventsRouter);
  api.use(documentsRouter);
  api.use(notificationsRouter);

  app.use(api);

  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

  // Central error handler (also catches errors from catchAsync).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}