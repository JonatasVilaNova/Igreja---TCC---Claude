// Utilitário de conexão com o Azure SQL
const sql = require('mssql');

// Configuração de conexão com o banco de dados
const config = {
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'senha_segura',
  server: process.env.DB_SERVER || 'igreja-gestao-db.database.windows.net',
  database: process.env.DB_NAME || 'igreja_gestao_db',
  options: {
    encrypt: true, // Para conexões Azure
    trustServerCertificate: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Pool de conexão para reutilização
let pool;

// Função para inicializar o pool de conexão
async function initPool() {
  try {
    if (!pool) {
      pool = await new sql.ConnectionPool(config).connect();
      console.log('Conexão com o banco de dados estabelecida com sucesso');
    }
    return pool;
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    throw err;
  }
}

// Função para executar consultas SQL com proteção contra injeção SQL
async function executeQuery(query, params = []) {
  try {
    const pool = await initPool();
    const request = pool.request();
    
    // Adicionar parâmetros para evitar injeção SQL
    params.forEach((param, index) => {
      request.input(`param${index}`, param.value);
      // Substituir placeholders na query
      query = query.replace(param.placeholder, `@param${index}`);
    });
    
    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error('Erro ao executar consulta:', err);
    throw err;
  }
}

// Função para executar stored procedures
async function executeStoredProcedure(procedureName, params = {}) {
  try {
    const pool = await initPool();
    const request = pool.request();
    
    // Adicionar parâmetros para a stored procedure
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (err) {
    console.error(`Erro ao executar stored procedure ${procedureName}:`, err);
    throw err;
  }
}

// Função para fechar a conexão com o banco de dados
async function closePool() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Conexão com o banco de dados fechada com sucesso');
    }
  } catch (err) {
    console.error('Erro ao fechar conexão com o banco de dados:', err);
    throw err;
  }
}

// Exportar funções para uso nos módulos
module.exports = {
  executeQuery,
  executeStoredProcedure,
  closePool,
  sql // Exportar o módulo sql para uso de tipos específicos
};
