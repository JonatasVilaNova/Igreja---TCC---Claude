/**
 * db.js — Utilitário de conexão com Supabase
 * Substitui o antigo mssql para usar PostgreSQL via Supabase.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('⚠️  SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos no .env');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: { persistSession: false }
});

/**
 * Retorna a instância do Supabase client.
 * Usado por todos os módulos de rotas.
 */
function getClient() {
    return supabase;
}

module.exports = { getClient };
