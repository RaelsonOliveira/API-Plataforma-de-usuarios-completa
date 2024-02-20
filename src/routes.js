const express = require('express')
const { cadastrarUsuario, login, detalharUsuario, atualizarUsuario, listarCategorias, listarTransacao, detalharTransacao, cadastrarTransacao, atualizarTransacao, excluirTransacao, obterExtrato } = require('./controllers/dindin')
const verificaLogin = require('./middlewares/verificalogin')

const routes = express()

routes.post('/usuario', cadastrarUsuario)
routes.post('/login', login)

routes.use(verificaLogin)
routes.get('/usuario/:id', detalharUsuario)
routes.put('/usuario', atualizarUsuario)
routes.get('/categorias', listarCategorias)
routes.get('/transacao', listarTransacao)
routes.get('/transacao/extrato', obterExtrato)
routes.get('/transacao/:id', detalharTransacao)
routes.post('/transacao', cadastrarTransacao)
routes.put('/transacao/:id', atualizarTransacao)
routes.delete('/transacao/:id', excluirTransacao)


module.exports = routes