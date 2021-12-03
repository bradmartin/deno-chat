import { SERVER_MESSAGES } from '../utils/messages.ts';
import { User } from './user.ts';
import { server, logger } from '../main.ts';

export const CommandHandlers = {
  exit: (user: User) => {
    logger.debug('User sent EXIT command.');
    // need to close the connection for the user
    user.connection.closeWrite();
  },
  info: (user: User) => {
    logger.debug('User sent INFO command.');
    // need to show all of the available commands to the USER who sent the command
    server.messageToSender(SERVER_MESSAGES.INFO, user.connection);
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

  /**
   * Will set the user name to the desired username.
   * @param params
   * @param user
   */
  login: (params: string[], user: User) => {
    logger.debug('User sent LOGIN command');
    if (params.length <= 0) {
      server.messageToSender(SERVER_MESSAGES.INVALID_LOGIN, user.connection);
    } else if (params.length === 1) {
      const requestedName = params[0];
      // see if the username is already in use
      for (let i = 0; i < server.connectedUsers.length; i++) {
        const x = server.connectedUsers[i];
        if (x.name === requestedName) {
          // username already in use, inform user
          server.messageToSender(`Username: ${requestedName} is already in use.`, user.connection);
          return;
        }
      }

      // now we can set the user and the auth flag
      user.name = params[0];
      user.isAuthenticated = true;
      console.table(user);
    }
  },

  logout: (user: User) => {
    // check if the user is authenticated first, if not no need to reset and let them know to login first
    if (user.isAuthenticated) {
      user.resetUser();
      server.messageToSender(SERVER_MESSAGES.LOGGED_OUT, user.connection);
    } else {
      server.messageToSender(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
    }
  },

  /**
   * Joins a chatroom, or creates a new chatroom if not exists.
   * @param params
   * @param user
   */
  joinChatroom: (params: string[], user: User) => {
    // be sure we have the chatroom name param to ignore
    if (params.length <= 0) {
      server.messageToSender(SERVER_MESSAGES.INVALID_CHATROOM_JOIN, user.connection);
    } else if (params.length === 1) {
      // TODO: check if user is authenticated before creating and joining chatroom
      if (user.isAuthenticated) {
        server.joinChatroom(params[0], user);
      } else {
        // let user know to login first
        server.messageToSender(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      }
    }
  },

  leaveChatroom: (params: string[], user: User) => {
    // be sure we have the chatroom name param to ignore
    if (params.length <= 0) {
      server.messageToSender(SERVER_MESSAGES.INVALID_CHATROOM_LEAVE, user.connection);
    } else if (params.length === 1) {
      server.joinChatroom(params[0], user);
    }
  },

  kickUser: async (params: string[], user: User) => {
    // be sure we have the chatroom name and username param to kick the correct user
    if (params.length <= 0) {
      server.messageToSender(SERVER_MESSAGES.INVALID_KICK, user.connection);
    } else if (params.length === 2) {
      console.log(params);
      console.log('2 length on kick params');
      // kick the user if we are admin
      // find the chatroom by name
      for await (const room of server.chatRooms) {
        if (room.name === params[1]) {
          // we have the chatroom
          // now see if the user is admin
          if (room.admin === user) {
            // we are safe to kick since the admin sent the command
            // so find the user from the param provided and remove them from the room users
            for await (const x of room.connectedUsers) {
              if (x.name === params[1]) {
                // yay we can remove it
                const i = room.connectedUsers.indexOf(x);
                room.connectedUsers.splice(i, 1);
                const msg = `User: ${x.name} kicked from chatroom: ${x.name}.`;
                logger.info(msg);
                server.messageToSender(msg, user.connection);
              }
            }
          }
        }
      }
    }
  },

  activeChatRoom: (user: User) => {
    const msg = user.activeChatRoom
      ? `Your active channel is: ${user.activeChatRoom.name}`
      : `You are not currently in a chat room.`;
    server.messageToSender(msg, user.connection);
  },

  listChatRooms: async (user: User) => {
    // get a formatted list of the chatrooms on the server instance and write them
    if (server.chatRooms.length <= 0) {
      // no chat rooms on the server yet
      server.messageToSender(SERVER_MESSAGES.NO_CHATROOMS_EXIST, user.connection);
      return;
    } else if (server.chatRooms.length >= 1) {
      let msg = '';
      for await (const room of server.chatRooms) {
        msg += `${room.name} - Users in chatroom: ${room.connectedUsers.length}\n`;
      }
      server.messageToSender(msg, user.connection);
    }
  },
};
