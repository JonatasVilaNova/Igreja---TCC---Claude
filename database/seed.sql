-- Scripts de inserção de dados iniciais (DML)

-- Inserção de Usuários
-- Senhas: bcrypt hash de 'pastor123', 'lider123', 'membro123'
INSERT INTO Usuarios (nome, email, senha, tipoPerfil)
VALUES 
('Pastor João Silva', 'pastor@igreja.com', '$2a$10$XJrS7/6Cd0hKJ.UIzI6UUuM6K0Y8n.29Yt1Uu7uyGZ1xW0xVPjKFO', 'pastor'),
('Líder Maria Oliveira', 'lider@igreja.com', '$2a$10$Ht0vQhZ9AwdZpLZxRFiEZOjxlEHsGM0Y3JI3ED6.KIL4mX9UbgNHe', 'admin'),
('Membro José Santos', 'membro@igreja.com', '$2a$10$Ht0vQhZ9AwdZpLZxRFiEZOjxlEHsGM0Y3JI3ED6.KIL4mX9UbgNHe', 'padrao'),
('Líder Ana Costa', 'ana@igreja.com', '$2a$10$Ht0vQhZ9AwdZpLZxRFiEZOjxlEHsGM0Y3JI3ED6.KIL4mX9UbgNHe', 'admin'),
('Membro Carlos Pereira', 'carlos@igreja.com', '$2a$10$Ht0vQhZ9AwdZpLZxRFiEZOjxlEHsGM0Y3JI3ED6.KIL4mX9UbgNHe', 'padrao');

-- Inserção de Ministérios
INSERT INTO Ministerios (nome, descricao, idLider)
VALUES 
('Louvor', 'Ministério de música e adoração', 2),
('Infantil', 'Ministério para crianças', 4),
('Jovens', 'Ministério para jovens e adolescentes', 2),
('Recepção', 'Ministério de recepção e acolhimento', 4),
('Mídia', 'Ministério de comunicação e mídias sociais', NULL);

-- Inserção de Membros de Ministérios
INSERT INTO MembrosMinisterio (idUsuario, idMinisterio, funcao)
VALUES 
(2, 1, 'Líder'),
(3, 1, 'Guitarrista'),
(5, 1, 'Vocalista'),
(4, 2, 'Líder'),
(3, 2, 'Auxiliar'),
(2, 3, 'Líder'),
(5, 3, 'Auxiliar'),
(4, 4, 'Líder'),
(3, 4, 'Recepcionista');

-- Inserção de Escalas
INSERT INTO Escalas (idMinisterio, data, descricao)
VALUES 
(1, '2025-06-01', 'Culto de Domingo - Manhã'),
(1, '2025-06-01', 'Culto de Domingo - Noite'),
(1, '2025-06-08', 'Culto de Domingo - Manhã'),
(1, '2025-06-08', 'Culto de Domingo - Noite'),
(2, '2025-06-01', 'Escola Dominical'),
(2, '2025-06-08', 'Escola Dominical'),
(3, '2025-06-06', 'Encontro de Jovens'),
(4, '2025-06-01', 'Recepção - Culto Matutino'),
(4, '2025-06-01', 'Recepção - Culto Noturno');

-- Inserção de Conteúdos
INSERT INTO Conteudos (idMinisterio, titulo, linkArquivo, dataPublicacao)
VALUES 
(1, 'Cifras - Junho 2025', 'https://drive.google.com/file/cifras-junho-2025', '2025-05-20'),
(1, 'Escalas de Louvor - Junho 2025', 'https://drive.google.com/file/escalas-louvor-junho-2025', '2025-05-22'),
(2, 'Material Infantil - Junho 2025', 'https://drive.google.com/file/material-infantil-junho-2025', '2025-05-21'),
(3, 'Programação Jovem - Junho 2025', 'https://drive.google.com/file/programacao-jovem-junho-2025', '2025-05-23'),
(4, 'Manual de Recepção', 'https://drive.google.com/file/manual-recepcao', '2025-05-15');
