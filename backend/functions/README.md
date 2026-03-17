Cloud Functions (Express) — backend

Como usar localmente

- Instale dependências dentro de `backend/functions`:

```powershell
cd backend/functions
npm install
```

- Copie `.env.example` para `.env` e preencha as variáveis (ou use variáveis de ambiente do sistema):

```powershell
copy .env.example .env
# editar .env
```

- Rode em modo desenvolvimento:

```powershell
npm run dev
```

Deploy no Firebase

- O código já exporta `exports.api = app;` em `index.js` — para deploy via Firebase, você pode configurar o diretório de functions para `backend/functions` ou mover o conteúdo para a pasta `functions/` na raiz do projeto.

- Para fornecer variáveis de ambiente seguras no Firebase você tem duas opções:
  - Usar o Console do Firebase / Google Cloud e configurar variáveis de ambiente na seção de configurações da função (recomendado para produção).
  - Ou usar `gcloud functions deploy` com `--set-env-vars`.

Exemplo (deploy com gcloud):

```bash
gcloud functions deploy api --region=us-central1 --runtime=nodejs16 \
  --trigger-http --allow-unauthenticated \
  --set-env-vars "DB_USER=...,DB_PASSWORD=...,DB_SERVER=...,DB_NAME=...,JWT_SECRET=..."
```

Observações

- O utilitário de DB está em `backend/utils/db.js` e já usa `process.env.DB_*`.
- Mantenha os mocks no frontend enquanto desenvolve; o frontend agora suporta `window.APP_CONFIG` para alternar entre mocks e API real.

Executando migrations e seed localmente

Na raiz do projeto existem os arquivos SQL:

- `database/schema.sql` — scripts DDL para criar tabelas
- `database/seed.sql` — scripts DML para popular dados iniciais

Scripts Node para executar localmente estão em `backend/scripts`:

```powershell
# a partir da raiz do repositório
cd backend/functions
npm install

# rodar migrations (cria tabelas)
npm run migrate

# rodar seed (insere dados iniciais)
npm run seed
```

Os scripts usam as variáveis de ambiente definidas em `.env` (ou variáveis do sistema) para conectar ao Azure SQL.

Segurança

- Evite rodar o `seed.sql` em produção se ele inserir dados de exemplo ou sobrescrever dados existentes.

