
const mongoose = require('mongoose');

async function conectarDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error(
            'No se ha configurado MONGODB_URI en el archivo .env'
        );
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB Atlas conectado correctamente');
    console.log(`Base de datos: ${mongoose.connection.name}`);
}

module.exports = conectarDB;
