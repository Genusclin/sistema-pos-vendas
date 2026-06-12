const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Caminho dos arquivos
const DATA_FILE = path.join(__dirname, 'data', 'respostas.json');
const USERS_FILE = path.join(__dirname, 'data', 'usuarios.json');
const POSVENDA_FILE = path.join(__dirname, 'data', 'posvendas.json');

// Criar pasta data se não existir
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Criar arquivo de respostas se não existir
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Criar arquivo de pós venda se não existir
if (!fs.existsSync(POSVENDA_FILE)) {
    fs.writeFileSync(POSVENDA_FILE, JSON.stringify([]));
}

// USUÁRIOS PADRÃO
let USERS = {
    'admin': { senha: 'admin123', role: 'admin', nome: 'Administrador' }
};

// Carregar usuários salvos se existir
if (fs.existsSync(USERS_FILE)) {
    try {
        const savedUsers = JSON.parse(fs.readFileSync(USERS_FILE));
        USERS = { ...USERS, ...savedUsers };
    } catch (e) {
        console.log('Erro ao carregar usuários:', e);
    }
}

// Função para salvar usuários
function salvarUsuarios() {
    const usuariosParaSalvar = {};
    for (let key in USERS) {
        if (key !== 'admin') {
            usuariosParaSalvar[key] = USERS[key];
        }
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(usuariosParaSalvar, null, 2));
}

// ==================== ROTAS DE LOGIN ====================
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = USERS[username];
    
    console.log(`Tentativa de login: ${username}`);
    
    if (user && user.senha === password) {
        console.log(`Login bem sucedido: ${username} (${user.role})`);
        res.json({ success: true, role: user.role, nome: user.nome });
    } else {
        console.log(`Login falhou: ${username}`);
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
    }
});

// ==================== ROTAS DE RESPOSTAS ====================
app.post('/salvar-resposta', (req, res) => {
    try {
        const resposta = req.body;
        const dados = JSON.parse(fs.readFileSync(DATA_FILE));
        resposta.dataHora = new Date().toLocaleString('pt-BR');
        dados.push(resposta);
        fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
        res.json({ success: true, message: 'Resposta salva com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar resposta:', error);
        res.status(500).json({ success: false, message: 'Erro ao salvar' });
    }
});

app.get('/buscar-respostas', (req, res) => {
    try {
        const dados = JSON.parse(fs.readFileSync(DATA_FILE));
        res.json(dados);
    } catch (error) {
        console.error('Erro ao buscar respostas:', error);
        res.json([]);
    }
});

app.post('/salvar-todos-dados', (req, res) => {
    try {
        const { dados } = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
        res.json({ success: true, message: 'Dados salvos com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        res.status(500).json({ success: false, message: 'Erro ao salvar' });
    }
});

// ==================== ROTAS DE PÓS VENDA ====================

// Buscar todos os registros
app.get('/buscar-pos-vendas', (req, res) => {
    try {
        if (fs.existsSync(POSVENDA_FILE)) {
            const dados = JSON.parse(fs.readFileSync(POSVENDA_FILE));
            console.log(`Buscando pós vendas: ${dados.length} registros encontrados`);
            res.json(dados);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Erro ao buscar pós vendas:', error);
        res.json([]);
    }
});

// Adicionar novo registro
app.post('/adicionar-pos-venda', (req, res) => {
    try {
        const { registro } = req.body;
        let dados = [];
        
        if (fs.existsSync(POSVENDA_FILE)) {
            dados = JSON.parse(fs.readFileSync(POSVENDA_FILE));
        }
        
        dados.push(registro);
        fs.writeFileSync(POSVENDA_FILE, JSON.stringify(dados, null, 2));
        
        console.log(`✅ Registro adicionado: ${registro.razaoSocial || 'sem nome'}`);
        console.log(`Total de registros: ${dados.length}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao adicionar pós venda:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Salvar registro editado
app.post('/salvar-pos-venda', (req, res) => {
    try {
        const { registro, index } = req.body;
        let dados = [];
        
        if (fs.existsSync(POSVENDA_FILE)) {
            dados = JSON.parse(fs.readFileSync(POSVENDA_FILE));
        }
        
        if (index >= 0 && index < dados.length) {
            dados[index] = registro;
            fs.writeFileSync(POSVENDA_FILE, JSON.stringify(dados, null, 2));
            console.log(`✅ Registro salvo (index ${index}): ${registro.razaoSocial}`);
            res.json({ success: true });
        } else {
            dados.push(registro);
            fs.writeFileSync(POSVENDA_FILE, JSON.stringify(dados, null, 2));
            console.log(`✅ Novo registro salvo: ${registro.razaoSocial}`);
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Erro ao salvar pós venda:', error);
        res.status(500).json({ success: false });
    }
});

// Excluir registro
app.post('/excluir-pos-venda', (req, res) => {
    try {
        const { index } = req.body;
        let dados = [];
        
        if (fs.existsSync(POSVENDA_FILE)) {
            dados = JSON.parse(fs.readFileSync(POSVENDA_FILE));
        }
        
        if (index >= 0 && index < dados.length) {
            const removido = dados[index];
            dados.splice(index, 1);
            fs.writeFileSync(POSVENDA_FILE, JSON.stringify(dados, null, 2));
            console.log(`✅ Registro excluído: ${removido.razaoSocial}`);
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Índice inválido' });
        }
    } catch (error) {
        console.error('Erro ao excluir pós venda:', error);
        res.status(500).json({ success: false });
    }
});

// ==================== ROTAS DE USUÁRIOS ====================
app.get('/buscar-usuarios', (req, res) => {
    try {
        const usuariosLista = Object.entries(USERS).map(([key, value]) => ({
            usuario: key,
            nome: value.nome,
            senha: value.senha,
            tipo: value.role
        }));
        res.json(usuariosLista);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.json([]);
    }
});

app.post('/adicionar-usuario', (req, res) => {
    try {
        const { usuario, nome, senha, tipo } = req.body;
        
        console.log('Tentando adicionar usuário:', usuario);
        
        if (!usuario || !nome || !senha) {
            res.json({ success: false, message: 'Preencha todos os campos!' });
            return;
        }
        
        if (USERS[usuario]) {
            res.json({ success: false, message: 'Usuário já existe!' });
            return;
        }
        
        USERS[usuario] = { senha, role: tipo, nome };
        salvarUsuarios();
        
        console.log('✅ Usuário adicionado com sucesso:', usuario);
        res.json({ success: true, message: 'Usuário adicionado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

app.post('/alterar-senha', (req, res) => {
    try {
        const { usuario, novaSenha } = req.body;
        
        if (!USERS[usuario]) {
            res.json({ success: false, message: 'Usuário não encontrado' });
            return;
        }
        
        USERS[usuario].senha = novaSenha;
        salvarUsuarios();
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ success: false });
    }
});

app.post('/excluir-usuario', (req, res) => {
    try {
        const { usuario } = req.body;
        
        if (usuario === 'admin') {
            res.json({ success: false, message: 'Não é possível excluir o admin principal' });
            return;
        }
        
        if (USERS[usuario]) {
            delete USERS[usuario];
            salvarUsuarios();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ success: false });
    }
});

// ==================== INICIAR SERVIDOR ====================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`\n📋 USUÁRIOS DISPONÍVEIS:`);
    Object.keys(USERS).forEach(user => {
        console.log(`   - ${user} (${USERS[user].role}) - Senha: ${USERS[user].senha}`);
    });
    console.log(`\n📁 ARQUIVOS DE DADOS:`);
    console.log(`   - Respostas: ${DATA_FILE}`);
    console.log(`   - Pós Vendas: ${POSVENDA_FILE}`);
    console.log(`   - Usuários: ${USERS_FILE}`);
    console.log(`\n========================================\n`);
});