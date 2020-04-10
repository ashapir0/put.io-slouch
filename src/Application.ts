import { DiscordService } from "./service/DiscordService";
import { PutIOService } from "./service/PutIOService";
import { RedisService } from "./service/RedisService";

import { DiscordCommandListener } from "./discord/DiscordCommandListener";
import { UsageDependencies } from "./definition/dependencies/UsageDependencies";
import { UpdateQueueListener } from "./redis/UpdateQueueListener";

export class Application {
  private readonly discordService: DiscordService;
  private readonly putioService: PutIOService;
  private readonly redisService: RedisService;
  private readonly updateQueueListener: UpdateQueueListener;

  public constructor() {
    this.discordService = new DiscordService();
    this.putioService = new PutIOService();
    this.redisService = new RedisService();

    this.updateQueueListener = new UpdateQueueListener(this.getDependencies());
    new DiscordCommandListener(this.getDependencies());

  }

  private getDependencies(): UsageDependencies {
    return {
      discordService: this.discordService,
      putIOService: this.putioService,
      redisService: this.redisService
    }
  }

  public async start() {
    await this.discordService.start();
    await this.putioService.start();
    await this.redisService.start();
    this.updateQueueListener.start();
  }

  public async stop() {
    await this.updateQueueListener.stop();
    this.discordService.stop();
    this.redisService.stop();
  }
}
