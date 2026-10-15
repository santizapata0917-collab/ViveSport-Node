
function verificarSesion(req, res, next) {
    if (req.session && req.session.usuario) {
        return next();
    }

    return res.redirect('/login');
}

function soloAdministrador(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/login');
    }

    if (req.session.usuario.rol !== 'admin') {
        return res.status(403).send(
            'No tienes permisos para acceder a esta sección.'
        );
    }

    next();
}

module.exports = {
    verificarSesion,
    soloAdministrador
};
