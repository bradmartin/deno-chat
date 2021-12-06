# Chat Server written in TS running with Deno

![Deno Chat](./assets/images/deno-chat-one.png)

## Setup

You will need Deno installed. [Installation Guide here.](https://deno.land/#installation)

```bash
// to insall on mac with homebrew
brew install deno
```

If you have `npm` installed you can use some npm scripts below, if not the deno commands work just fine (see package.json scripts for more).

## Development

`deno run --allow-all --watch=./**/*.ts ./main.ts -p 4040`.
or with npm
`npm run dev`

- This will build and start the server. Default port is 8080. If you pass the `-p <value>` argument you can set the port to listen on.

## Build Executables (Unstable in Deno right now)

`deno compile --allow-all --output=./build/chat_server ./main.ts`
or with npm
`npm run build`

## Server Commands

#### /INFO - List available commands. 🙋‍♂️

#### /LOGIN <desired username> - Authenticate with the server. 🔑

#### /LOGOUT - Log out. 🔐

#### /JOIN <chatroom name> - Join a chatroom, create if it doesn't exist. 🚶🏻‍♂️🚪

#### /LEAVE <chatroom name> - Leave a chatroom. 🚪🏃‍♂️

#### /CHATTERS <chatroom name> - List users in a chatroom. 👨‍👩‍👧‍👦

#### /ROOM - List your active chatroom. 📺

#### /ROOMS - List all available chatrooms. 👀

#### /KICK <chatroom name> <username> - Kick a user from a chatroom you're an admin of. 🥾

#### /BLOCK <username> - Block a user to avoid seeing their messages. 🛑

#### /BLOCKED - List of users you have blocked. 🛑

#### /ALL_USERS - List users on the server. 🗣

#### /PM <username> <message> - Send a private message to user. 🤫

#### /WHOAMI - Show user information. ℹ️

#### /IP - Get your IP address. 🌎

---

### Dependencies

- No external dependencies.

### Why Deno

Deno being stable for some time now and its creators being the same as the original creators of Node makes it a very exciting and potentially strong framework moving forward. Its first class TS support made everything fairly simple to get up and running. You can read more about [Deno here](https://deno.land/).
