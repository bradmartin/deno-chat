# Chat Server written with Deno & TS

![Deno Chat](./assets/images/deno-chat-one.png)

## Setup

You will need Deno installed. [Installation Guide here.](https://deno.land/#installation)

```bash
// to insall on mac with homebrew
brew install deno
```

If you have `npm` installed you can use some npm scripts below, if not the deno commands work just fine.

## Development

`deno run --allow-all --watch=./**/*.ts ./main.ts`
or with npm
`npm run dev`

## Build Executables

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

#### /MEMBER - List chatroom you've joined. 📝

#### /ALL_USERS - List users on the server. 🗣

#### /PM <username> <message> - Send a private message to user. 🤫

#### /IP - Get your IP address. 🌎

---
