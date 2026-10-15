
const express = require('express');
const router = express.Router();

const usuariosController = require('../controllers/usuariosController');
const { soloAdministrador } = require('../middleware/auth');

// Todas estas rutas requieren una sesión de administrador.
router.get('/', soloAdministrador, usuariosController.listar);

router.get('/nuevo', soloAdministrador, usuariosController.mostrarCrear);
router.post('/nuevo', soloAdministrador, usuariosController.crear);

router.get('/editar/:id', soloAdministrador, usuariosController.mostrarEditar);
router.post('/editar/:id', soloAdministrador, usuariosController.actualizar);

router.post('/eliminar/:id', soloAdministrador, usuariosController.eliminar);

module.exports = router;
