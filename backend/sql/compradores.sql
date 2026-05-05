CREATE TABLE IF NOT EXISTS scc_compradores (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scc_comprador_grupo (
  id BIGSERIAL PRIMARY KEY,
  codgrp CHAR(2) NOT NULL,
  comprador_id BIGINT NOT NULL REFERENCES scc_compradores(id),
  dt_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  dt_fim DATE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_scc_comprador_grupo_ativo
ON scc_comprador_grupo(codgrp)
WHERE dt_fim IS NULL;

CREATE TABLE IF NOT EXISTS scc_metas_compradores (
  id BIGSERIAL PRIMARY KEY,
  comprador_id BIGINT NOT NULL REFERENCES scc_compradores(id),
  codgrp CHAR(2) NOT NULL,
  ano INT NOT NULL,
  mes INT NOT NULL,
  meta_vendas NUMERIC(15,2) DEFAULT 0,
  meta_lb NUMERIC(15,2) DEFAULT 0,
  meta_evolucao NUMERIC(8,2) DEFAULT 0,
  meta_nivel_servico NUMERIC(8,2) DEFAULT 0,
  meta_dias_estoque NUMERIC(8,2) DEFAULT 0,
  meta_produtos_fora NUMERIC(8,2) DEFAULT 0,
  UNIQUE (comprador_id, codgrp, ano, mes)
);

CREATE OR REPLACE VIEW vs_scc_dgrupos AS
SELECT
    a.c_grp AS codgrp,
    a.c_grp::text || a.c_subgrp::text AS codgrupo,
    a.c_nomgrp AS grupo,
    a.c_nomsubgr AS subgrupo,
    c.nome AS comprador
FROM a_classi a
LEFT JOIN scc_comprador_grupo cg
    ON cg.codgrp = a.c_grp
    AND cg.dt_fim IS NULL
LEFT JOIN scc_compradores c
    ON c.id = cg.comprador_id;
