
const express = require('express');
const router = express.Router();
const { verificarSesion } = require('../middleware/auth');

router.get('/dashboard', verificarSesion, (req, res) => {
    const usuario = req.session.usuario;

    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Panel | ViveSport</title>
            <style>
                body {
                    margin: 0;
                    padding: 40px 20px;
                    font-family: Arial, sans-serif;
                    background: #f4f6f8;
                    color: #263238;
                }
                main {
                    max-width: 700px;
                    margin: 40px auto;
                    padding: 32px;
                    background: white;
                    border-radius: 14px;
                    box-shadow: 0 8px 30px #00000012;
                }
                h1 { color: #004f3f; }
                button {
                    padding: 12px 20px;
                    color: white;
                    background: #004f3f;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }

                .enlace-usuarios {
                    display: inline-block;
                    margin: 20px 0;
                    padding: 12px 20px;
                    background-color: #004f3f;
                    color: #ffffff !important;
                    text-decoration: none !important;
                    border: none;
                    border-radius: 8px;
                    font-family: Arial, sans-serif;
                    font-size: 15px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .enlace-usuarios:hover {
                    background-color: #0a6755;
                    color: #ffffff !important;
                    text-decoration: none !important;
                }

            </style>
        </head>
        <body>
            <main>
                <h1>Bienvenido a ViveSport</h1>
                <p>Has iniciado sesión correctamente.</p>
                <p>Nombre: ${escapeHtml(usuario.nombre)}</p>
                <p>Correo: ${escapeHtml(usuario.correo)}</p>
                <p>Rol: ${escapeHtml(usuario.rol)}</p>
                ${usuario.rol === 'admin' ? `
                <a href="/admin/usuarios" class="enlace-usuarios">
        Gestionar usuarios
    </a>
` : ''}
                <form action="/logout" method="POST">
                    <button type="submit">Cerrar sesión</button>
                </form>
            </main>
        </body>
        </html>
    `);
});

function escapeHtml(valor) {
    return String(valor).replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caracter]);
}

module.exports = router;
