const pool = require('../connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const senhaJwt = require('../middlewares/senhaJwt')

const cadastrarUsuario = async (req, res) => {
   
     try {
        const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(403).json({mensagem: 'Todos os campos são obrigatórios'})
    }
        const emailExiste = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])

        if(emailExiste.rowCount > 0){
            return res.status(400).json({mensagem: 'Email já existe'})
        }

         const senhaProtegida = await bcrypt.hash(senha, 10)

        const query = `
            INSERT INTO usuarios (nome, email, senha)
            VALUES ($1, $2, $3) RETURNING *
        `

        const {rows} = await pool.query(query, [nome, email, senhaProtegida])

        const {senha: _, ...usuario} = rows[0]

        return res.status(201).json(usuario)
    } catch (error) {
        return res.status(500).json({mensagem: 'Erro interno do servidor'})
    }


};

const login = async (req, res) => {
    const { email, senha} = req.body;
    if (!email || !senha) {
        return res.status(404).json({mensagem: 'Os campos email e senha são obrigatórios'})
    }

    try {
        const { rows, rowCount } = await pool.query(
            `SELECT * FROM usuarios WHERE email = $1`,[email]
        )
        if (rowCount === 0) {
            return res.status(400).json({mensagem: 'Email ou senha inválida'})
        }
        const {senha: senhaUsuario, ...usuario} = rows[0]

        const senhaCorreta = await bcrypt.compare(senha, senhaUsuario)

        if (!senhaCorreta) {
            return res.status(400).json({mensagem: 'Email ou senha inválida'})
        }

        const token = jwt.sign({id: usuario.id}, senhaJwt, { expiresIn: '2h'})

        return res.json({
            usuario,
            token
        })
        
    } catch (error) {
        return res.status(500).json({mensagem: 'Erro interno do servidor'})
    }
}

const detalharUsuario = async (req, res) => {
    const { id } = req.params

	try {
		const { rows, rowCount } = await pool.query(
			'SELECT  id, nome, email FROM usuarios WHERE id = $1',
			[id]
		)

		if (rowCount === 0) {
            console.log(rowCount)
			return res.status(404).json({ mensagem: 'Usuário não existe' })
		}

		const usuario = rows[0]

		return res.json(usuario)
	} catch (error) {
		return res.status(500).json({ mensagem: 'Erro interno do servidor' })
	}
}

const atualizarUsuario = async (req, res) => {
    const { id } = req.usuario
    const { nome, email, senha} = req.body;
    if (!nome || !email || !senha) {
        return res.status(404).json({mensagem: 'Todos os campos são obrigatórios'})
    }

    try {
        const emailExiste = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        console.log(emailExiste.rows[0])

        if (emailExiste.rowCount > 0 && emailExiste.rows[0].id !== id) {
            return res.status(404).json({mensagem: 'Esse email já está cadastrado'})
        }
        const queryAtualizarUsuario = `
        UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4 RETURNING *
        `
        const senhaProtegida = await bcrypt.hash(senha, 10)

        const {rows} = await pool.query(queryAtualizarUsuario, [nome, email, senhaProtegida, id])
        console.log(rows)

        const {senha: _, ...usuario} = rows[0]
        
        return res.status(201).json(usuario)
    } catch (error) {
        return res.status(500).json({mensagem: 'Erro interno do servidor'})
    }
}

const listarCategorias = async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM categorias WHERE id = $1', [id]);
        const categorias = resultado.rows[0];
        console.log(categorias)
        res.status(204).json(categorias);
      } catch (error) {
        res.status(500).json({ mensagem: 'Erro interno do servidor' });
      }
}

const listarTransacao = async (req, res) => {
    const {id} = req.usuario
    try {
        const resultado = await pool.query('SELECT * FROM transacoes WHERE usuario_id = $1', [id]);
        res.status(200).json(resultado.rows)
    } catch (error) {
        res.status(500).json({mensagem: 'Erro interno do servidor'})
    }
}

const detalharTransacao = async (req, res) => {

    try {
        const id = req.params.id
        if (!id) {
           return res.status(400).json({mensagem: 'Insira o id do usuário'})
        }
        const resultado = await pool.query('SELECT * FROM transacoes WHERE id = $1', [id])
        res.status(200).json(resultado.rows)

    } catch (error) {
        res.status(500).json({mensagem: 'Erro interno do servidor'})
    }
}

const cadastrarTransacao = async (req, res) => {
    try {
        const { descricao, valor, data, categoria_id, tipo } = req.body
        const { id } = req.usuario
        if (!descricao || !valor || !data || !categoria_id || !tipo) {
             return res.status(404).json({mensagem: 'Todos os campos obrigatórios devem ser informados.'})
        }
        if (tipo !== 'entrada' && tipo !== 'saida' ) {
            return res.status(404).json({mensagem: 'Tipo precisa ser entrada ou saida'})
        }
        const categoriaExiste = await pool.query('SELECT * FROM categorias WHERE id = $1',[categoria_id])
        if (categoriaExiste.rowCount === 0) {
            return res.status(404).json({mensagem: 'A categoria informada não existe'})
        }

        const query = 'INSERT INTO transacoes (descricao, valor, data, categoria_id, tipo, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
        const resultado = await pool.query(query,[descricao, valor, data, categoria_id, tipo, id])

        return res.status(200).json(resultado.rows[0])
    } catch (error) {
        console.log(error)
        res.status(500).json({mensagem: 'Erro interno do servidor'})
    }

}

const atualizarTransacao = async (req, res) => {
    try {
        const { id } = req.usuario
        const {descricao, valor, data, categoria_id, tipo} = req.body

        if (!descricao || !valor || !data || !categoria_id || !tipo) {
            res.status(404).json({mensagem: 'Todos os campos obrigatórios devem ser informados.'})
        }
        if (tipo !== 'entrada' && tipo !== 'saida' ) {
            return res.status(404).json({mensagem: 'Tipo precisa ser entrada ou saida'})
        }

        const categoriaExiste = await pool.query('SELECT * FROM categorias WHERE id = $1',[categoria_id])
        if (categoriaExiste.rowCount === 0) {
            return res.status(404).json({mensagem: 'A categoria informada não existe'})
        }

        const queryAtualizarTransacao = 'UPDATE transacoes SET descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 WHERE id = $6'    
        const resultado = await pool.query(queryAtualizarTransacao,[descricao, valor, data, categoria_id, tipo, id])
        
        return res.status(200).json(resultado.rows[0])
    } catch (error) {
        res.status(500).json({mensagem: 'Erro interno do servidor'})
    }
}

const excluirTransacao = async (req, res) => {
    try {
        const { id } = req.params
        
        
      const transacaoExiste = await pool.query('SELECT * FROM transacoes WHERE id = $1',[id])
      if (transacaoExiste.rowCount === 0) {
        return res.status(404).json({mensagem: 'Essa transação não existe para esse usuário'})
      }

      await pool.query('DELETE FROM transacoes WHERE id = $1',[id])

      return res.status(200).send()
    } catch (error) {
       return res.status(500).json({mensagem: 'Erro interno do servidor'})
    }
}

const obterExtrato = async (req, res) => {
    try {
        const { id } = req.usuario.id

       const entrada = await pool.query(`SELECT COALESCE(SUM(valor), 0) AS entrada FROM transacoes WHERE usuario_id = $1 AND tipo = 'entrada'`, [id]);
       const saida = await pool.query(`SELECT COALESCE(SUM(valor), 0) AS entrada FROM transacoes WHERE usuario_id = $1 AND tipo = 'saida'`, [id])
       res.status(200).json({
        entrada: entrada.rows[0].entrada,
        saida: saida.rows[0].saida
       })


    } catch (error) {
        return res.status(500).json({mensagem: 'Erro interno do servior'})
    }

}
module.exports = {
    cadastrarUsuario,
    login,
    detalharUsuario,
    atualizarUsuario,
    listarCategorias,
    listarTransacao,
    detalharTransacao,
    cadastrarTransacao,
    atualizarTransacao,
    excluirTransacao,
    obterExtrato
}
