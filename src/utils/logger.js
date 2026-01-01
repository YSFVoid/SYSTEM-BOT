const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
};

const writeToFile = (level, message) => {
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `[${getTimestamp()}] [${level}] ${message}\n`;
    fs.appendFileSync(logFile, logEntry);
};

const logger = {
    info: (message, ...args) => {
        const msg = typeof message === 'object' ? JSON.stringify(message) : message;
        console.log(chalk.blue(`[${getTimestamp()}] [INFO]`), msg, ...args);
        writeToFile('INFO', `${msg} ${args.join(' ')}`);
    },

    success: (message, ...args) => {
        const msg = typeof message === 'object' ? JSON.stringify(message) : message;
        console.log(chalk.green(`[${getTimestamp()}] [SUCCESS]`), msg, ...args);
        writeToFile('SUCCESS', `${msg} ${args.join(' ')}`);
    },

    warn: (message, ...args) => {
        const msg = typeof message === 'object' ? JSON.stringify(message) : message;
        console.log(chalk.yellow(`[${getTimestamp()}] [WARN]`), msg, ...args);
        writeToFile('WARN', `${msg} ${args.join(' ')}`);
    },

    error: (message, ...args) => {
        const msg = typeof message === 'object' ? JSON.stringify(message) : message;
        console.log(chalk.red(`[${getTimestamp()}] [ERROR]`), msg, ...args);
        writeToFile('ERROR', `${msg} ${args.join(' ')}`);
    },

    debug: (message, ...args) => {
        if (process.env.NODE_ENV !== 'production') {
            const msg = typeof message === 'object' ? JSON.stringify(message) : message;
            console.log(chalk.gray(`[${getTimestamp()}] [DEBUG]`), msg, ...args);
            writeToFile('DEBUG', `${msg} ${args.join(' ')}`);
        }
    }
};

module.exports = logger;