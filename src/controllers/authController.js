
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

function mostrarRegistro(req, res) {
    if (req.session.usuario) {
        return res.redirect('/dashboard');
    }

    return res.render('auth/registro', {
        error: null,
        datos: {}
    });
}

async function registrarUsuario(req, res) {
    const nombre = String(req.body.nombre || '').trim();
    const apellido = String(req.body.apellido || '').trim();
    const correo = String(req.body.correo || '')
        .trim()
        .toLowerCase();
    const password = String(req.body.password || '');
    const confirmarPassword = String(
        req.body.confirmarPassword || ''
    );

    const datos = { nombre, apellido, correo };

    try {
        if (!nombre || !apellido || !correo || !password ||
            !confirmarPassword) {
            return res.status(400).render('auth/registro', {
                error: 'Todos los campos son obligatorios.',
                datos
            });
        }

        if (nombre.length > 60 || apellido.length > 60) {
            return res.status(400).render('auth/registro', {
                error: 'El nombre y el apellido admiten máximo 60 caracteres.',
                datos
            });
        }

        if (correo.length > 150 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).render('auth/registro', {
                error: 'Ingresa un correo electrónico válido.',
                datos
            });
        }

        if (password.length < 8) {
            return res.status(400).render('auth/registro', {
                error: 'La contraseña debe tener al menos 8 caracteres.',
                datos
            });
        }

        if (password !== confirmarPassword) {
            return res.status(400).render('auth/registro', {
                error: 'Las contraseñas no coinciden.',
                datos
            });
        }

        const usuarioExistente = await Usuario.findOne({ correo });

        if (usuarioExistente) {
            return res.status(409).render('auth/registro', {
                error: 'Ya existe una cuenta registrada con ese correo.',
                datos
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await Usuario.create({
            nombre,
            apellido,
            correo,
            password: passwordHash,
            rol: 'usuario',
            activo: true
        });

        return res.redirect('/login?registro=exitoso');
    } catch (error) {
        // No registrar contraseñas ni el cuerpo completo de la petición.
        console.error('Error al registrar usuario:', error.message);

        if (error.code === 11000) {
            return res.status(409).render('auth/registro', {
                error: 'Ya existe una cuenta registrada con ese correo.',
                datos
            });
        }

        return res.status(500).render('auth/registro', {
            error: 'No fue posible completar el registro. Inténtalo nuevamente.',
            datos
        });
    }
}

function mostrarLogin(req, res) {
    if (req.session.usuario) {
        return res.redirect('/dashboard');
    }

    return res.render('auth/login', {
        error: null,
        registroExitoso: req.query.registro === 'exitoso'
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
    cerrarSesion,
    mostrarRegistro,
    registrarUsuario
};
