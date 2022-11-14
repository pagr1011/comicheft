// import { AuthModule } from '../../security/auth/auth.module.js';
import { Comicheft } from '../../comicheft/entity/comicheft.entity.js';
import { DbPopulateController } from './db-populate.controller.js';
import { DbPopulateService } from './db-populate.service.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Comicheft])], // , AuthModule
    controllers: [DbPopulateController],
    providers: [DbPopulateService],
    exports: [DbPopulateService],
})
export class DevModule {}
