export enum SERVER_MESSAGES {
  INVALID_COMMAND = `Invalid Command. Type /help for help.`,
  INVALID_WHISPER = `Please enter a username and message to send a private message.`,
  INVALID_IGNORE = `Please enter the username for who you are wanting to ignore.`,
  INVALID_LOGIN = `Please enter a valid username.`,
  ERROR = `An unexpected error occurred, please try again, if the problem continues email bradmartin0905@gmail.com`,
  HELP = `
  **************************************************************************************************
  # COMMANDS
  #
  # /CHANNEL - List your active channel. 📺
  # /CHANNELS - List all available channels. 👀
  # /JOIN <channel name> - Join a channel, create if it doesn't exist. 🚶🏻‍♂️🚪
  # /KICK <channel name> <username> - Kick a user from a channel you're an admin of. 🥾
  # /BLOCK <username> - Block a user to avoid seeing their messages. 🛑
  # /LEAVE <channel name> - Leave a channel. 🚪🏃‍♂️
  # /LOGIN <desired username> - Authenticate with the server. 🔑
  # /LOGOUT - Log out. 🔐
  # /MEMBER - List channels you've joined. 📝
  # /HELP - List available commands. 🙋‍♂️
  # /CHATTERS - List users in this channel. 🗣
  # /SWITCH <channel name> - Switch to a channel you're a member of. 🔌
  # /PM <username> <message> - Send a private message to user. 🤫
  **************************************************************************************************
`,
}
