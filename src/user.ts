import { UserOptions } from '../models/user-options.ts';

export class User {
  id: string;
  name: string;
  connection: Deno.Conn;
  blockedUsers: User[] = [];

  constructor(opts: UserOptions) {
    this.id = opts.id;
    this.name = opts.name;
    this.connection = opts.connection;
  }
}
