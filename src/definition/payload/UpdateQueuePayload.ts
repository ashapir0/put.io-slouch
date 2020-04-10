export interface UpdateQueuePayload {
  transferId?: number;
  mediaType: string;
  torrentName: string;
  retries: number;
  originChannelId: string;
}
