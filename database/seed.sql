-- ============================================================
-- Seed Data (PostgreSQL / Supabase)
-- ============================================================
-- Senhas: hash bcrypt de 'pastor123', 'lider123', 'membro123'

-- Usuários
INSERT INTO usuarios (nome, email, senha, tipo_perfil) VALUES
('Pastor João Silva',      'pastor@igreja.com',  '$2a$10$Ovs48PaeeNohcHnsYwAYmec9KjsF/5CJ5s7GcNbeMPksecxR11Vy6', 'pastor'),
('Líder Maria Oliveira',   'lider@igreja.com',   '$2a$10$EmHsLy/A8LZkKRNdG.nhR.RYlKgV79kYMouBzWMe6KRfVEFuTLXUS', 'admin'),
('Membro José Santos',     'membro@igreja.com',  '$2a$10$JMGfjHGqp3sfcIP6Gm0iouI7.ZZiMdDtpplQYphavUDqBWfYe6gIu', 'padrao'),
('Líder Ana Costa',        'ana@igreja.com',     '$2a$10$EmHsLy/A8LZkKRNdG.nhR.RYlKgV79kYMouBzWMe6KRfVEFuTLXUS', 'admin'),
('Membro Carlos Pereira',  'carlos@igreja.com',  '$2a$10$JMGfjHGqp3sfcIP6Gm0iouI7.ZZiMdDtpplQYphavUDqBWfYe6gIu', 'padrao');

-- Ministérios
INSERT INTO ministerios (nome, descricao, id_lider) VALUES
('Louvor',    'Ministério de música e adoração',            2),
('Infantil',  'Ministério para crianças',                   4),
('Jovens',    'Ministério para jovens e adolescentes',      2),
('Recepção',  'Ministério de recepção e acolhimento',       4),
('Mídia',     'Ministério de comunicação e mídias sociais', NULL);

-- Membros de Ministérios
INSERT INTO membros_ministerio (id_usuario, id_ministerio, funcao, instrumento) VALUES
(2, 1, 'Líder',          'Teclado'),
(3, 1, 'Guitarrista',    'Guitarra'),
(5, 1, 'Vocalista',      NULL),
(4, 2, 'Líder',          NULL),
(3, 2, 'Auxiliar',       NULL),
(2, 3, 'Líder',          NULL),
(5, 3, 'Auxiliar',       NULL),
(4, 4, 'Líder',          NULL),
(3, 4, 'Recepcionista',  NULL);

-- Escalas
INSERT INTO escalas (id_ministerio, data, descricao) VALUES
(1, '2025-06-01', 'Culto de Domingo - Manhã'),
(1, '2025-06-01', 'Culto de Domingo - Noite'),
(1, '2025-06-08', 'Culto de Domingo - Manhã'),
(1, '2025-06-08', 'Culto de Domingo - Noite'),
(2, '2025-06-01', 'Escola Dominical'),
(2, '2025-06-08', 'Escola Dominical'),
(3, '2025-06-06', 'Encontro de Jovens'),
(4, '2025-06-01', 'Recepção - Culto Matutino'),
(4, '2025-06-01', 'Recepção - Culto Noturno');

-- Escalas ↔ Membros (relação N:N)
INSERT INTO escalas_membros (id_escala, id_membro) VALUES
(1, 1), (1, 2), (1, 3),    -- Culto Manhã 01/06: Líder Maria, Guitarrista José, Vocalista Carlos
(2, 1), (2, 3),             -- Culto Noite 01/06: Líder Maria, Vocalista Carlos
(3, 1), (3, 2),             -- Culto Manhã 08/06: Líder Maria, Guitarrista José
(4, 1), (4, 3),             -- Culto Noite 08/06: Líder Maria, Vocalista Carlos
(5, 4), (5, 5),             -- Escola Dominical 01/06: Líder Ana, Auxiliar José
(6, 4), (6, 5),             -- Escola Dominical 08/06: Líder Ana, Auxiliar José
(7, 6), (7, 7),             -- Encontro de Jovens: Líder Maria, Auxiliar Carlos
(8, 8), (8, 9),             -- Recepção Matutino: Líder Ana, Recepcionista José
(9, 8);                     -- Recepção Noturno: Líder Ana

-- Conteúdos (biblioteca central)
INSERT INTO conteudos (id_ministerio, titulo, link_arquivo, data_publicacao) VALUES
(1, 'Cifras - Junho 2025',           'https://drive.google.com/file/cifras-junho-2025',           '2025-05-20'),
(1, 'Escalas de Louvor - Junho 2025','https://drive.google.com/file/escalas-louvor-junho-2025',   '2025-05-22'),
(2, 'Material Infantil - Junho 2025','https://drive.google.com/file/material-infantil-junho-2025','2025-05-21'),
(3, 'Programação Jovem - Junho 2025','https://drive.google.com/file/programacao-jovem-junho-2025','2025-05-23'),
(4, 'Manual de Recepção',            'https://drive.google.com/file/manual-recepcao',             '2025-05-15');

-- Conteúdos de Escala (vinculados a escalas específicas)
INSERT INTO conteudos_escala (id_escala, tipo, titulo, detalhes, link) VALUES
(1, 'musica',  'Grande é o Senhor',    'Tom: E, BPM: 75',              'https://drive.google.com/file/grande-senhor'),
(1, 'musica',  'Maravilhosa Graça',    'Tom: G, BPM: 72',              'https://drive.google.com/file/maravilhosa-graca'),
(1, 'arquivo', 'Playbacks',            'Pasta com todos os playbacks',  'https://drive.google.com/folder/playbacks-culto-manha'),
(2, 'musica',  'Rei do Meu Coração',   'Tom: D, BPM: 68',              'https://drive.google.com/file/rei-coracao'),
(2, 'musica',  'Teu Santo Nome',       'Tom: A, BPM: 74',              'https://drive.google.com/file/teu-santo-nome'),
(5, 'arquivo', 'Lição do Dia',         'Material para aula',            'https://drive.google.com/file/licao-junho-01'),
(5, 'arquivo', 'Atividades',           'Folhas para colorir',           'https://drive.google.com/file/atividades-junho-01'),
(7, 'arquivo', 'Tema do Encontro',     'Slides da apresentação',        'https://drive.google.com/file/slides-jovens-junho'),
(7, 'arquivo', 'Dinâmica',             'Instruções para dinâmica em grupo', 'https://drive.google.com/file/dinamica-jovens-junho');

-- Plataformas de Música
INSERT INTO plataformas (nome, url, icone, cor, descricao, ativo) VALUES
('Cifra Club',    'https://www.cifraclub.com.br', 'fa-guitar',   '#2D9CDB', 'Plataforma de cifras e tablaturas.',                     true),
('YouTube',       'https://www.youtube.com',      'fa-youtube',  '#FF0000', 'Plataforma de vídeos com músicas e tutoriais.',           true),
('Spotify',       'https://open.spotify.com',     'fa-spotify',  '#1DB954', 'Serviço de streaming de música.',                         true),
('Deezer',        'https://www.deezer.com',       'fa-music',    '#00C7F2', 'Serviço de streaming de música com playlists e rádios.',  true),
('Google Drive',  'https://drive.google.com',     'fa-file-pdf', '#4285F4', 'Armazenamento de partituras e letras em PDF.',            true);

-- Ordens de Culto
INSERT INTO ordens_culto (titulo, data, hora_inicio, hora_fim, local_culto, dirigente) VALUES
('Culto de Celebração',  '2025-05-31', '10:00', '12:00', 'Templo Principal', 'Pr. João Silva'),
('Culto de Celebração',  '2025-05-24', '10:00', '12:00', 'Templo Principal', 'Pr. João Silva'),
('Modelo Padrão de Culto', NULL,        '10:00', '12:00', 'Templo Principal', '');

-- Itens da Ordem de Culto (próximo culto — 31/05)
INSERT INTO itens_ordem_culto (id_ordem, titulo, tipo, responsavel, duracao, descricao, ordem) VALUES
(1, 'Prelúdio',              'louvor',    'Ministério de Louvor', 5,  'Música instrumental de abertura',          1),
(1, 'Boas-vindas e Oração',  'oracao',    'Pr. João Silva',       5,  'Boas-vindas aos visitantes e oração',      2),
(1, 'Louvor e Adoração',     'louvor',    'Ministério de Louvor', 20, 'Momento de louvor congregacional',         3),
(1, 'Leitura Bíblica',       'leitura',   'Diác. Maria Oliveira', 5,  'Salmos 100',                               4),
(1, 'Oferta',                'oferta',    'Diáconos',             10, 'Momento de contribuição e gratidão',       5),
(1, 'Mensagem',              'mensagem',  'Pr. João Silva',       40, 'Tema: "O Poder da Gratidão"',              6),
(1, 'Oração Final',          'oracao',    'Pr. João Silva',       5,  'Oração de encerramento',                   7),
(1, 'Avisos',                'anuncios',  'Secretaria',           5,  'Informações sobre próximos eventos',       8),
(1, 'Bênção Apostólica',     'bencao',    'Pr. João Silva',       5,  'Bênção final',                             9);

-- Itens do culto anterior — 24/05
INSERT INTO itens_ordem_culto (id_ordem, titulo, tipo, responsavel, duracao, descricao, ordem) VALUES
(2, 'Prelúdio',              'louvor',    'Ministério de Louvor', 5,  'Música instrumental de abertura',          1),
(2, 'Boas-vindas e Oração',  'oracao',    'Pr. João Silva',       5,  'Boas-vindas e oração inicial',             2),
(2, 'Louvor e Adoração',     'louvor',    'Ministério de Louvor', 20, 'Momento de louvor congregacional',         3),
(2, 'Mensagem',              'mensagem',  'Pr. João Silva',       40, 'Tema: "Fé em Tempos Difíceis"',            4),
(2, 'Oração Final',          'oracao',    'Pr. João Silva',       5,  'Oração de encerramento',                   5),
(2, 'Bênção Apostólica',     'bencao',    'Pr. João Silva',       5,  'Bênção final',                             6);

-- Itens do modelo padrão
INSERT INTO itens_ordem_culto (id_ordem, titulo, tipo, responsavel, duracao, descricao, ordem) VALUES
(3, 'Prelúdio',              'louvor',    'Ministério de Louvor', 5,  'Música instrumental de abertura',  1),
(3, 'Boas-vindas e Oração',  'oracao',    '',                     5,  'Boas-vindas e oração inicial',     2),
(3, 'Louvor e Adoração',     'louvor',    'Ministério de Louvor', 20, 'Momento de louvor congregacional',  3),
(3, 'Leitura Bíblica',       'leitura',   '',                     5,  '',                                  4),
(3, 'Mensagem',              'mensagem',  '',                     40, '',                                  5),
(3, 'Oração Final',          'oracao',    '',                     5,  'Oração de encerramento',            6),
(3, 'Bênção Apostólica',     'bencao',    '',                     5,  'Bênção final',                      7);

-- Códigos de Convite (para registro)
INSERT INTO codigos_convite (codigo, perfil, usado, id_criador) VALUES
('IGREJA2025', 'padrao', false, 1),
('LIDER2025',  'admin',  false, 1);

-- Categorias Financeiras padrão (Tesouraria)
INSERT INTO categorias_financeiras (nome, tipo, cor) VALUES
('Dízimo',                      'entrada', '#1b5e3f'),
('Oferta',                      'entrada', '#27ae60'),
('Doação',                      'entrada', '#2ecc71'),
('Evento/Campanha',             'entrada', '#16a085'),
('Outras Entradas',             'entrada', '#6c757d'),
('Contas (água/luz/internet)',  'saida',   '#c0392b'),
('Manutenção e Reformas',       'saida',   '#e74c3c'),
('Materiais e Suprimentos',     'saida',   '#d35400'),
('Missões',                     'saida',   '#8e44ad'),
('Ajuda de Custo/Salários',     'saida',   '#2980b9'),
('Outras Saídas',               'saida',   '#6c757d');
