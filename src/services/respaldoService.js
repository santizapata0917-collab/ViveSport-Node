
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

const carpetaRespaldos = path.join(__dirname, '../../backups');

function crearRespaldo() {
    return new Promise((resolve, reject) => {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            return reject(
                new Error('No se ha configurado MONGODB_URI')
            );
        }

        fs.mkdirSync(carpetaRespaldos, { recursive: true });

        const fecha = new Date()
            .toISOString()
            .replace(/[:.]/g, '-');

        const archivo = path.join(
            carpetaRespaldos,
            `respaldo-${fecha}.archive.gz`
        );

        logger.info('Iniciando respaldo automático de MongoDB');

        const proceso = spawn('mongodump', [
            `--uri=${uri}`,
            `--archive=${archivo}`,
            '--gzip'
        ], {
            stdio: ['ignore', 'ignore', 'pipe']
        });

        let errorProceso = '';

        proceso.stderr.on('data', (datos) => {
            errorProceso += datos.toString();
        });

        proceso.on('error', (error) => {
            logger.error(`No se pudo ejecutar mongodump: ${error.message}`);
            reject(error);
        });

        proceso.on('close', (codigo) => {
            if (codigo === 0) {
                logger.info(`Respaldo creado correctamente: ${archivo}`);
                resolve(archivo);
            } else {
                if (fs.existsSync(archivo)) {
                    fs.unlinkSync(archivo);
                }

                const mensaje =
                    `Falló el respaldo. Código: ${codigo}. ${errorProceso}`;

                logger.error(mensaje);
                reject(new Error(mensaje));
            }
        });
    });
}

module.exports = { crearRespaldo };
