import { User } from './user.ts';
import { server } from '../main.ts';

export const WelcomeMessage = {
  showWelcomeMessage: async (user: User) => {
    const userCountString =
      server.connectedUsers.length <= 1
        ? `👋 You are the only user on the server. 👋                                                   *`
        : `There are currently ${server.connectedUsers.length} users on the server. Login and join a chatroom to join a chat. 💬      *`;
    const welcomeString = `
        *************************************************************************************************
        *   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄    *
        *   ██░███░█░▄▄█░██▀▄▀█▀▄▄▀█░▄▀▄░█░▄▄███▄░▄█▀▄▄▀████░▄▄▀█░▄▄█░▄▄▀█▀▄▄▀████░▄▄▀█░████░▄▄▀█▄░▄    *
        *   ██░█░█░█░▄▄█░██░█▀█░██░█░█▄█░█░▄▄████░██░██░████░██░█░▄▄█░██░█░██░████░████░▄▄░█░▀▀░██░█    *
        *   ██▄▀▄▀▄█▄▄▄█▄▄██▄███▄▄██▄███▄█▄▄▄████▄███▄▄█████░▀▀░█▄▄▄█▄██▄██▄▄█████░▀▀▄█▄██▄█▄██▄██▄█    *
        *   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀    *
        *                                                                                               *
        *  📢 Enter /login to set your own username and join a chatroom 📢                              *
        *  ℹ️  For more commands and if you are feeling lost, enter /info. ℹ️                             *
        *                                                                                               *
        *  ${userCountString}
        *************************************************************************************************
        `;
    await server.messageToSender(welcomeString, user.connection);
  },
};
