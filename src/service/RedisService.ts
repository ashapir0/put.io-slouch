import RedisSMQ from "rsmq";

const { REDIS_HOST, REDIS_PORT, REDIS_NAMESPACE, UPDATE_QUEUE_NAME } = process.env;

export class RedisService {
  public readonly redisInstance: RedisSMQ;

  constructor() {
    this.redisInstance = new RedisSMQ({ host: REDIS_HOST, port: Number(REDIS_PORT), ns: REDIS_NAMESPACE });
  }

  public async start(): Promise<void> {
    const queues = await this.redisInstance.listQueuesAsync();
    await this.addQueueIfNotExists(queues, UPDATE_QUEUE_NAME!);
    console.log(`Connected to Redis with ${queues.length} queue(s)`);
  }

  private async addQueueIfNotExists(queues: Array<string>, queueName: string): Promise<void> {
    if (queues.includes(queueName)) return;
    await this.redisInstance.createQueueAsync({
      qname: queueName,
      vt: 60 * 60 * 24
    });
  }

  public stop(): void {
    this.redisInstance.quit();
    console.log("Disconnected from Redis");
  }
}
