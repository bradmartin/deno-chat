import { SERVER_MESSAGES } from '../utils/messages.ts';
import { User } from './user.ts';
import { server, logger } from '../main.ts';

export const CommandHandlers = {
  exit: (user: User) => {
    logger.debug('User sent EXIT command.');
    // need to close the connection for the user
    user.connection.closeWrite();
  },
  help: (user: User) => {
    logger.debug('User sent HELP command.');
    // need to show all of the available commands to the USER who sent the command
    server.messageToSender(SERVER_MESSAGES.HELP, user.connection);
  },
  PM: (params: string[], user: User) => {
    logger.debug('User sent PM command');
    // be sure we have username and message to send
    if (params.length <= 1) {
      // need both username and password to send private message to user
      server.messageToSender(SERVER_MESSAGES.INVALID_WHISPER, user.connection);
    } else if (params.length >= 2) {
      const usernameToMessage = params[0];
      const msg = params.slice(1).join(' ');
      server.sendPrivateMessage(usernameToMessage, msg, user);
    }
  },
  blockUser: (params: string[], user: User) => {
    logger.info(`User sent BLOCK command`);
    // be sure we have the username param to ignore
    if (params.length <= 0) {
      server.messageToSender(SERVER_MESSAGES.INVALID_IGNORE, user.connection);
    } else if (params.length === 1) {
      const usernameToBlock = params[0];
      server.blockUser(usernameToBlock, user);
    }
  },

  login: (params: string[], user: User) => {
    logger.debug('User sent LOGIN command');
    if (params.length <= 0) {
      server.messageToSender(SERVER_MESSAGES.INVALID_LOGIN, user.connection);
    }
  },
};
