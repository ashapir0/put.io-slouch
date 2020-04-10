import { DiscordService } from "./service/DiscordService";
import { DiscordCommandListener } from "./discord/DiscordCommandListener";
import { PutIOService } from "./service/PutIOService";

export class Application {
  private readonly discordService: DiscordService;
  private readonly putioService: PutIOService;

  public constructor() {
    this.discordService = new DiscordService();
    this.putioService = new PutIOService();
    new DiscordCommandListener({ discordService: this.discordService, putIOService: this.putioService });
  }

  public async start() {
    await this.discordService.start();
    await this.putioService.start();
  }

  public async stop() {
    this.discordService.stop();
  }
}