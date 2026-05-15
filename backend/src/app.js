import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, isProduction } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import fieldsRoutes from './modules/fields/fields.routes.js';
import machineryRoutes from './modules/machinery/machinery.routes.js';
import cropsRoutes from './modules/crops/crops.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import employeesRoutes from './modules/employees/employees.routes.js';
import planningRoutes from './modules/planning/planning.routes.js';
import warehouseRoutes from './modules/warehouse/warehouse.routes.js';
import harvestRoutes from './modules/harvest/harvest.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

const app = express();

app.disable('x-powered-by');

if (isProduction) {
  app.set('trust proxy', 1);
}

/** До helmet/CORS/rate-limit: healthcheck PaaS (Render/Railway) не должен ловить 403/429/CORS. */
const healthPayload = { status: 'ok' };
app.get('/api/health', (req, res) => res.json(healthPayload));
app.head('/api/health', (req, res) => res.status(200).end());
app.get('/health', (req, res) => res.json(healthPayload));
app.head('/health', (req, res) => res.status(200).end());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https://tile.openstreetmap.org'],
      },
    },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (origin === env.APP_ORIGIN) {
        return callback(null, true);
      }

      /** Railway шлёт healthcheck с домена healthcheck.railway.app (см. docs.railway.com/deployments/healthchecks). */
      try {
        if (/healthcheck\.railway\.app$/i.test(new URL(origin).hostname)) {
          return callback(null, true);
        }
      } catch {
        /* невалидный Origin */
      }

      const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (!isProduction && isLocalDevOrigin) {
        return callback(null, true);
      }

      return callback(new Error('Origin не разрешен политикой CORS'));
    },
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fields', fieldsRoutes);
app.use('/api/machinery', machineryRoutes);
app.use('/api/crops', cropsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/harvest', harvestRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reports', reportsRoutes);

function resolveFrontendDistDir() {
  const configured = env.FRONTEND_DIST.trim();
  if (configured && fs.existsSync(path.join(configured, 'index.html'))) {
    return configured;
  }
  if (!isProduction) {
    return '';
  }
  const srcDir = path.dirname(fileURLToPath(import.meta.url));
  const fromRepoByFile = path.join(srcDir, '../../frontend/dist');
  const candidates = [
    fromRepoByFile,
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return '';
}

const frontendDistDir = resolveFrontendDistDir();

if (isProduction && !frontendDistDir) {
  // eslint-disable-next-line no-console
  console.warn(
    'Продакшен: не найдена папка со сборкой фронта (frontend/dist). Выполните из корня: npm run build',
  );
}

if (frontendDistDir) {
  // eslint-disable-next-line no-console
  console.log(`Раздача SPA из: ${frontendDistDir}`);
  app.use(
    express.static(frontendDistDir, {
      index: false,
      maxAge: isProduction ? '7d' : 0,
    }),
  );
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistDir, 'index.html'), (err) => next(err));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
