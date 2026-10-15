
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

const usuariosController = {
    // LISTAR USUARIOS
    async listar(req, res) {
        try {
            const usuarios = await Usuario.find()
                .select('-password')
                .sort({ createdAt: -1 })
                .lean();

            res.render('usuarios/index', {
                usuarios,
                mensaje: req.query.mensaje || '',
                tipo: req.query.tipo || 'exito',
                usuarioActual: req.session.usuario
            });
        } catch (error) {
            console.error('Error al listar usuarios:', error.message);
            res.status(500).send('No fue posible cargar los usuarios.');
        }
    },

    // MOSTRAR FORMULARIO DE CREACIÓN
    mostrarCrear(req, res) {
        res.render('usuarios/nuevo', {
            error: null,
            datos: {}
        });
    },

    // CREAR USUARIO
    async crear(req, res) {
        try {
            const nombre = (req.body.nombre || '').trim();
            const apellido = (req.body.apellido || '').trim();
            const correo = (req.body.correo || '').trim().toLowerCase();
            const password = req.body.password || '';

            if (!nombre || !apellido || !correo || !password) {
                return res.status(400).render('usuarios/nuevo', {
                    error: 'Todos los campos son obligatorios.',
                    datos: { nombre, apellido, correo }
                });
            }

            if (nombre.length > 60 || apellido.length > 60) {
                return res.status(400).render('usuarios/nuevo', {
                    error: 'El nombre y el apellido deben tener máximo 60 caracteres.',
                    datos: { nombre, apellido, correo }
                });
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                return res.status(400).render('usuarios/nuevo', {
                    error: 'Ingresa un correo electrónico válido.',
                    datos: { nombre, apellido, correo }
                });
            }

            if (password.length < 8) {
                return res.status(400).render('usuarios/nuevo', {
                    error: 'La contraseña debe tener al menos 8 caracteres.',
                    datos: { nombre, apellido, correo }
                });
            }

            const existe = await Usuario.findOne({ correo });

            if (existe) {
                return res.status(400).render('usuarios/nuevo', {
                    error: 'Ya existe un usuario registrado con ese correo.',
                    datos: { nombre, apellido, correo }
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

            return res.redirect(
                '/admin/usuarios?mensaje=Usuario+creado+correctamente&tipo=exito'
            );
        } catch (error) {
            console.error('Error al crear usuario:', error.message);

            if (error.code === 11000) {
                return res.status(400).render('usuarios/nuevo', {
                    error: 'Ese correo electrónico ya está registrado.',
                    datos: req.body
                });
            }

            return res.status(500).render('usuarios/nuevo', {
                error: 'Ocurrió un error al registrar el usuario.',
                datos: req.body
            });
        }
    },

    // MOSTRAR FORMULARIO DE EDICIÓN
    async mostrarEditar(req, res) {
        try {
            const usuario = await Usuario.findById(req.params.id)
                .select('-password')
                .lean();

            if (!usuario) {
                return res.status(404).send('Usuario no encontrado.');
            }

            if (usuario.rol === 'admin') {
                return res.status(403).send(
                    'No está permitido editar cuentas de administrador desde este módulo.'
                );
            }

            res.render('usuarios/editar', {
                usuario,
                error: null
            });
        } catch (error) {
            console.error('Error al consultar usuario:', error.message);
            res.status(400).send('El identificador del usuario no es válido.');
        }
    },

    // ACTUALIZAR USUARIO
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const nombre = (req.body.nombre || '').trim();
            const apellido = (req.body.apellido || '').trim();
            const correo = (req.body.correo || '').trim().toLowerCase();

            const usuario = await Usuario.findById(id);

            if (!usuario) {
                return res.status(404).send('Usuario no encontrado.');
            }

            if (usuario.rol === 'admin') {
                return res.status(403).send(
                    'No está permitido editar cuentas de administrador desde este módulo.'
                );
            }

            if (!nombre || !apellido || !correo) {
                return res.status(400).render('usuarios/editar', {
                    usuario: { ...usuario.toObject(), nombre, apellido, correo },
                    error: 'Todos los campos son obligatorios.'
                });
            }

            if (
                nombre.length > 60 ||
                apellido.length > 60 ||
                correo.length > 150 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
            ) {
                return res.status(400).render('usuarios/editar', {
                    usuario: { ...usuario.toObject(), nombre, apellido, correo },
                    error: 'Verifica el nombre, apellido y correo electrónico.'
                });
            }

            const correoRepetido = await Usuario.findOne({
                correo,
                _id: { $ne: id }
            });

            if (correoRepetido) {
                return res.status(400).render('usuarios/editar', {
                    usuario: { ...usuario.toObject(), nombre, apellido, correo },
                    error: 'Otro usuario ya tiene ese correo electrónico.'
                });
            }

            usuario.nombre = nombre;
            usuario.apellido = apellido;
            usuario.correo = correo;

            await usuario.save();

            return res.redirect(
                '/admin/usuarios?mensaje=Usuario+actualizado+correctamente&tipo=exito'
            );
        } catch (error) {
            console.error('Error al actualizar usuario:', error.message);
            res.status(500).send('No fue posible actualizar el usuario.');
        }
    },

    // ELIMINAR USUARIO
    async eliminar(req, res) {
        try {
            const usuario = await Usuario.findById(req.params.id);

            if (!usuario) {
                return res.redirect(
                    '/admin/usuarios?mensaje=Usuario+no+encontrado&tipo=error'
                );
            }

            if (usuario.rol === 'admin') {
                return res.status(403).send(
                    'No está permitido eliminar cuentas de administrador desde este módulo.'
                );
            }

            if (usuario._id.toString() === req.session.usuario.id) {
                return res.status(403).send(
                    'No puedes eliminar tu propia cuenta desde este módulo.'
                );
            }

            await Usuario.findByIdAndDelete(usuario._id);

            return res.redirect(
                '/admin/usuarios?mensaje=Usuario+eliminado+correctamente&tipo=exito'
            );
        } catch (error) {
            console.error('Error al eliminar usuario:', error.message);
            res.status(500).send('No fue posible eliminar el usuario.');
        }
    }
};

module.exports = usuariosController;
