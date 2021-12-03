import { EventEmitter, logger, port } from '../main.ts';
import { User } from './user.ts';
import { Packet } from './packet.ts';
import { COMMANDS } from '../utils/commands.ts';
import { SERVER_MESSAGES } from '../utils/messages.ts';
import { CommandHandlers } from './command-handlers.ts';
import { ChatRoom } from './chatroom.ts';

const decoder = new TextDecoder();

export class Server extends EventEmitter {
  connectedUsers: User[] = [];
  chatRooms: ChatRoom[] = [];

  constructor() {
    super();
    this.init();
  }

  async init() {
    const listener = Deno.listen({ port });

    for await (const connection of listener) {
      // assign a username when new connection is made
      const userId = crypto.randomUUID();
      const user = new User({ id: userId, name: `User-${userId}`, connection });
      this.connectedUsers.push(user);

      // check if this is the only connected user
      const activeUsers = this.connectedUsers.length;
      logger.debug(`Active users: ${activeUsers}`);

      this._handleConnection(user);
      // show user the welcome message
      this._showWelcomeMessage(user);
    }
  }

  async messageToSender(msg: string, connection: Deno.Conn) {
    await this._write(`${msg}`, connection);
  }

  async sendPrivateMessage(usernameToMessage: string, msg: string, user: User) {
    const userToSendTo = this.connectedUsers.find((user) => user.name === usernameToMessage);
    console.log('user to message', userToSendTo);
    // TODO: check if private message is from a blocked user and DO NOTHING

    if (userToSendTo) {
      // append the datetime to the message and PRIVATE MESSAGE NOTE
      const messageString = `${new Date().toLocaleTimeString()} > *** PRIVATE MESSAGE *** > ${user.name} :: ${msg}`;
      logger.info(messageString);
      await this._write(messageString, userToSendTo.connection);
    } else {
      // no user found so tell the user that the user is offline and didn't get the message
      this.messageToSender('user is not online', user.connection);
    }
  }

  async blockUser(username: string, requester: User) {
    for (let i = 0; i < this.connectedUsers.length; i++) {
      const user = this.connectedUsers[i];
      if (user.name !== username) {
        // we found the user to block, so let's add this user to the block list for the requesting user
        user.blockedUsers.push(user);
        await this.messageToSender(`${username} is being ignored.`, requester.connection);
      }
    }
  }

  async joinChatroom(chatroomName: string, user: User) {
    for await (const room of this.chatRooms) {
      if (room.name === chatroomName) {
        // channel exists so just join it
        room.connectedUsers.push(user);
        return;
      }
    }

    // create the chatroom
    const newChatroom = new ChatRoom({
      name: chatroomName,
      admin: user,
    });
    this.chatRooms.push(newChatroom);
    // add the user to the new chatroom
    newChatroom.connectedUsers.push(user);
    // set the active chat room for the user
    user.activeChatRoom = newChatroom;
    this.messageToSender(`Chatroom: ${chatroomName} created.`, user.connection);
  }

  private async _handleConnection(user: User) {
    try {
      const buffer = new Uint8Array(1024);
      while (true) {
        const count = await user.connection.read(buffer);

        if (!count) {
          this._announceUserLeaving(user);
          // connection closed
          const index = this.connectedUsers.indexOf(user);
          this.connectedUsers.splice(index, 1);
          break;
        } else {
          // some value was sent to the server so we need to parse it and handle accordingly
          // catch arrow keys since we dont want user spamming with those for now (could expand on the list later)
          const dataArray = buffer.subarray(0, count!);
          const text = decoder.decode(dataArray).trim();
          this._handleMessage(text, user);
        }
      }
    } catch (error) {
      logger.error(error);
    }
  }

  private _handleMessage(text: string, user: User) {
    // check if the text is empty - DO NOTHING
    if (!text || text === undefined || text === '' || text === null) {
      return;
    }

    // check if a command was passed to the server
    if (text.startsWith('/') === true) {
      logger.info(`${new Date().toLocaleTimeString()} > ${user.name} sent command ${text}.`);
      // handle the command here
      this._handleCommand(text, user);
      return;
    }

    // be sure the user has logged in by entering a username
    if (!user.isAuthenticated) {
      this.messageToSender(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // here we have text input so we can send to the connected users
    // iterate all connected users and send the message to those connections
    // add the username and timestamp to the message
    const messageString = `${new Date().toLocaleTimeString()} > ${user.name} :: ${text}`;
    logger.info(messageString);
    this._broadcastMessage(messageString, user);
  }

  private async _announceUserLeaving(user: User) {
    // logger.info(`User left chat ${user.name}`);
    for (const currentConnection of this.connectedUsers) {
      if (currentConnection !== user) {
        await this._write(this._userLeftServerString(user.name), currentConnection.connection);
      }
    }
  }

  private async _write(data: Uint8Array | string | Packet, connection: Deno.Conn) {
    try {
      await connection.write(new Packet(data).toData());
    } catch (e) {
      logger.error(e);
      // this.emit(Event.error, this, e);
      // this.close();
    }
  }

  private _handleCommand(input: string, user: User) {
    // first character is '/'
    let [command, ...params] = input.slice(1).split(' ');
    command = command.toUpperCase().trim();

    switch (command) {
      case COMMANDS.EXIT:
        CommandHandlers.exit(user);
        break;
      case COMMANDS.INFO:
        CommandHandlers.info(user);
        break;
      case COMMANDS.LOGIN:
        CommandHandlers.login(params, user);
        break;
      case COMMANDS.LOGOUT:
        CommandHandlers.logout(user);
        break;
      case COMMANDS.CHATTERS:
        this.messageToSender(`Currently ${this.connectedUsers.length} users connected.`, user.connection);
        break;
      case COMMANDS.ROOM:
        CommandHandlers.activeChatRoom(user);
        break;
      case COMMANDS.ROOMS:
        CommandHandlers.listChatRooms(user);
        break;
      case COMMANDS.JOIN:
        CommandHandlers.joinChatroom(params, user);
        break;
      case COMMANDS.KICK:
        CommandHandlers.kickUser(params, user);
        break;
      case COMMANDS.LEAVE:
        CommandHandlers.leaveChatroom(params, user);
        break;
      case COMMANDS.PM:
        CommandHandlers.PM(params, user);
        break;
      case COMMANDS.BLOCK:
        CommandHandlers.blockUser(params, user);
        break;
      default:
        this.messageToSender(SERVER_MESSAGES.INVALID_COMMAND, user.connection);
        break;
    }
  }

  private async _systemMessage(msg: string) {
    for (let i = 0; i < this.connectedUsers.length; i++) {
      const el = this.connectedUsers[i];
      await this._write(`${msg}`, el.connection);
    }
  }

  private async _broadcastMessage(msg: string, user: User) {
    for (let i = 0; i < this.connectedUsers.length; i++) {
      const el = this.connectedUsers[i];
      if (el !== user) {
        // TODO: check if chat message is from a blocked user and DO NOTHING

        await this._write(`${msg}`, el.connection);
      }
    }
  }

  private async _showWelcomeMessage(user: User) {
    const userCountString =
      this.connectedUsers.length <= 1
        ? `You are the only user on the server. 👋                                                      *`
        : `There are currently ${this.connectedUsers.length} users on the server. 💬                                                *`;
    const welcomeString = `
    *************************************************************************************************
    *   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄    *
    *   ██░███░█░▄▄█░██▀▄▀█▀▄▄▀█░▄▀▄░█░▄▄███▄░▄█▀▄▄▀████░▄▄▀█░▄▄█░▄▄▀█▀▄▄▀████░▄▄▀█░████░▄▄▀█▄░▄    *
    *   ██░█░█░█░▄▄█░██░█▀█░██░█░█▄█░█░▄▄████░██░██░████░██░█░▄▄█░██░█░██░████░████░▄▄░█░▀▀░██░█    *
    *   ██▄▀▄▀▄█▄▄▄█▄▄██▄███▄▄██▄███▄█▄▄▄████▄███▄▄█████░▀▀░█▄▄▄█▄██▄██▄▄█████░▀▀▄█▄██▄█▄██▄██▄█    *
    *   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀    *
    *  Your current username is ${user.name}.                          * 
    *  Enter /login to set your own username.                                                 *
    *  For more commands and if you are feeling lost, enter /info.                                  *
    *                                                                                               *
    *  ${userCountString}
    *************************************************************************************************
    `;
    await this._write(welcomeString, user.connection);
  }

  private _userLeftServerString(userName: string) {
    return `
    **************** 📣 Server Announcement 📣 **************
    ${userName} left the server at ${new Date().toLocaleTimeString()}
    *********************************************************\n`;
  }
}
