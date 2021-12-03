import { User } from '../src/user.ts';

export interface UserOptions {
  id: string;
  name: string;
  connection: Deno.Conn;
  blockedUsers?: User[];
}
