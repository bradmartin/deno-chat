import { UserOptions } from '../models/user-options.ts';
import { ChatRoom } from './chatroom.ts';

export class User {
  /**
   * Randomly generated ID for the user.
   */
  id: string;

  /**
   * Name of the user.
   */
  name: string;

  /**
   * Reference to the connection to the server for the user.
   */
  connection: Deno.Conn;

  /**
   * Array containing users that are blocked by the user.
   */
  blockedUsers: User[] = [];

  /**
   * Boolean if the user is logged in.
   */
  isAuthenticated = false;

  /**
   * The active chat room for the user.
   */
  activeChatRoom?: ChatRoom;

  constructor(opts: UserOptions) {
    this.id = opts.id;
    this.name = opts.name;
    this.connection = opts.connection;
  }

  resetUser() {
    this.isAuthenticated = false;
  }
}
