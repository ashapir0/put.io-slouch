import { UsageDependencies } from "../definition/dependencies/UsageDependencies";

import { Mutex } from "async-mutex";
import { UpdateQueuePayload } from "../definition/payload/UpdateQueuePayload";
import { MessageEmbed, TextChannel } from "discord.js";
import { PutIOTransferStatus } from "../definition/putio/PutIOTransferStatus";

const { UPDATE_QUEUE_NAME } = process.env;

export class UpdateQueueListener {
  private readonly usageDependencies: UsageDependencies;

  private readonly messageMutex: Mutex;
  private intervalPID?: NodeJS.Timeout;

  public constructor(usageDependencies: UsageDependencies) {
    this.usageDependencies = usageDependencies;
    this.messageMutex = new Mutex();
  }

  public start(): void {
    this.intervalPID = setInterval(async () => {
      await this.popQueue();
    }, 1000 * 2);
  }

  private async handleTransferUpdate(message: string): Promise<void> {
    const { putIOService: { client: putIOClient }, redisService: { redisInstance }, discordService: { discordInstance } } = this.usageDependencies;
    const { transferId, originChannelId, torrentName }: UpdateQueuePayload = JSON.parse(message);

    const transferResponse = await putIOClient.Transfers.Get(transferId!);
    const transfer = transferResponse.data.transfer;

    if (transfer.status !== PutIOTransferStatus.COMPLETED) {
      await redisInstance.sendMessageAsync({ qname: UPDATE_QUEUE_NAME!, delay: 4, message: message });
      return;
    }

    const fileResponse = await putIOClient.Files.Query(transfer.file_id);
    const videoFile = fileResponse.data.files.find((file: any) => file.extension === "mkv" || file.extension === "mp4");

    const channel = await discordInstance.channels.fetch(originChannelId) as TextChannel;

    if (!videoFile) {
      const files = fileResponse.data.files.map((file: any) => file.name).join("\n");
      const embed = new MessageEmbed()
        .setTitle("Video File Not Found")
        .setDescription(`A video file \`(MP4, MKV)\` could not be found in the files for \`${torrentName}\`\n\n${files}`);
      await channel.send(embed);
      return;
    }

    if (videoFile.is_mp4_available) {
      const embed = new MessageEmbed()
        .setTitle("Video File Ready")
        .setDescription(`The video file for \`${torrentName}\` is now ready for download an ingest into Plex.`)
        .setThumbnail(videoFile.screenshot);
      await channel.send(embed);
    }
  }

  private async handleMessage(message: string): Promise<void> {
    const { redisService: { redisInstance }, discordService: { discordInstance } } = this.usageDependencies;

    const { transferId, mediaType, retries, originChannelId, torrentName }: UpdateQueuePayload = JSON.parse(message);
    try {
      if (transferId) {
        await this.handleTransferUpdate(message);
        return;
      }
    }
    catch (error) {
      console.error(`Could not handle update message for transfer: ${transferId}`);
      console.error(error);
      if (retries > 1) {
        const payload = { transferId, mediaType, originChannelId, torrentName, retries: retries - 1 };
        await redisInstance.sendMessageAsync({ qname: UPDATE_QUEUE_NAME!, message: JSON.stringify(payload), delay: 4 });
      }
      else {
        const channel = await discordInstance.channels.fetch(originChannelId) as TextChannel;
        const embed = new MessageEmbed()
          .setTitle("File Update Check Failed")
          .setDescription(`Checking for updates for \`${torrentName}\` has failed 3 times and must be investigated.`)
          .addField("Transfer Identifier", transferId, true);
        await channel.send(embed);
      }
    }
  }

  private async popQueue(): Promise<void> {
    const { redisService: { redisInstance } } = this.usageDependencies;

    if (this.messageMutex.isLocked()) {
      return;
    }
    const release = await this.messageMutex.acquire();

    let currentMessage = await redisInstance.popMessageAsync({ qname: UPDATE_QUEUE_NAME! });
    while (Object.keys(currentMessage).length !== 0) {
      // @ts-ignore
      await this.handleMessage(currentMessage.message);
      currentMessage = await redisInstance.popMessageAsync({ qname: UPDATE_QUEUE_NAME! });
    }

    release();
  }

  public async stop(): Promise<void> {
    await this.messageMutex.acquire();
    if (this.intervalPID) clearInterval(this.intervalPID);
  }
}
