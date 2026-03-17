// Script para executar o arquivo database/schema.sql contra o banco configurado
const fs = require('fs');
const path = require('path');
const db = require('../utils/db');

async function run() {
  try {
    const file = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(file, 'utf8');

    console.log('Executando migrations (schema.sql) ...');
    // executeQuery aceita múltiplas instruções
    await db.executeQuery(sql);
    console.log('Migrations executadas com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao executar migrations:', err);
    process.exit(1);
  }
}

run();
