import { MessageEmbed } from "discord.js";

import { DiscordCommand } from "../DiscordCommand";
import { DiscordCommandType } from "../DiscordCommandType";
import { NumericalUtilities } from "../../utility/NumericalUtilities";
import { UpdateQueuePayload } from "../../definition/payload/UpdateQueuePayload";

const { DISCORD_PREFIX, UPDATE_QUEUE_NAME } = process.env;

export class DownloadDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const { putIOService: { client: putIOClient }, redisService: { redisInstance } } = this.dependencies;
    try {
      const analysisResponse = await putIOClient.Transfers.Analysis([this.args[1]]);
      const fileAnalysis = analysisResponse.data.ret[0];

      const transferResponse = await putIOClient.Transfers.StartFetching([{ url: this.args[1] }]);

      const transferData = transferResponse.data.transfers[0].transfer;
      const embed = new MessageEmbed()
        .setTitle("File Transfer Started")
        .setDescription(`The torrent for \`${fileAnalysis.name}\` has been started. Updates will be posted as processing occurs.`)
        .addField("File Size", NumericalUtilities.formatBytes(fileAnalysis.file_size), true)
        .addField("Storage Remaining", NumericalUtilities.formatBytes(analysisResponse.data.disk_avail - fileAnalysis.file_size), true)
        .addField("Status", transferData.status_message, true);

      const payload: UpdateQueuePayload = {
        transferId: transferData.id,
        mediaType: this.args[0],
        originChannelId: this.message.channel.id,
        torrentName: fileAnalysis.name,
        retries: 3
      };
      await redisInstance.sendMessageAsync({ qname: UPDATE_QUEUE_NAME!, message: JSON.stringify(payload), delay: 4 })
      await this.message.channel.send(embed);
    }
    catch (e) {
      console.error(e);
      await this.message.channel.send(this.getErrorEmbed());
    }
    finally {
      await this.message.delete();
    }
  }

  public async validate(): Promise<boolean> {
    if (this.args.length !== 2) {
      await this.message.channel.send(this.getUsageEmbed());
      return false;
    }
    return true;
  }

  private getUsageEmbed(): MessageEmbed {
    const usageString = `\`${DISCORD_PREFIX}${DiscordCommandType.DOWNLOAD} [movie, tv, youtube] magnet:?xt\``
    return new MessageEmbed()
      .setDescription(`In order to download media you need to specify the type of media (movie, tv, youtube) and the magnet URI.\n\n${usageString}`);
  }

  private getErrorEmbed(): MessageEmbed {
    return new MessageEmbed()
      .setDescription("This file could not be downloaded, please try again later.");
  }
}
