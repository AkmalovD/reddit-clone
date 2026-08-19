import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name)

    constructor(config: ConfigService) {
        super(config.getOrThrow<string>('REDIS_URL'), {
            // не копить бесконечную очередь команд, если Redis лежит
            maxRetriesPerRequest: 2,
            enableOfflineQueue: false
        })

        // необработанное событие error у ioredis роняет процесс,
        // а недоступный кеш ронять приложение не должен
        this.on('error', (err: Error) => {
            this.logger.warn(`Redis недоступен: ${err.message}`)
        })
    }

    async onModuleDestroy() {
        await this.quit()
    }
}
