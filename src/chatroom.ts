import { ChatRoomOptions } from '../models/chatroom-options.ts';
import { User } from './user.ts';

export class ChatRoom {
  /**
   * Name of the chatroom.
   */
  name: string;

  /**
   * Array containing the users in the room.
   */
  connectedUsers: User[] = [];

  /**
   * Admin will be the user who created the room.
   */
  admin: User;
  constructor(opts: ChatRoomOptions) {
    this.name = opts.name;
    this.admin = opts.admin;
  }
}
