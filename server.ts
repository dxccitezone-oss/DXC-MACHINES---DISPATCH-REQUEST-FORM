import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import {
  acknowledgeGatePass,
  authenticateUser,
  dispatchGatePass,
  getDashboardSummary,
  getGatePassById,
  getNextGpNumber,
  getSettings,
  getUserById,
  listDepartments,
  listGatePasses,
  listStockItems,
  listUsers,
  saveGatePass,
  updateSettings,
  upsertDepartment,
  upsertStockItem,
  upsertUser,
} from './server/db.ts';
import {
  EXCEL_FILENAME,
  ensureExcelFileExists,
  getExcelMetadata,
  syncGatePassToExcel,
} from './server/excel.ts';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const getActorId = (req: express.Request): string => {
    const headerId = req.headers['x-user-id'];
    if (typeof headerId === 'string' && headerId.trim()) {
      return headerId.trim();
    }
    return '';
  };

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, storage: 'local-file-json-db' });
  });

  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ error: 'Username/Email and Password are required.' });
      return;
    }
    const user = authenticateUser(String(username), String(password));
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials or inactive account.' });
      return;
    }
    res.json({ user });
  });

  app.get('/api/auth/me', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    const user = getUserById(actorId);
    if (!user || !user.active) {
      res.status(401).json({ error: 'Session invalid or user deactivated.' });
      return;
    }
    res.json({ user });
  });

  // Dashboard
  app.get('/api/dashboard', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    res.json(getDashboardSummary());
  });

  // Gate Passes
  app.get('/api/gate-passes/next-number', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    res.json({ gpNo: getNextGpNumber() });
  });

  app.get('/api/gate-passes', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    res.json({ gatePasses: listGatePasses() });
  });

  app.get('/api/gate-passes/:id', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const gp = getGatePassById(req.params.id);
    if (!gp) {
      res.status(404).json({ error: 'Gate Pass not found.' });
      return;
    }
    res.json({ gatePass: gp });
  });

  app.post('/api/gate-passes', async (req, res) => {
    const actorId = getActorId(req);
    const result = saveGatePass(req.body, actorId);
    if (result.error || !result.gatePass) {
      res.status(result.statusCode || 400).json({ error: result.error });
      return;
    }
    try {
      await syncGatePassToExcel(result.gatePass, listGatePasses());
    } catch (excelErr) {
      console.error('Excel sync warning on save:', excelErr);
    }
    res.status(201).json({ gatePass: result.gatePass, excelFile: EXCEL_FILENAME });
  });

  app.put('/api/gate-passes/:id', async (req, res) => {
    const actorId = getActorId(req);
    const result = saveGatePass({ ...req.body, id: req.params.id }, actorId);
    if (result.error || !result.gatePass) {
      res.status(result.statusCode || 400).json({ error: result.error });
      return;
    }
    try {
      await syncGatePassToExcel(result.gatePass, listGatePasses(), result.previousGpNo);
    } catch (excelErr) {
      console.error('Excel sync warning on update:', excelErr);
    }
    res.json({ gatePass: result.gatePass, excelFile: EXCEL_FILENAME });
  });

  app.post('/api/gate-passes/:id/dispatch', async (req, res) => {
    const actorId = getActorId(req);
    const result = dispatchGatePass(req.params.id, req.body || {}, actorId);
    if (result.error || !result.gatePass) {
      res.status(result.statusCode || 400).json({ error: result.error });
      return;
    }
    try {
      await syncGatePassToExcel(result.gatePass, listGatePasses());
    } catch (excelErr) {
      console.error('Excel sync warning on dispatch:', excelErr);
    }
    res.json({ gatePass: result.gatePass, excelFile: EXCEL_FILENAME });
  });

  app.post('/api/gate-passes/:id/acknowledge', async (req, res) => {
    const actorId = getActorId(req);
    const result = acknowledgeGatePass(req.params.id, req.body || {}, actorId);
    if (result.error || !result.gatePass) {
      res.status(result.statusCode || 400).json({ error: result.error });
      return;
    }
    try {
      await syncGatePassToExcel(result.gatePass, listGatePasses());
    } catch (excelErr) {
      console.error('Excel sync warning on acknowledge:', excelErr);
    }
    res.json({ gatePass: result.gatePass, excelFile: EXCEL_FILENAME });
  });

  // Excel Workbook Export & Info
  app.get('/api/export/excel/info', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    res.json(getExcelMetadata(listGatePasses()));
  });

  app.get('/api/export/excel', async (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    try {
      const filePath = await ensureExcelFileExists(listGatePasses());
      res.download(filePath, EXCEL_FILENAME);
    } catch (err) {
      console.error('Excel export failed:', err);
      res.status(500).json({ error: 'Failed to generate Excel workbook.' });
    }
  });

  // Departments
  app.get('/api/departments', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    res.json({ departments: listDepartments() });
  });

  app.post('/api/departments', (req, res) => {
    const actorId = getActorId(req);
    const result = upsertDepartment(req.body, actorId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ department: result.department });
  });

  app.put('/api/departments/:id', (req, res) => {
    const actorId = getActorId(req);
    const result = upsertDepartment({ ...req.body, id: req.params.id }, actorId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ department: result.department });
  });

  // Stock Master
  app.get('/api/stock-items', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    res.json({ stockItems: listStockItems() });
  });

  app.post('/api/stock-items', (req, res) => {
    const actorId = getActorId(req);
    const result = upsertStockItem(req.body, actorId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ stockItem: result.stockItem });
  });

  app.put('/api/stock-items/:id', (req, res) => {
    const actorId = getActorId(req);
    const result = upsertStockItem({ ...req.body, id: req.params.id }, actorId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ stockItem: result.stockItem });
  });

  // Users
  app.get('/api/users', (req, res) => {
    const actorId = getActorId(req);
    const result = listUsers(actorId);
    if (result.error) {
      res.status(403).json({ error: result.error });
      return;
    }
    res.json({ users: result.users });
  });

  app.post('/api/users', (req, res) => {
    const actorId = getActorId(req);
    const result = upsertUser(req.body, actorId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ user: result.user });
  });

  app.put('/api/users/:id', (req, res) => {
    const actorId = getActorId(req);
    const result = upsertUser({ ...req.body, id: req.params.id }, actorId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ user: result.user });
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    const actorId = getActorId(req);
    if (!actorId || !getUserById(actorId)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    res.json({ settings: getSettings() });
  });

  app.put('/api/settings', (req, res) => {
    const actorId = getActorId(req);
    const result = updateSettings(req.body, actorId);
    if (result.error) {
      res.status(403).json({ error: result.error });
      return;
    }
    res.json({ settings: result.settings });
  });

  // Unmatched /api/* routes should always return JSON 404 instead of SPA HTML
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Vite dev middleware or static dist serving
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Global Express error handler (malformed JSON or unhandled errors)
  app.use(
    (
      err: Error & { status?: number; type?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'Invalid JSON request payload.' });
        return;
      }
      console.error('Unhandled server error:', err);
      res.status(err.status || 500).json({ error: 'Internal server error.' });
    }
  );

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TJD Gate Pass Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
