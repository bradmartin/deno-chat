import { EventEmitter, logger, port } from '../main.ts';
import { User } from './user.ts';
import { Packet } from './packet.ts';
import { COMMANDS } from './commands.ts';
import { SERVER_MESSAGES } from './messages.ts';
import { CommandHandlers } from './command-handlers.ts';
import { ChatRoom } from './chatroom.ts';
import { WelcomeMessage } from './welcome-message.ts';

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
      WelcomeMessage.showWelcomeMessage(user);
    }
  }

  async systemMessageToUser(msg: string, connection: Deno.Conn) {
    await this._write(`📢 System Message 📢 :: ${msg}`, connection);
  }

  async messageToSender(msg: string, connection: Deno.Conn) {
    await this._write(`${msg}`, connection);
  }

  private async _handleConnection(user: User) {
    try {
      const buffer = new Uint8Array(1024);
      while (true) {
        const count = await user.connection.read(buffer);

        if (!count) {
          // connection closed
          const index = this.connectedUsers.indexOf(user);
          this.connectedUsers.splice(index, 1);
          break;
        } else {
          // some value was sent to the server so we need to parse it and handle accordingly
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
    if (!text) {
      return;
    }

    // check if a command was passed to the server
    if (text.startsWith('/') === true) {
      // handle the command here
      this._handleCommand(text, user);
      return;
    }

    // be sure the user has logged in by entering a username
    if (!user.isAuthenticated) {
      this.messageToSender(SERVER_MESSAGES.NOT_AUTHENTICATED, user.connection);
      return;
    }

    // be sure the user is in a chatroom to send message
    if (!user.activeChatRoom) {
      this.systemMessageToUser(SERVER_MESSAGES.JOIN_CHATROOM_TO_CHAT, user.connection);
      return;
    }

    // user is in good to send a message to the active chat room
    const messageString = `${new Date().toLocaleTimeString()} > ${user.name} :: ${text}`;
    logger.info(messageString);
    this._sendChatroomMessage(messageString, user);
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
      case COMMANDS.ALL_USERS:
        CommandHandlers.allUsers(user);
        break;
      case COMMANDS.CHATTERS:
        CommandHandlers.chatRoomUsers(params, user);
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
      case COMMANDS.BLOCKED:
        CommandHandlers.listOfBlockedUsers(user);
        break;
      case COMMANDS.IP:
        CommandHandlers.getMyIp(user);
        break;
      case COMMANDS.WHOAMI:
        CommandHandlers.whoAmI(user);
        break;
      default:
        this.systemMessageToUser(SERVER_MESSAGES.INVALID_COMMAND, user.connection);
        break;
    }
  }

  private async _sendChatroomMessage(msg: string, user: User) {
    try {
      // loop all the chatroom users and send message
      for await (const x of user.activeChatRoom!.connectedUsers) {
        // we dont send the message to the user who sent it
        if (x.id !== user.id) {
          // we also need to not send messages to users who have BLOCKED the sender
          if (x.blockedUsers.length >= 1) {
            // this user has blocked users so lets check if the sender is already blocked
            for await (const blockedUser of x.blockedUsers) {
              if (blockedUser.id !== user.id) {
                // this user is not currently blocked so we can send the message
                await this._write(`${msg}`, x.connection);
              }
            }
          } else {
            await this._write(`${msg}`, x.connection);
          }
        }
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
