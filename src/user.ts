import { UserOptions } from '../models/user-options.ts';
import { ChatRoom } from './chatroom.ts';

export class User {
  id: string;
  name: string;
  connection: Deno.Conn;
  blockedUsers: User[] = [];
  isAuthenticated = false;
  activeChatRoom?: ChatRoom;

  constructor(opts: UserOptions) {
    this.id = opts.id;
    this.name = opts.name;
    this.connection = opts.connection;
  }

  resetUser() {
    this.name = `User-${this.id}`;
    this.isAuthenticated = false;
  }
}
