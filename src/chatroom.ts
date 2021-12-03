import { ChatRoomOptions } from '../models/chatroom-options.ts';
import { User } from './user.ts';

export class ChatRoom {
  name: string;
  connectedUsers: User[] = [];
  admin: User;
  constructor(opts: ChatRoomOptions) {
    this.name = opts.name;
    this.admin = opts.admin;
  }
}
