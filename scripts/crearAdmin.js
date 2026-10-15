
require('dotenv').config({
    path: require('path').join(__dirname, '..', '.env')
});

const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const conectarDB = require('../src/config/database');
const Usuario = require('../src/models/Usuario');

function preguntar(rl, mensaje) {
    return new Promise((resolve) => {
        rl.question(mensaje, (respuesta) => {
            resolve(respuesta);
        });
    });
}

function preguntarSecreto(mensaje) {
    return new Promise((resolve, reject) => {
        if (!process.stdin.isTTY) {
            return reject(
                new Error('Ejecuta este script directamente en una terminal.')
            );
        }

        const stdin = process.stdin;
        let secreto = '';

        process.stdout.write(mensaje);
        stdin.resume();
        stdin.setRawMode(true);
        stdin.setEncoding('utf8');

        function restaurar() {
            stdin.setRawMode(false);
            stdin.removeListener('data', procesarEntrada);
            stdin.pause();
            process.stdout.write('\n');
        }

        function procesarEntrada(tecla) {
            if (tecla === '\u0003') {
                restaurar();
                reject(new Error('Operación cancelada.'));
                return;
            }

            if (tecla === '\r' || tecla === '\n') {
                restaurar();
                resolve(secreto);
                return;
            }

            if (tecla === '\u007f' || tecla === '\b') {
                if (secreto.length > 0) {
                    secreto = secreto.slice(0, -1);
                    process.stdout.write('\b \b');
                }
                return;
            }

            if (tecla >= ' ' && tecla !== '\u007f') {
                secreto += tecla;
                process.stdout.write('*');
            }
        }

        stdin.on('data', procesarEntrada);
    });
}

async function crearAdministrador() {
    let rl;

    try {
        await conectarDB();

        const administradorExistente = await Usuario.exists({
            rol: 'admin'
        });

        if (administradorExistente) {
            console.log(
                'Ya existe un administrador. No se creó otro.'
            );
            return;
        }

        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n=== CREAR ADMINISTRADOR DE VIVESPORT ===\n');

        const nombre = (await preguntar(
            rl,
            'Nombre: '
        )).trim();

        const apellido = (await preguntar(
            rl,
            'Apellido: '
        )).trim();

        const correo = (await preguntar(
            rl,
            'Correo electrónico: '
        )).trim().toLowerCase();

        rl.close();
        rl = null;

        if (!nombre || !apellido || !correo) {
            throw new Error('Todos los campos son obligatorios.');
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            throw new Error('El correo electrónico no es válido.');
        }

        const usuarioExistente = await Usuario.exists({ correo });

        if (usuarioExistente) {
            throw new Error(
                'Ya existe un usuario con ese correo electrónico.'
            );
        }

        const password = await preguntarSecreto(
            'Contraseña (mínimo 12 caracteres): '
        );

        const confirmacion = await preguntarSecreto(
            'Confirma la contraseña: '
        );

        if (password.length < 12) {
            throw new Error(
                'La contraseña debe tener al menos 12 caracteres.'
            );
        }

        if (password !== confirmacion) {
            throw new Error('Las contraseñas no coinciden.');
        }

        const passwordCifrada = await bcrypt.hash(password, 12);

        await Usuario.create({
            nombre,
            apellido,
            correo,
            password: passwordCifrada,
            rol: 'admin',
            activo: true
        });

        console.log('\nAdministrador creado correctamente.');
        console.log(`Correo registrado: ${correo}`);
        console.log('Ya puedes intentar iniciar sesión en ViveSport.');
    } catch (error) {
        console.error('\nNo fue posible crear el administrador:');
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        if (rl) {
            rl.close();
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

crearAdministrador();
