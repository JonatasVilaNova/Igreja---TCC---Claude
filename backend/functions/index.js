// Arquivo principal para inicializar as rotas das Cloud Functions
const express = require('express');
const cors = require('cors');
const ministeriosRoutes = require('./ministerios');
const membrosRoutes = require('./membros');
const escalasRoutes = require('./escalas');
const conteudosRoutes = require('./conteudos');
const authRoutes = require('./auth');

// Inicializar o app Express
const app = express();

// Middleware para parsing de JSON e CORS
app.use(express.json());
app.use(cors({ origin: true }));

// Rotas
app.use('/api/ministerios', ministeriosRoutes);
app.use('/api/membros', membrosRoutes);
app.use('/api/escalas', escalasRoutes);
app.use('/api/conteudos', conteudosRoutes);
app.use('/api/auth', authRoutes);

// Rota de teste/saúde
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API está funcionando!' });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro ao processar sua solicitação'
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Não encontrado',
    message: 'A rota solicitada não existe'
  });
});

// Exportar o app como uma Cloud Function (Firebase)
try {
  const functions = require('firebase-functions');
  exports.api = functions.https.onRequest(app);
} catch (e) {
  // se firebase-functions não estiver disponível (por exemplo, em execução direta), continuar
  console.warn('firebase-functions não disponível, exportando app diretamente para desenvolvimento.');
  exports.api = app;
}

// Para desenvolvimento local: manter a habilidade de rodar `node index.js`
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}
