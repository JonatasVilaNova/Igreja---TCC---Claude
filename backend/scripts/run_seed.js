// Script para executar o arquivo database/seed.sql contra o banco configurado
const fs = require('fs');
const path = require('path');
const db = require('../utils/db');

async function run() {
  try {
    const file = path.join(__dirname, '..', '..', 'database', 'seed.sql');
    const sql = fs.readFileSync(file, 'utf8');

    console.log('Executando seed (seed.sql) ...');
    await db.executeQuery(sql);
    console.log('Seed executado com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao executar seed:', err);
    process.exit(1);
  }
}

run();
