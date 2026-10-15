require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const conectarDB = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(helmet());

app.use(express.urlencoded({
    extended: false,
    limit: '10kb'
}));

app.use(express.json({
    limit: '10kb'
}));

if (!process.env.SESSION_SECRET) {
    throw new Error('Falta configurar SESSION_SECRET en .env');
}

if (!process.env.MONGODB_URI) {
    throw new Error('Falta configurar MONGODB_URI en .env');
}

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(session({
    name: 'vivesport.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sesiones',
        ttl: 60 * 60 * 24
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(express.static(
    path.join(__dirname, 'src', 'public')
));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false
}));

// DIAGNÓSTICO TEMPORAL DE RUTAS
app.use((req, res, next) => {
    console.log('Solicitud:', req.method, req.originalUrl);
    next();
});

// RUTA PRINCIPAL: SIEMPRE REDIRIGE AL LOGIN
app.get('/', (req, res) => {
    console.log('Ejecutando redirección de / a /login');
    return res.redirect('/login');
});

// AUTENTICACIÓN
app.use('/', authRoutes);

// DASHBOARD
app.use('/', dashboardRoutes);

// CRUD DE USUARIOS
app.use('/admin/usuarios', usuariosRoutes);

// COMPROBAR CONEXIÓN
app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    const conectado = mongoose.connection.readyState === 1;

    res.status(conectado ? 200 : 503).json({
        aplicacion: 'ViveSport',
        servidor: 'Node.js + Express',
        baseDeDatos: conectado ? 'conectada' : 'desconectada'
    });
});

// RUTA 404: SIEMPRE AL FINAL DE LAS RUTAS
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// MANEJO DE ERRORES
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).send('Error interno del servidor');
});

async function iniciarServidor() {
    try {
        await conectarDB();

        app.listen(PORT, '0.0.0.0', () => {
            console.log('-----------------------------------');
            console.log('ViveSport iniciado correctamente');
            console.log(`Puerto: ${PORT}`);
            console.log(`Dirección: http://localhost:${PORT}`);
            console.log('Ruta inicial configurada: / -> /login');
            console.log('-----------------------------------');
        });
    } catch (error) {
        console.error(
            'No fue posible iniciar ViveSport:',
            error.message
        );

        process.exit(1);
    }
}

iniciarServidor();