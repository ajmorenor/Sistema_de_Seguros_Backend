import { Module } from '@nestjs/common';

import { HttpModule } from './http/http.module';
import { ContextsModule } from '../contexts/contexts.module';
import { EnvModule } from 'src/shared/env/env.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    EnvModule,
    HttpModule,
    ContextsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    HealthModule,
  ],
})
export class AppModule { }
