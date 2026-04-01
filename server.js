/**
 * Servidor Express - GanaPlay Smart Dashboard
 * Desarrollado por: Senior Fullstack Developer
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const cors = require('cors');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Importar el módulo de lógica matemática y procesamiento de datos
const { analyzeCampaignData } = require('./code');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Generar firebase-config.js en public/ al iniciar ─────────────────────────
const firebaseConfigContent = `window.__FIREBASE_CONFIG__ = ${JSON.stringify({
  apiKey:            process.env.FIREBASE_API_KEY        || null,
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN    || null,
  databaseURL:       process.env.FIREBASE_DATABASE_URL   || null,
  projectId:         process.env.FIREBASE_PROJECT_ID     || null,
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET || null,
  messagingSenderId: process.env.FIREBASE_SENDER_ID      || null,
  appId:             process.env.FIREBASE_APP_ID         || null,
})};`;
fs.writeFileSync(path.join(__dirname, 'public', 'firebase-config.js'), firebaseConfigContent, 'utf8');
console.log('🔥 firebase-config.js generado con variables de entorno.');

// ── Credenciales via variables de entorno (nunca hardcodeadas) ──────────────
const USERS = {
  [process.env.ADMIN_USER  || 'admin']:    { pass: process.env.ADMIN_PASS  || 'admin',  role: 'admin' },
  [process.env.SUPERVISOR_USER || 'andres']: { pass: process.env.SUPERVISOR_PASS || 'andres', role: 'supervisor' }
};
const SESSION_SECRET = process.env.SESSION_SECRET || 'ganaplay-secret-2026';

// ── Token helpers ────────────────────────────────────────────────────────────
function generateToken(role) {
  const payload = `${role}:${Date.now()}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64');
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const lastColon = decoded.lastIndexOf(':');
    const payload = decoded.substring(0, lastColon);
    const sig = decoded.substring(lastColon + 1);
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if (sig !== expected) return null;
    const [role, ts] = payload.split(':');
    if (Date.now() - parseInt(ts) > 24 * 60 * 60 * 1000) return null; // expira en 24h
    return { role };
  } catch { return null; }
}

function requireAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  next();
}

// ── CORS — solo orígenes permitidos ─────────────────────────────────────────
// CORS abierto — cualquier IP puede visualizar el dashboard
app.use(cors({ origin: true, methods: ['GET', 'POST'] }));

// ── Headers de seguridad ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Rate limiting ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Demasiados intentos de login. Intenta en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.json({ limit: '1mb' }));

// ── Rutas ────────────────────────────────────────────────────────────────────

// Archivos estaticos (incluye firebase-config.js generado al inicio)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * POST /api/login
 * Valida credenciales y devuelve token de sesión
 */
app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  }
  const user = USERS[username];
  if (!user || user.pass !== password) {
    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  }
  const token = generateToken(user.role);
  res.status(200).json({ token, role: user.role });
});

// Constantes de negocio (mover a .env en producción)
const GLOBAL_BUDGET = process.env.GLOBAL_BUDGET ? parseInt(process.env.GLOBAL_BUDGET) : 50000;
const DEADLINE = process.env.DEADLINE || "2026-06-30T23:59:59-05:00";

/**
 * GET /api/report
 */
app.get('/api/report', apiLimiter, (req, res) => {
  const results = [];
  const csvFilePath = path.join(__dirname, 'data.csv');

  if (!fs.existsSync(csvFilePath)) {
    return res.status(404).json({ error: 'Archivo data.csv no encontrado.' });
  }

  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on('data', (data) => {
      results.push({
        Fecha: data.Fecha,
        Inversión: parseFloat(data.Inversión),
        Registros: parseInt(data.Registros, 10),
        FTDs: parseInt(data.FTDs, 10)
      });
    })
    .on('end', () => {
      try {
        const dashboardReport = analyzeCampaignData(results, GLOBAL_BUDGET, DEADLINE);
        res.status(200).json(dashboardReport);
      } catch (error) {
        console.error('Error al procesar data matemática:', error.message);
        res.status(500).json({ error: 'Falló el motor de análisis de campaña.' });
      }
    });
});

const SYNC_DATA_PATH = path.join(__dirname, 'dashboard_data.json');

/**
 * POST /api/save-data
 */
app.post('/api/save-data', apiLimiter, requireAuth, (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Payload inválido.' });
    }
    const payload = { ...data, savedAt: new Date().toISOString() };
    fs.writeFileSync(SYNC_DATA_PATH, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`💾 [SYNC] Datos guardados: ${JSON.stringify(payload).length} bytes`);
    res.status(200).json({ success: true, savedAt: payload.savedAt });
  } catch (error) {
    console.error('❌ Error guardando datos sync:', error.message);
    res.status(500).json({ error: 'No se pudieron guardar los datos.' });
  }
});

/**
 * GET /api/load-data
 */
app.get('/api/load-data', apiLimiter, (req, res) => {
  try {
    if (!fs.existsSync(SYNC_DATA_PATH)) {
      return res.status(404).json({ error: 'No hay datos guardados aún.' });
    }
    const raw = fs.readFileSync(SYNC_DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Error cargando datos sync:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los datos.' });
  }
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Operative', message: 'GanaPlay Dashboard 1.0 activo.' });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 GanaPlay Dashboard corriendo en http://localhost:${PORT}`);
  console.log(`=========================================`);
});
