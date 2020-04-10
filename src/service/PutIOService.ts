import PutioAPI from "@putdotio/api-client";
import PutioAPIClient from "@putdotio/api-client";

const { PUT_IO_OAUTH_TOKEN, PUT_IO_CLIENT_ID } = process.env;

export class PutIOService {
  public readonly client: PutioAPIClient;

  constructor() {
    this.client = new PutioAPI({ clientID: Number(PUT_IO_CLIENT_ID) })
  }

  public async start(): Promise<void> {
    this.client.setToken(PUT_IO_OAUTH_TOKEN!);
    try {
      const response = await this.client.User.Info({});
      console.log(`Authenticated with put.io as ${response.data.info.username}`)
    }
    catch (e) {
      console.error("Could not login to put.io! Exiting!");
      console.error(e);
      process.exit(1);
    }
  }

}