import { User } from '../src/user.ts';

export interface UserOptions {
  name: string;
  connection: Deno.Conn;
  blockedUsers?: User[];
}
