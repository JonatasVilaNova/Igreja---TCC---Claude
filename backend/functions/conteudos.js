// Rotas para gestão de conteúdos
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { verificarToken, verificarPermissao } = require('./auth');

// Listar todos os conteúdos
router.get('/', verificarToken, async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.idMinisterio, c.titulo, c.linkArquivo, c.dataPublicacao,
             m.nome as nomeMinisterio
      FROM Conteudos c
      JOIN Ministerios m ON c.idMinisterio = m.id
      ORDER BY c.dataPublicacao DESC
    `;
    
    const conteudos = await db.executeQuery(query);
    res.status(200).json(conteudos);
  } catch (error) {
    console.error('Erro ao listar conteúdos:', error);
    res.status(500).json({ error: 'Erro ao listar conteúdos.' });
  }
});

// Obter um conteúdo específico
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT c.id, c.idMinisterio, c.titulo, c.linkArquivo, c.dataPublicacao,
             m.nome as nomeMinisterio
      FROM Conteudos c
      JOIN Ministerios m ON c.idMinisterio = m.id
      WHERE c.id = @param0
    `;
    
    const conteudos = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (conteudos.length === 0) {
      return res.status(404).json({ error: 'Conteúdo não encontrado.' });
    }
    
    res.status(200).json(conteudos[0]);
  } catch (error) {
    console.error('Erro ao obter conteúdo:', error);
    res.status(500).json({ error: 'Erro ao obter conteúdo.' });
  }
});

// Listar conteúdos de um ministério específico
router.get('/ministerio/:idMinisterio', verificarToken, async (req, res) => {
  try {
    const { idMinisterio } = req.params;
    
    const query = `
      SELECT c.id, c.idMinisterio, c.titulo, c.linkArquivo, c.dataPublicacao,
             m.nome as nomeMinisterio
      FROM Conteudos c
      JOIN Ministerios m ON c.idMinisterio = m.id
      WHERE c.idMinisterio = @param0
      ORDER BY c.dataPublicacao DESC
    `;
    
    const conteudos = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(idMinisterio) }
    ]);
    
    res.status(200).json(conteudos);
  } catch (error) {
    console.error('Erro ao listar conteúdos do ministério:', error);
    res.status(500).json({ error: 'Erro ao listar conteúdos do ministério.' });
  }
});

// Criar um novo conteúdo (apenas para admin ou pastor)
router.post('/', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { idMinisterio, titulo, linkArquivo, dataPublicacao } = req.body;
    
    if (!idMinisterio || !titulo || !linkArquivo || !dataPublicacao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    
    // Verificar se o ministério existe
    const queryVerificarMinisterio = `
      SELECT COUNT(*) as count
      FROM Ministerios
      WHERE id = @param0
    `;
    
    const resultadoMinisterio = await db.executeQuery(queryVerificarMinisterio, [
      { placeholder: '@param0', value: idMinisterio }
    ]);
    
    if (resultadoMinisterio[0].count === 0) {
      return res.status(400).json({ error: 'Ministério não encontrado.' });
    }
    
    // Inserir novo conteúdo
    const queryInserir = `
      INSERT INTO Conteudos (idMinisterio, titulo, linkArquivo, dataPublicacao)
      VALUES (@param0, @param1, @param2, @param3);
      SELECT SCOPE_IDENTITY() as id;
    `;
    
    const resultadoInsercao = await db.executeQuery(queryInserir, [
      { placeholder: '@param0', value: idMinisterio },
      { placeholder: '@param1', value: titulo },
      { placeholder: '@param2', value: linkArquivo },
      { placeholder: '@param3', value: dataPublicacao }
    ]);
    
    const id = resultadoInsercao[0].id;
    
    // Obter informações completas do conteúdo
    const queryObterConteudo = `
      SELECT c.id, c.idMinisterio, c.titulo, c.linkArquivo, c.dataPublicacao,
             m.nome as nomeMinisterio
      FROM Conteudos c
      JOIN Ministerios m ON c.idMinisterio = m.id
      WHERE c.id = @param0
    `;
    
    const conteudos = await db.executeQuery(queryObterConteudo, [
      { placeholder: '@param0', value: id }
    ]);
    
    res.status(201).json(conteudos[0]);
  } catch (error) {
    console.error('Erro ao criar conteúdo:', error);
    res.status(500).json({ error: 'Erro ao criar conteúdo.' });
  }
});

// Atualizar um conteúdo (apenas para admin ou pastor)
router.put('/:id', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { idMinisterio, titulo, linkArquivo, dataPublicacao } = req.body;
    
    if (!idMinisterio || !titulo || !linkArquivo || !dataPublicacao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    
    // Verificar se o conteúdo existe
    const queryVerificar = `
      SELECT *
      FROM Conteudos
      WHERE id = @param0
    `;
    
    const conteudos = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (conteudos.length === 0) {
      return res.status(404).json({ error: 'Conteúdo não encontrado.' });
    }
    
    // Verificar se o ministério existe
    const queryVerificarMinisterio = `
      SELECT COUNT(*) as count
      FROM Ministerios
      WHERE id = @param0
    `;
    
    const resultadoMinisterio = await db.executeQuery(queryVerificarMinisterio, [
      { placeholder: '@param0', value: idMinisterio }
    ]);
    
    if (resultadoMinisterio[0].count === 0) {
      return res.status(400).json({ error: 'Ministério não encontrado.' });
    }
    
    // Atualizar conteúdo
    const queryAtualizar = `
      UPDATE Conteudos
      SET idMinisterio = @param0, titulo = @param1, linkArquivo = @param2, dataPublicacao = @param3
      WHERE id = @param4
    `;
    
    await db.executeQuery(queryAtualizar, [
      { placeholder: '@param0', value: idMinisterio },
      { placeholder: '@param1', value: titulo },
      { placeholder: '@param2', value: linkArquivo },
      { placeholder: '@param3', value: dataPublicacao },
      { placeholder: '@param4', value: parseInt(id) }
    ]);
    
    // Obter conteúdo atualizado
    const queryObterAtualizado = `
      SELECT c.id, c.idMinisterio, c.titulo, c.linkArquivo, c.dataPublicacao,
             m.nome as nomeMinisterio
      FROM Conteudos c
      JOIN Ministerios m ON c.idMinisterio = m.id
      WHERE c.id = @param0
    `;
    
    const conteudosAtualizados = await db.executeQuery(queryObterAtualizado, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json(conteudosAtualizados[0]);
  } catch (error) {
    console.error('Erro ao atualizar conteúdo:', error);
    res.status(500).json({ error: 'Erro ao atualizar conteúdo.' });
  }
});

// Excluir um conteúdo (apenas para admin ou pastor)
router.delete('/:id', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o conteúdo existe
    const queryVerificar = `
      SELECT *
      FROM Conteudos
      WHERE id = @param0
    `;
    
    const conteudos = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (conteudos.length === 0) {
      return res.status(404).json({ error: 'Conteúdo não encontrado.' });
    }
    
    // Excluir o conteúdo
    const queryExcluir = `
      DELETE FROM Conteudos
      WHERE id = @param0
    `;
    
    await db.executeQuery(queryExcluir, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json({ message: 'Conteúdo excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir conteúdo:', error);
    res.status(500).json({ error: 'Erro ao excluir conteúdo.' });
  }
});

module.exports = router;
