type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

class Logger {
    private context: LogContext = {};

    setContext(context: LogContext) {
        this.context = { ...this.context, ...context };
    }

    clearContext() {
        this.context = {};
    }

    private log(level: LogLevel, message: string, meta?: LogContext) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...this.context,
            ...meta,
        };

        const output = JSON.stringify(logEntry);

        switch (level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            case 'debug':
                console.debug(output);
                break;
            default:
                console.log(output);
        }
    }

    debug(message: string, meta?: LogContext) {
        this.log('debug', message, meta);
    }

    info(message: string, meta?: LogContext) {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: LogContext) {
        this.log('warn', message, meta);
    }

    error(message: string, meta?: LogContext) {
        this.log('error', message, meta);
    }
}

export const logger = new Logger();
