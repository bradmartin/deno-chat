import { SERVER_MESSAGES } from './messages.ts';
import { User } from './user.ts';
import { server, logger } from '../main.ts';
import { ChatRoom } from './chatroom.ts';

export class CommandHandlers {
  static exit(user: User) {
    // need to close the connection for the user
    user.connection.closeWrite();
  }

  static info(user: User) {
    // need to show all of the available commands to the USER who sent the command
    server.messageToSender(SERVER_MESSAGES.INFO, user.connection);
  }

  static async PM(params: string[], user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;

    // be sure we have username and message to send
    if (params.length <= 1) {
      // need both username and password to send private message to user
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_WHISPER, user.connection);
    } else if (params.length >= 2) {
      const usernameToMessage = params[0];
      // just a safety check, do not send PM to the user sending :)
      if (user.name === usernameToMessage) {
        // yea do not do this 😁 - tell the user
        server.systemMessageToUser(SERVER_MESSAGES.CANT_PM_YOURSELF, user.connection);
        return;
      }

      // okay now we're good to parse the message and find the recipient and move forward
      const msg = params.slice(1).join(' ');

      // we need to find the user being messaged and see if they are blocked by the sender (user argument in this case)
      const recipientIndex = server.connectedUsers.findIndex((x) => x.name === usernameToMessage);
      const recipient = server.connectedUsers[recipientIndex];
      if (!recipient) {
        // we dont have the receipient so we can't send a PM
        server.messageToSender(
          `User: ${usernameToMessage} is not active on the server. Unable to send message right now.`,
          user.connection
        );
        return;
      }

      if (recipient.blockedUsers.length >= 1) {
        // the recipient has blocked people
        // need to be sure the sender is not on the blocked list
        for await (const b of recipient.blockedUsers) {
          if (b.id === user.id) {
            // the sender is on the recipient block list so we don't send the message
            await server.systemMessageToUser(`Cannot send message.`, user.connection);
            return;
          }
        }
      }

      // append the datetime to the message and PRIVATE MESSAGE NOTE
      const messageString = `${new Date().toLocaleTimeString()} > 🤫 Private Message 🤫 > ${user.name} :: ${msg}`;
      logger.info(messageString);
      await server.messageToSender(messageString, recipient.connection);
    }
  }

  static async blockUser(params: string[], user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;

    // be sure we have the username param to ignore
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_IGNORE, user.connection);
    } else if (params.length === 1) {
      const usernameToBlock = params[0];
      console.log(usernameToBlock);

      for await (const x of server.connectedUsers) {
        if (x.name === usernameToBlock) {
          user.blockedUsers.push(x);
          server.systemMessageToUser(
            `${usernameToBlock} has been blocked. You should no longer see any messages from them.`,
            user.connection
          );
        }
      }
    }
  }

  static async listOfBlockedUsers(user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;

    // get list and format for string
    let blockedUserString = '';
    if (user.blockedUsers.length >= 1) {
      for await (const x of user.blockedUsers) {
        blockedUserString += `\n${x.name}\n`;
      }
      server.systemMessageToUser(`You have blocked the following users: ${blockedUserString}`, user.connection);
    } else {
      server.systemMessageToUser(
        `You have not blocked any users. Enter /block <username> to block someone.`,
        user.connection
      );
    }
  }

  /**
   * Will set the user name to the desired username.
   * @param params
   * @param user
   */
  static async login(params: string[], user: User) {
    if (user.isAuthenticated) {
      // user is already authenticated, so for now just tell them... logout first
      server.systemMessageToUser(SERVER_MESSAGES.ALREADY_LOGGED_IN, user.connection);
      return;
    }

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
      // get list of rooms the user can go ahead and join and send in message
      let serverListString = '';
      if (server.chatRooms.length >= 1) {
        serverListString += `Current Chatrooms: \n`;
        for await (const room of server.chatRooms) {
          serverListString += `Chatroom: ${room.name} :: ${room.connectedUsers.length} active users.`;
        }
      }
      const msg =
        serverListString !== ''
          ? SERVER_MESSAGES.LOGGED_IN + '\n' + serverListString
          : SERVER_MESSAGES.LOGGED_IN +
            ` There are no current chat rooms on the server. Enter /join <chatroom name> to create one.`;
      server.systemMessageToUser(msg, user.connection);
    }
  }

  static logout(user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;

    user.resetUser();
    server.systemMessageToUser(SERVER_MESSAGES.LOGGED_OUT, user.connection);
  }

  /**
   * Joins a chatroom, or creates a new chatroom if not exists.
   * @param params
   * @param user
   */
  static async joinChatroom(params: string[], user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;

    // user is auth'd so be sure we have chatroom name
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_CHATROOM_JOIN, user.connection);
    } else if (params.length === 1) {
      // server.joinChatroom(params[0], user);
      const chatroomName = params[0];
      for await (const room of server.chatRooms) {
        if (room.name === chatroomName) {
          // channel exists so just join it
          room.connectedUsers.push(user);
          // set the active chat room for the user
          user.activeChatRoom = room;
          server.systemMessageToUser(
            `${chatroomName} joined, there are ${room.connectedUsers.length} users here.`,
            user.connection
          );
          return;
        }
      }

      // create the chatroom
      const newChatroom = new ChatRoom({
        name: chatroomName,
        admin: user,
      });
      server.chatRooms.push(newChatroom);
      // add the user to the new chatroom
      newChatroom.connectedUsers.push(user);
      // set the active chat room for the user
      user.activeChatRoom = newChatroom;
      server.systemMessageToUser(`Chatroom: ${chatroomName} created. You are the admin.`, user.connection);
    }
  }

  static leaveChatroom(params: string[], user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;

    // be sure we have the chatroom name param to leave
    if (params.length <= 0) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_CHATROOM_LEAVE, user.connection);
    } else if (params.length === 1) {
      // be sure user is in a chatroom first
      const roomName = params[0];
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
    if (!CommandHandlers._authCheck(user)) return;

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
    if (!CommandHandlers._authCheck(user)) return;

    // be sure we have the chatroom name and username param to kick the correct user
    if (params.length <= 1) {
      server.systemMessageToUser(SERVER_MESSAGES.INVALID_KICK, user.connection);
    } else if (params.length === 2) {
      // kick the user if we are admin
      // find the chatroom by name
      const roomIndex = server.chatRooms.findIndex((x) => x.name === params[0]);
      const room = server.chatRooms[roomIndex];

      if (room.name === params[0]) {
        // we have the right room
        // now be sure the user kicking is the admin
        if (room.admin === user) {
          // user is the admin so we can kick
          for await (const x of room.connectedUsers) {
            if (x.name === params[1]) {
              // yay we can remove it
              const i = room.connectedUsers.indexOf(x);
              room.connectedUsers.splice(i, 1);
              // remove the active chatroom from the user being kicked
              x.activeChatRoom = undefined;
              const msg = `User: ${x.name} kicked from chatroom: ${x.name}.`;
              logger.info(msg);
              server.systemMessageToUser(`You have been kicked from ${room.name}`, x.connection);
              server.systemMessageToUser(msg, user.connection);
            }
          }
        }
      }
    }
  }

  static activeChatRoom(user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;

    const msg = user.activeChatRoom
      ? `Your active channel is: ${user.activeChatRoom.name}`
      : `You are not currently in a chat room.`;
    server.systemMessageToUser(msg, user.connection);
  }

  static listJoinedRooms(user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;
  }

  static async listChatRooms(user: User) {
    // check auth first
    if (!CommandHandlers._authCheck(user)) return;

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
    if (!CommandHandlers._authCheck(user)) return;

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

  static whoAmI(user: User) {
    const msg = `
      Id: ${user.id}
      Name: ${user.name}
      Active Chat Room: ${user.activeChatRoom?.name}
    `;
    server.messageToSender(msg, user.connection);
  }

  private static _authCheck(user: User) {
    // check auth first
    if (!user.isAuthenticated) {
      server.systemMessageToUser(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return false;
    } else {
      return true;
    }
  }
}
