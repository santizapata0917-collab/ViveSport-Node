
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

function mostrarLogin(req, res) {
    if (req.session.usuario) {
        return res.redirect('/dashboard');
    }

    res.render('auth/login', {
        error: null
    });
}

async function iniciarSesion(req, res) {
    try {
        const correo = String(req.body.correo || '')
            .trim()
            .toLowerCase();

        const password = String(req.body.password || '');

        if (!correo || !password) {
            return res.status(400).render('auth/login', {
                error: 'Ingresa tu correo y contraseña.'
            });
        }

        const usuario = await Usuario.findOne({
            correo,
            activo: true
        }).select('+password');

        if (!usuario) {
            return res.status(401).render('auth/login', {
                error: 'Correo o contraseña incorrectos.'
            });
        }

        const passwordValida = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordValida) {
            return res.status(401).render('auth/login', {
                error: 'Correo o contraseña incorrectos.'
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                console.error('Error al crear la sesión:', error);
                return res.status(500).render('auth/login', {
                    error: 'No fue posible iniciar sesión.'
                });
            }

            req.session.usuario = {
                id: usuario._id.toString(),
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                rol: usuario.rol
            };

            req.session.save((errorGuardar) => {
                if (errorGuardar) {
                    console.error(
                        'Error al guardar la sesión:',
                        errorGuardar
                    );

                    return res.status(500).render('auth/login', {
                        error: 'No fue posible guardar la sesión.'
                    });
                }

                return res.redirect('/dashboard');
            });
        });
    } catch (error) {
        console.error('Error en el login:', error);

        return res.status(500).render('auth/login', {
            error: 'Ocurrió un error al iniciar sesión.'
        });
    }
}

function cerrarSesion(req, res, next) {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie('vivesport.sid');
        return res.redirect('/login');
    });
}

module.exports = {
    mostrarLogin,
    iniciarSesion,
    cerrarSesion
};
