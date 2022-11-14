//import { AuthModule } from '../security/auth/auth.module.js';
import { Comicheft } from './entity/comicheft.entity.js';
import { ComicheftGetController } from './rest/comicheft-get.controller.js';
import { ComicheftMutationResolver } from './graphql/comicheft-mutation.resolver.js';
import { ComicheftQueryResolver } from './graphql/comicheft-query.resolver.js';
import { ComicheftReadService } from './service/comicheft-read.service.js';
import { ComicheftValidationService } from './service/comicheft-validation.service.js';
import { ComicheftWriteController } from './rest/comicheft-write.controller.js';
import { ComicheftWriteService } from './service/comicheft-write.service.js';
import { MailModule } from '../mail/mail.module.js';
import { Module } from '@nestjs/common';
import { QueryBuilder } from './service/query-builder.js';
import { Schlagwort } from './entity/schlagwort.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Comicheften.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [
        MailModule,
        // siehe auch src\app.module.ts
        TypeOrmModule.forFeature([Comicheft, Schlagwort]),
        //AuthModule,
    ],
    controllers: [ComicheftGetController, ComicheftWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        ComicheftReadService,
        ComicheftWriteService,
        ComicheftValidationService,
        ComicheftQueryResolver,
        ComicheftMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [
        ComicheftReadService,
        ComicheftWriteService,
        ComicheftValidationService,
    ],
})
export class ComicheftModule {}
