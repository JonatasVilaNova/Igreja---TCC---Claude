/**
 * index.js — Ponto de entrada da API (Express + Firebase Functions)
 * Conecta ao Supabase (PostgreSQL) via módulos de rotas.
 */
const express = require('express');
const cors = require('cors');
const functions = require('firebase-functions');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: true })); // TODO: restringir em produção
app.use(express.json());

// Rotas
const authRoutes          = require('./auth');
const ministeriosRoutes   = require('./ministerios');
const membrosRoutes       = require('./membros');
const escalasRoutes       = require('./escalas');
const conteudosRoutes     = require('./conteudos');
const plataformasRoutes   = require('./plataformas');
const ordensCultoRoutes   = require('./ordens-culto');
const codigosConviteRoutes = require('./codigos-convite');
const tesourariaRoutes    = require('./tesouraria');
const estudosRoutes       = require('./estudos');

app.use('/api/auth',            authRoutes);
app.use('/api/ministerios',     ministeriosRoutes);
app.use('/api/membros',         membrosRoutes);
app.use('/api/escalas',         escalasRoutes);
app.use('/api/conteudos',       conteudosRoutes);
app.use('/api/plataformas',     plataformasRoutes);
app.use('/api/ordens-culto',    ordensCultoRoutes);
app.use('/api/codigos-convite', codigosConviteRoutes);
app.use('/api/tesouraria',      tesourariaRoutes);
app.use('/api/estudos',         estudosRoutes);

// ── Aliases de compatibilidade ──────────────────────────────
// O frontend chama fetchAPI('usuarios') → /api/usuarios
// As rotas reais estão em authRoutes sob /usuarios, /usuarios/:id
// Montamos authRoutes também em /api para que /api/usuarios funcione.
app.use('/api', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Exportar como Firebase Cloud Function (Gen 1 — acesso público)
exports.api = functions
    .region('us-central1')
    .runWith({ invoker: 'public' })
    .https.onRequest(app);

// Executar localmente (quando não estiver no Firebase)
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_CONFIG) {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`🚀 API rodando em http://localhost:${PORT}`);
    });
}
