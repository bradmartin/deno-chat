import { SERVER_MESSAGES } from '../utils/messages.ts';
import { User } from './user.ts';
import { server, logger } from '../main.ts';

export class CommandHandlers {
  static exit(user: User) {
    // need to close the connection for the user
    user.connection.closeWrite();
  }
  static info(user: User) {
    // need to show all of the available commands to the USER who sent the command
    server.messageToSender(SERVER_MESSAGES.INFO, user.connection);
  }

  static PM(params: string[], user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // be sure we have username and message to send
    if (params.length <= 1) {
      // need both username and password to send private message to user
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_WHISPER, user.connection);
    } else if (params.length >= 2) {
      const usernameToMessage = params[0];
      const msg = params.slice(1).join(' ');
      server.sendPrivateMessage(usernameToMessage, msg, user);
    }
  }

  static blockUser(params: string[], user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // be sure we have the username param to ignore
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_IGNORE, user.connection);
    } else if (params.length === 1) {
      const usernameToBlock = params[0];
      server.blockUser(usernameToBlock, user);
    }
  }

  /**
   * Will set the user name to the desired username.
   * @param params
   * @param user
   */
  static login(params: string[], user: User) {
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_LOGIN, user.connection);
    } else if (params.length === 1) {
      const requestedName = params[0];
      // see if the username is already in use
      for (let i = 0; i < server.connectedUsers.length; i++) {
        const x = server.connectedUsers[i];
        if (x.name === requestedName) {
          // username already in use, inform user
          server.systemMessageToUser(`Username: ${requestedName} is already in use.`, user.connection);
          return;
        }
      }

      // now we can set the user and the auth flag
      user.name = params[0];
      user.isAuthenticated = true;
      logger.info(`User: ${user.name} logged in.`);
      server.systemMessageToUser(SERVER_MESSAGES.LOGGED_IN, user.connection);
    }
  }

  static logout(user: User) {
    // check if the user is authenticated first, if not no need to reset and let them know to login first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    } else {
      user.resetUser();
      server.systemMessageToUser(SERVER_MESSAGES.LOGGED_OUT, user.connection);
    }
  }

  /**
   * Joins a chatroom, or creates a new chatroom if not exists.
   * @param params
   * @param user
   */
  static joinChatroom(params: string[], user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // user is auth'd so be sure we have chatroom name
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_CHATROOM_JOIN, user.connection);
    } else if (params.length === 1) {
      server.joinChatroom(params[0], user);
    }
  }

  static leaveChatroom(params: string[], user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // be sure we have the chatroom name param to leave
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_CHATROOM_LEAVE, user.connection);
    } else if (params.length === 1) {
      // be sure user is in a chatroom first
      const roomName = params[1];
      logger.debug(`User request to leave room: ${roomName}`);
      // check if the user is in that chatroom
      if (user.activeChatRoom?.name === roomName) {
        // user is in this chatroom now so we can leave
        const userIndex = user.activeChatRoom?.connectedUsers.findIndex((x) => x.id === user.id);
        user.activeChatRoom?.connectedUsers.splice(userIndex, 1);
        user.activeChatRoom = undefined;
        server.systemMessageToUser(`You have left chatroom: ${roomName}.`, user.connection);
      }
    }
  }

  static async chatRoomUsers(params: string[], user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // be sure we have the chatroom name param to find users
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_CHATROOM_MEMBERS, user.connection);
    } else if (params.length === 1) {
      const roomName = params[0];
      let foundRoom = false;
      for await (const x of server.chatRooms) {
        if (x.name === roomName) {
          foundRoom = true;
          // found the room so list users
          const msg = `Chatroom: ${x.name} has ${x.connectedUsers.length} current users.`;
          server.systemMessageToUser(msg, user.connection);
        }
      }

      if (foundRoom === false) {
        server.systemMessageToUser(`Chatroom: ${roomName} is not an active chat room.`, user.connection);
      }
    }
  }

  static async kickUser(params: string[], user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // be sure we have the chatroom name and username param to kick the correct user
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_KICK, user.connection);
    } else if (params.length === 2) {
      console.log(params);
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
                server.systemMessageToUser(msg, user.connection);
              }
            }
          }
        }
      }
    }
  }

  static activeChatRoom(user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    const msg = user.activeChatRoom
      ? `Your active channel is: ${user.activeChatRoom.name}`
      : `You are not currently in a chat room.`;
    server.systemMessageToUser(msg, user.connection);
  }

  static listJoinedRooms(user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }
  }

  static async listChatRooms(user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // get a formatted list of the chatrooms on the server instance and write them
    if (server.chatRooms.length <= 0) {
      // no chat rooms on the server yet
      server.systemMessageToUser(SERVER_MESSAGES.NO_CHATROOMS_EXIST, user.connection);
      return;
    } else if (server.chatRooms.length >= 1) {
      let msg = '';
      for await (const room of server.chatRooms) {
        msg += `${room.name} - Users in chatroom: ${room.connectedUsers.length}\n`;
      }
      server.systemMessageToUser(msg, user.connection);
    }
  }

  static allUsers(user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    server.systemMessageToUser(`Currently ${server.connectedUsers.length} users connected to server.`, user.connection);
  }

  static async getMyIp(user: User) {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.status === 200) {
      const data = await response.json();
      const msg = `Your IP: ${data.ip ? data.ip : 'unknown'}`;
      server.messageToSender(msg, user.connection);
    } else {
      server.messageToSender(`An error occurred retreiving your IP, try again later.`, user.connection);
    }
  }
}
