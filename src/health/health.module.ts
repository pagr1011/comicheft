import { HealthController } from './health.controller.js';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
// import { healthConfig } from '../config/health.js';

@Module({
    // imports: [TerminusModule.forRoot({ errorLogStyle: 'pretty' }), HttpModule],
    imports: [TerminusModule, HttpModule],
    controllers: [HealthController],
})
export class HealthModule {}
