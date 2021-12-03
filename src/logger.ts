import { red, cyan, blue } from 'https://deno.land/x/nanocolors/mod.ts';
import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import { MessageData } from '../models/messagedata.ts';

export class Logger {
  #db: DB;
  #messageTable = 'messages';

  static file: string;

  constructor() {
    // Open a database
    this.#db = new DB('chatserver.db');
    this.#db.query(`
      CREATE TABLE IF NOT EXISTS ${this.#messageTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        username TEXT NOT NULL,
        message TEXT NOT NULL
      )
    `);

    // const d = new Date();
    // const dateString = `${d.getFullYear()}_${d.getMonth()}_${d.getDay()}_${d.getMilliseconds()}`;

    // Logger.file = `./logs/${dateString}.txt`;

    // // create the dir
    // Deno.mkdirSync('./logs', { recursive: true });

    // // create the file
    // Deno.createSync(Logger.file);
  }

  /**
   * Save a message record to the sqlite database.
   * @param data [MessageData] - message object to save.
   */
  saveMessage(data: MessageData) {
    if (!data) {
      return;
    }

    // // create the datetime for the record
    // const d = new Date().getUTCDate().toString();
    // data.datetime = d;

    // const dt = new Date();
    // const dtString =
    //   dt.getFullYear() +
    //   '-' +
    //   (dt.getMonth() + 1) +
    //   '-' +
    //   dt.getDate() +
    //   ' ' +
    //   dt.getHours() +
    //   ':' +
    //   dt.getMinutes() +
    //   ':' +
    //   dt.getSeconds();
    // console.log(dtString);
    // data.datetime = dtString;

    // now save the data to sqlite
    const query = `
      INSERT INTO ${this.#messageTable} (username, message)
      VALUES (${data.username}, ${data.message});
    `;
    console.log(query);

    this.#db.query(query);
  }

  /**
   * General util method to print a given count of messages from the sqlite database.
   * @param count [number] - Default is 10.
   */
  printMessages(count = 10) {
    try {
      // Print out data in table
      for (const [name] of this.#db.query(
        `SELECT * FROM ${this.#messageTable} LIMIT ${count}`
      )) {
        console.log(name);
      }
    } catch (error) {
      this.e(`Error printing messages table data :: ${error}`);
    }
  }

  /**
   * Closes the connection to the database.
   */
  closeDatabaseConnection() {
    this.#db.close();
  }

  i(args: any) {
    console.log(blue('Info'), args);
    // Logger.writeToFile(args);
  }

  w(args: any) {
    console.log(cyan('Warning'), args);
    // Logger.writeToFile(args);
  }

  e(args: any) {
    console.log(red('Error'), args);
    // Logger.writeToFile(args);
  }
}
