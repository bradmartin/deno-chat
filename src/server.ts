import { EventEmitter, logger, port } from '../main.ts';
import { User } from './user.ts';
import { Packet } from './packet.ts';
import { COMMANDS } from '../utils/commands.ts';
import { SERVER_MESSAGES } from '../utils/messages.ts';
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
    const systemMsgPrefix = `📢 System Message 📢`;
    await this._write(`${systemMsgPrefix} :: ${msg}`, connection);
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
      const messageString = `${new Date().toLocaleTimeString()} > 🤫 Private Message 🤫 > ${user.name} :: ${msg}`;
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
        // set the active chat room for the user
        user.activeChatRoom = room;
        this.systemMessageToUser(
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
    this.chatRooms.push(newChatroom);
    // add the user to the new chatroom
    newChatroom.connectedUsers.push(user);
    // set the active chat room for the user
    user.activeChatRoom = newChatroom;
    this.systemMessageToUser(`Chatroom: ${chatroomName} created. You are the admin.`, user.connection);
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
    this.sendChatroomMessage(messageString, user);

    // this._broadcastMessage(messageString, user);
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
      case COMMANDS.MEMBER:
        CommandHandlers.listJoinedRooms(user);
        break;
      case COMMANDS.PM:
        CommandHandlers.PM(params, user);
        break;
      case COMMANDS.BLOCK:
        CommandHandlers.blockUser(params, user);
        break;
      case COMMANDS.IP:
        CommandHandlers.getMyIp(user);
        break;
      default:
        this.systemMessageToUser(SERVER_MESSAGES.INVALID_COMMAND, user.connection);
        break;
    }
  }

  private async sendChatroomMessage(msg: string, user: User) {
    try {
      // need to get all the connected users in the users active chatroom
      // then send the message to the chat room
      for await (const x of user.activeChatRoom!.connectedUsers) {
        if (x.id !== user.id) {
          // send the message to this user in this room
          await this._write(`${msg}`, x.connection);
        }
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
