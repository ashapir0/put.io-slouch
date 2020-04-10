import { DiscordService } from "../../service/DiscordService";
import { PutIOService } from "../../service/PutIOService";
import { RedisService } from "../../service/RedisService";

export interface UsageDependencies {
  discordService: DiscordService;
  putIOService: PutIOService;
  redisService: RedisService;
}
