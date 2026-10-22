
const cron = require('node-cron');
const logger = require('../config/logger');
const { crearRespaldo } = require('../services/respaldoService');

function iniciarTareasAutomaticas() {
    // Todos los días a las 2:00 a. m., hora de Colombia.
    cron.schedule('0 2 * * *', async () => {
        logger.info('Inicio de la tarea programada de respaldo');

        try {
            await crearRespaldo();
            logger.info('Tarea programada de respaldo finalizada correctamente');
        } catch (error) {
            logger.error(`Error en la tarea programada: ${error.message}`);
        }
    }, {
        timezone: 'America/Bogota',
        name: 'respaldo-diario-vivesport'
    });

    logger.info('Tarea automática configurada: respaldo diario a las 2:00 a. m.');
}

module.exports = iniciarTareasAutomaticas;
