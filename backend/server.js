const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONEXÃO COM POSTGRESQL (Render)
const pool = new Pool({
    connectionString: 'postgresql://henrique:X54Ykj0yrnqOrRMENHtRWrOqP1BFyhBe@dpg-d8o67f0g4nts73d1gjl0-a/posvendas',
    ssl: { rejectUnauthorized: false }
});

// Criar tabelas se não existirem
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS respostas (
                id SERIAL PRIMARY KEY,
                data_hora TEXT,
                vendedor TEXT,
                cnpj TEXT,
                empresa TEXT,
                responsavel TEXT,
                telefone TEXT,
                pergunta1 TEXT,
                pergunta2 TEXT,
                pergunta3 TEXT,
                pergunta4 TEXT,
                pergunta5 TEXT,
                pergunta6 TEXT,
                pergunta7 TEXT,
                pergunta8 TEXT,
                pergunta9 TEXT,
                nota_visita TEXT,
                vendedor_nome TEXT,
                vendido TEXT,
                observacoes TEXT
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pos_vendas (
                id SERIAL PRIMARY KEY,
                consultor TEXT,
                razao_social TEXT,
                cnpj TEXT,
                cidade TEXT,
                telefone TEXT,
                responsavel TEXT,
                contabilidade TEXT,
                data_entregue TEXT,
                retorno TEXT,
                observacao TEXT
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                nome TEXT,
                senha TEXT,
                tipo TEXT
            )
        `);
        
        await pool.query(`
            INSERT INTO usuarios (username, nome, senha, tipo)
            VALUES 
                ('admin', 'Administrador', 'admin123', 'admin'),
                ('henrique', 'Henrique Master', '30072021', 'admin'),
                ('andressa', 'Andressa', '123', 'pos')
            ON CONFLICT (username) DO NOTHING
        `);
        
        console.log('✅ Banco de dados inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar banco:', error);
    }
}

initDatabase();

// ==================== ROTAS DE LOGIN ====================
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1 AND senha = $2',
            [username.toLowerCase(), password]
        );
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ success: true, role: user.tipo, nome: user.nome });
        } else {
            res.status(401).json({ success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// ==================== ROTAS DE RESPOSTAS ====================
app.post('/salvar-resposta', async (req, res) => {
    try {
        const resposta = req.body;
        await pool.query(`
            INSERT INTO respostas (
                data_hora, vendedor, cnpj, empresa, responsavel, telefone,
                pergunta1, pergunta2, pergunta3, pergunta4, pergunta5,
                pergunta6, pergunta7, pergunta8, pergunta9, nota_visita,
                vendedor_nome, vendido, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
            new Date().toLocaleString('pt-BR'), resposta.vendedor, resposta.cnpj,
            resposta.empresa, resposta.responsavel, resposta.telefone,
            resposta.pergunta1, resposta.pergunta2, resposta.pergunta3,
            resposta.pergunta4, resposta.pergunta5, resposta.pergunta6,
            resposta.pergunta7, resposta.pergunta8, resposta.pergunta9,
            resposta.notaVisita, resposta.vendedorNome, resposta.vendido,
            resposta.observacoes
        ]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

app.get('/buscar-respostas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM respostas ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.json([]);
    }
});

app.post('/salvar-todos-dados', async (req, res) => {
    try {
        const { dados } = req.body;
        await pool.query('DELETE FROM respostas');
        for (const d of dados) {
            await pool.query(`
                INSERT INTO respostas (
                    data_hora, vendedor, cnpj, empresa, responsavel, telefone,
                    pergunta1, pergunta2, pergunta3, pergunta4, pergunta5,
                    pergunta6, pergunta7, pergunta8, pergunta9, nota_visita,
                    vendedor_nome, vendido, observacoes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            `, [d.data_hora, d.vendedor, d.cnpj, d.empresa, d.responsavel, d.telefone,
                d.pergunta1, d.pergunta2, d.pergunta3, d.pergunta4, d.pergunta5,
                d.pergunta6, d.pergunta7, d.pergunta8, d.pergunta9, d.nota_visita,
                d.vendedor_nome, d.vendido, d.observacoes]);
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// ==================== ROTAS DE PÓS VENDAS ====================
app.get('/buscar-pos-vendas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pos_vendas ORDER BY id DESC');
        console.log('📊 Registros retornados:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.json([]);
    }
});

app.post('/adicionar-pos-venda', async (req, res) => {
    try {
        const { registro } = req.body;
        const result = await pool.query(`
            INSERT INTO pos_vendas (
                consultor, razao_social, cnpj, cidade, telefone, responsavel,
                contabilidade, data_entregue, retorno, observacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [registro.consultor, registro.razaoSocial, registro.cnpj, registro.cidade,
            registro.telefone, registro.responsavel, registro.contabilidade,
            registro.dataEntregue, registro.retorno, registro.observacao]);
        console.log('✅ Registro adicionado com ID:', result.rows[0].id);
        res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// ROTA SALVAR POS VENDA - CORRIGIDA
app.post('/salvar-pos-venda', async (req, res) => {
    try {
        const { registro, index } = req.body;
        console.log('📝 ===== RECEBENDO EDIÇÃO =====');
        console.log('📝 Registro recebido:', JSON.stringify(registro, null, 2));
        console.log('📝 ID recebido:', registro.id);
        console.log('📝 Index recebido:', index);
        
        if (!registro.id) {
            console.log('❌ ERRO: ID não enviado!');
            return res.status(400).json({ success: false, message: 'ID não enviado' });
        }
        
        // ATUALIZA PELO ID
        const updateResult = await pool.query(`
            UPDATE pos_vendas SET
                consultor = $1, 
                razao_social = $2, 
                cnpj = $3, 
                cidade = $4,
                telefone = $5, 
                responsavel = $6, 
                contabilidade = $7,
                data_entregue = $8, 
                retorno = $9, 
                observacao = $10
            WHERE id = $11
            RETURNING id, consultor, cidade, razao_social
        `, [
            registro.consultor, 
            registro.razaoSocial, 
            registro.cnpj, 
            registro.cidade,
            registro.telefone, 
            registro.responsavel, 
            registro.contabilidade,
            registro.dataEntregue, 
            registro.retorno, 
            registro.observacao, 
            registro.id
        ]);
        
        console.log('📊 Resultado do UPDATE:', updateResult.rows);
        console.log('📊 Linhas afetadas:', updateResult.rowCount);
        
        if (updateResult.rowCount > 0) {
            console.log('✅ Registro ATUALIZADO com sucesso! ID:', registro.id);
            console.log('📌 Novos valores:', updateResult.rows[0]);
            res.json({ success: true, updated: updateResult.rows[0] });
        } else {
            console.log('❌ Nenhum registro encontrado com ID:', registro.id);
            res.status(404).json({ success: false, message: 'Registro não encontrado' });
        }
    } catch (error) {
        console.error('❌ Erro ao salvar pós venda:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/excluir-pos-venda', async (req, res) => {
    try {
        const { index } = req.body;
        const result = await pool.query('SELECT id FROM pos_vendas ORDER BY id LIMIT 1 OFFSET $1', [index]);
        if (result.rows.length > 0) {
            await pool.query('DELETE FROM pos_vendas WHERE id = $1', [result.rows[0].id]);
            console.log('✅ Registro excluído, ID:', result.rows[0].id);
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// ==================== ROTAS DE USUÁRIOS ====================
app.get('/buscar-usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT username as usuario, nome, senha, tipo FROM usuarios');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.json([]);
    }
});

app.post('/adicionar-usuario', async (req, res) => {
    try {
        const { usuario, nome, senha, tipo } = req.body;
        await pool.query(
            'INSERT INTO usuarios (username, nome, senha, tipo) VALUES ($1, $2, $3, $4)',
            [usuario.toLowerCase(), nome, senha, tipo]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

app.post('/alterar-senha', async (req, res) => {
    try {
        const { usuario, novaSenha } = req.body;
        await pool.query('UPDATE usuarios SET senha = $1 WHERE username = $2', [novaSenha, usuario.toLowerCase()]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

app.post('/excluir-usuario', async (req, res) => {
    try {
        const { usuario } = req.body;
        if (usuario === 'admin' || usuario === 'henrique') {
            return res.json({ success: false, message: 'Não pode excluir este usuário' });
        }
        await pool.query('DELETE FROM usuarios WHERE username = $1', [usuario.toLowerCase()]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`✅ Banco de dados PostgreSQL conectado`);
});