// import { Logger } from './src/logger.ts';
import { Server } from './src/server.ts';
export { EventEmitter } from 'https://deno.land/std@0.116.0/node/events.ts';
import * as log from 'https://deno.land/std@0.116.0/log/mod.ts';
import Ask from 'https://deno.land/x/ask@1.0.6/mod.ts';

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();
export let logger: log.Logger;
export let port: number;
export let server: Server;

async function main() {
  const ask = new Ask(); // global options are also supported! (see below)
  const answers = await ask.prompt([
    {
      name: 'port',
      type: 'number',
      message: 'Enter a valid number for the port to open Deno chat?',
    },
  ]);
  port = answers['port'] ? (answers['port'] as number) : 8080;

  logger = await setupLogger();

  server = new Server();
  logger.info(`Chat running on port: ${port}`);
}

async function setupLogger() {
  // custom configuration with 2 loggers (the default and `tasks` loggers).
  const dt = new Date();
  const fileDate = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDay()}`;

  await log.setup({
    handlers: {
      //   console: new log.handlers.ConsoleHandler('DEBUG' || 'INFO' || 'WARNING'),

      file: new log.handlers.FileHandler('WARNING' || 'INFO' || 'ERROR' || 'CRITICAL', {
        filename: `../logs/log-${fileDate}.txt`,
      }),
    },

    // loggers: {
    //   // configure default logger available via short-hand methods above.
    //   default: {
    //     level: 'DEBUG',
    //     handlers: ['console', 'file'],
    //   },

    //   tasks: {
    //     level: 'ERROR',
    //     handlers: ['console'],
    //   },
    // },
  });

  return log.getLogger();
}

main();
