
const winston = require('winston');
const path = require('path');

const carpetaLogs = path.join(__dirname, '../../logs');

const formatoComun = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: formatoComun,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(carpetaLogs, 'vivesport.log')
        }),
        new winston.transports.File({
            filename: path.join(carpetaLogs, 'errores.log'),
            level: 'error'
        })
    ],
    exitOnError: false
});

module.exports = logger;
