import { UserOptions } from '../models/user-options.ts';

export class User {
  name: string;
  connection: Deno.Conn;
  blockedUsers: User[] = [];

  constructor(opts: UserOptions) {
    this.name = opts.name;
    this.connection = opts.connection;
  }
}
