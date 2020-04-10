import { Client, Message } from "discord.js";

const { DISCORD_TOKEN } = process.env;

export class DiscordService {
  public readonly discordInstance: Client;

  public constructor() {
    this.discordInstance = new Client();
  }

  public async start(): Promise<void> {
    const promise = new Promise<void>(resolve => {
      console.log("Connected to Discord");
      this.discordInstance.once("ready", () => resolve());
    });
    await this.discordInstance.login(DISCORD_TOKEN);
    return promise;
  }

  public bindMessageListener(handler: (message: Message) => Promise<void>): void {
    this.discordInstance.on("message", handler);
  }

  public stop(): void {
    this.discordInstance.destroy();
    console.log("Disconnected from Discord");
  }
}
