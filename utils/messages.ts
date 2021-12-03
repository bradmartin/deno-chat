export enum SERVER_MESSAGES {
  INVALID_COMMAND = `Invalid Command. Type /info for list of commands.`,
  INVALID_WHISPER = `Please enter a username and message to send a private message.`,
  INVALID_IGNORE = `Please enter the username for who you are wanting to ignore.`,
  INVALID_LOGIN = `Please enter a valid username.`,
  INVALID_CHATROOM_JOIN = `Please enter a chatroom to join.`,
  INVALID_CHATROOM_LEAVE = `Please enter the chatroom to leave.`,
  INVALID_KICK = `Please enter the chatroom name and username of who to kick.`,
  NOT_ADMIN = `You are not the admin of the chatroom, only admins can kick a user.`,
  LOGGED_OUT = `You have logged out. You will need to login again before chatting.`,
  NO_CHATROOMS_EXIST = `No chatrooms exist. Create one by entering /join <chatroom>`,
  NOT_AUTHENTICATED = `You are not authenticated! Please login first. Enter /login <username> to login.`,
  ERROR = `An unexpected error occurred, please try again, if the problem continues email bradmartin0905@gmail.com`,
  INFO = `
  **************************************************************************************************
  # COMMANDS
  #
  # /ROOM - List your active chatroom. 📺
  # /ROOMS - List all available chatrooms. 👀
  # /JOIN <chatroom name> - Join a chatroom, create if it doesn't exist. 🚶🏻‍♂️🚪
  # /KICK <chatroom name> <username> - Kick a user from a chatroom you're an admin of. 🥾
  # /BLOCK <username> - Block a user to avoid seeing their messages. 🛑
  # /LEAVE <chatroom name> - Leave a chatroom. 🚪🏃‍♂️
  # /LOGIN <desired username> - Authenticate with the server. 🔑
  # /LOGOUT - Log out. 🔐
  # /MEMBER - List chatroom you've joined. 📝
  # /INFO - List available commands. 🙋‍♂️
  # /CHATTERS - List users in this chatroom. 🗣
  # /SWITCH <chatroom name> - Switch to a chatroom you're a member of. 🔌
  # /PM <username> <message> - Send a private message to user. 🤫
  **************************************************************************************************
`,
}
