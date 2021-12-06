import { Server } from './src/server.ts';
export { EventEmitter } from 'https://deno.land/std@0.116.0/node/events.ts';
import * as log from 'https://deno.land/std@0.116.0/log/mod.ts';

export const logger = await setupLogger();

// Default port is 8080. Pass the `-p <value>` argument to `deno run` to set the port to listen on.
export let { port } = { port: 8080 };

if (Deno.args.length >= 2) {
  if (Deno.args[0] === '-p') {
    port = parseInt(Deno.args[1]);
  }
}

export const server = new Server();
logger.info(`Chat running on port: ${port}`);

async function setupLogger() {
  // custom configuration with 2 loggers (the default and `tasks` loggers).
  const dt = new Date();
  const fileDate = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDay()}`;

  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler('DEBUG'),

      file: new log.handlers.FileHandler('INFO', {
        filename: `./logs/log-${fileDate}.txt`,
        // you can change format of output message using any keys in `LogRecord`.
        formatter: '{levelName} {msg}',
      }),
    },

    loggers: {
      // configure default logger available via short-hand methods above
      default: {
        level: 'DEBUG' || 'INFO' || 'ERROR' || 'CRITICAL',
        handlers: ['console', 'file'],
      },
    },
  });

  return log.getLogger();
}
