-- Scripts de criação das tabelas (DDL)

-- Tabela de Usuários
CREATE TABLE Usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    senha NVARCHAR(255) NOT NULL,
    tipoPerfil NVARCHAR(20) NOT NULL CHECK (tipoPerfil IN ('pastor', 'admin', 'padrao'))
);

-- Tabela de Ministérios
CREATE TABLE Ministerios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(100) NOT NULL,
    descricao NVARCHAR(500) NOT NULL,
    idLider INT NULL,
    FOREIGN KEY (idLider) REFERENCES Usuarios(id)
);

-- Tabela de Membros de Ministérios
CREATE TABLE MembrosMinisterio (
    id INT IDENTITY(1,1) PRIMARY KEY,
    idUsuario INT NOT NULL,
    idMinisterio INT NOT NULL,
    funcao NVARCHAR(100) NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES Usuarios(id),
    FOREIGN KEY (idMinisterio) REFERENCES Ministerios(id),
    CONSTRAINT UC_Membro_Ministerio UNIQUE (idUsuario, idMinisterio)
);

-- Tabela de Escalas
CREATE TABLE Escalas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    idMinisterio INT NOT NULL,
    data DATE NOT NULL,
    descricao NVARCHAR(200) NOT NULL,
    FOREIGN KEY (idMinisterio) REFERENCES Ministerios(id)
);

-- Tabela de Conteúdos
CREATE TABLE Conteudos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    idMinisterio INT NOT NULL,
    titulo NVARCHAR(200) NOT NULL,
    linkArquivo NVARCHAR(500) NOT NULL,
    dataPublicacao DATE NOT NULL,
    FOREIGN KEY (idMinisterio) REFERENCES Ministerios(id)
);

-- Índices para melhorar performance
CREATE INDEX IX_Ministerios_idLider ON Ministerios(idLider);
CREATE INDEX IX_MembrosMinisterio_idUsuario ON MembrosMinisterio(idUsuario);
CREATE INDEX IX_MembrosMinisterio_idMinisterio ON MembrosMinisterio(idMinisterio);
CREATE INDEX IX_Escalas_idMinisterio ON Escalas(idMinisterio);
CREATE INDEX IX_Escalas_data ON Escalas(data);
CREATE INDEX IX_Conteudos_idMinisterio ON Conteudos(idMinisterio);
CREATE INDEX IX_Conteudos_dataPublicacao ON Conteudos(dataPublicacao);
