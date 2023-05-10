/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { AuthModule } from '../security/auth/auth.module.js';
import { ComicheftGetController } from './rest/comicheft-get.controller.js';
import { ComicheftMutationResolver } from './graphql/comicheft-mutation.resolver.js';
import { ComicheftQueryResolver } from './graphql/comicheft-query.resolver.js';
import { ComicheftReadService } from './service/comicheft-read.service.js';
import { ComicheftWriteController } from './rest/comicheft-write.controller.js';
import { ComicheftWriteService } from './service/comicheft-write.service.js';
import { MailModule } from '../mail/mail.module.js';
import { Module } from '@nestjs/common';
import { QueryBuilder } from './service/query-builder.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entity/entities.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Bücher.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [MailModule, TypeOrmModule.forFeature(entities), AuthModule],
    controllers: [ComicheftGetController, ComicheftWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        ComicheftReadService,
        ComicheftWriteService,
        ComicheftQueryResolver,
        ComicheftMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [ComicheftReadService, ComicheftWriteService],
})
export class ComicheftModule {}
