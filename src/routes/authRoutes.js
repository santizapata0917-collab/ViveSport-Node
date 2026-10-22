
const express = require('express');
const router = express.Router();

const {
    mostrarLogin,
    iniciarSesion,
    cerrarSesion,
    mostrarRegistro,
    registrarUsuario
} = require('../controllers/authController');

const { verificarSesion } = require('../middleware/auth');

router.get('/login', mostrarLogin);
router.post('/login', iniciarSesion);

router.get('/registro', mostrarRegistro);
router.post('/registro', registrarUsuario);

router.post('/logout', verificarSesion, cerrarSesion);

module.exports = router;
