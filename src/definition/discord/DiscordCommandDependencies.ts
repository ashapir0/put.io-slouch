import { DiscordService } from "../../service/DiscordService";
import { PutIOService } from "../../service/PutIOService";

export interface DiscordCommandDependencies {
  discordService: DiscordService;
  putIOService: PutIOService;
}