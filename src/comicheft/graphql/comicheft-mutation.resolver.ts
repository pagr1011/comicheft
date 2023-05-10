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
// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Abbildung } from '../entity/abbildung.entity.js';
import { BadUserInputError } from './errors.js';
import { Comicheft } from '../entity/comicheft.entity.js';
import { ComicheftDTO } from '../rest/comicheftDTO.entity.js';
import { ComicheftWriteService } from '../service/comicheft-write.service.js';
import { type IdInput } from './comicheft-query.resolver.js';
import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { type Titel } from '../entity/titel.entity.js';
import { getLogger } from '../../logger/logger.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

export class ComicheftUpdateDTO extends ComicheftDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class ComicheftMutationResolver {
    readonly #service: ComicheftWriteService;

    readonly #logger = getLogger(ComicheftMutationResolver.name);

    constructor(service: ComicheftWriteService) {
        this.#service = service;
    }

    @Mutation()
    @RolesAllowed('admin', 'mitarbeiter')
    async create(@Args('input') comicheftDTO: ComicheftDTO) {
        this.#logger.debug('create: comicheftDTO=%o', comicheftDTO);

        const comicheft = this.#comicheftDtoToComicheft(comicheftDTO);
        const result = await this.#service.create(comicheft);
        this.#logger.debug('createComicheft: result=%o', result);

        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            throw new BadUserInputError(
                this.#errorMsgCreateComicheft(result as CreateError),
            );
        }
        return result;
    }

    @Mutation()
    @RolesAllowed('admin', 'mitarbeiter')
    async update(@Args('input') comicheftDTO: ComicheftUpdateDTO) {
        this.#logger.debug('update: comicheft=%o', ComicheftDTO);

        const comicheft = this.#comicheftUpdateDtoToComicheft(comicheftDTO);
        const versionStr = `"${comicheftDTO.version.toString()}"`;

        const result = await this.#service.update({
            id: Number.parseInt(comicheftDTO.id, 10),
            comicheft,
            version: versionStr,
        });
        if (typeof result === 'object') {
            throw new BadUserInputError(this.#errorMsgUpdateComicheft(result));
        }
        this.#logger.debug('updateComicheft: result=%d', result);
        return result;
    }

    @Mutation()
    @RolesAllowed('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteComicheft: result=%s', result);
        return result;
    }

    #comicheftDtoToComicheft(comicheftDTO: ComicheftDTO): Comicheft {
        const titelDTO = comicheftDTO.titel;
        const titel: Titel = {
            id: undefined,
            titel: titelDTO.titel,
            untertitel: titelDTO.untertitel,
            comicheft: undefined,
        };
        const abbildungen = comicheftDTO.abbildungen?.map((abbildungDTO) => {
            const abbildung: Abbildung = {
                id: undefined,
                beschriftung: abbildungDTO.beschriftung,
                contentType: abbildungDTO.contentType,
                comicheft: undefined,
            };
            return abbildung;
        });
        const comicheft = {
            id: undefined,
            version: undefined,
            isbn: comicheftDTO.isbn,
            rating: comicheftDTO.rating,
            art: comicheftDTO.art,
            preis: comicheftDTO.preis,
            rabatt: comicheftDTO.rabatt,
            lieferbar: comicheftDTO.lieferbar,
            datum: comicheftDTO.datum,
            homepage: comicheftDTO.homepage,
            schlagwoerter: comicheftDTO.schlagwoerter,
            titel,
            abbildungen,
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        // Rueckwaertsverweis
        comicheft.titel.comicheft = comicheft;
        return comicheft;
    }

    #comicheftUpdateDtoToComicheft(comicheftDTO: ComicheftUpdateDTO): Comicheft {
        return {
            id: undefined,
            version: undefined,
            isbn: comicheftDTO.isbn,
            rating: comicheftDTO.rating,
            art: comicheftDTO.art,
            preis: comicheftDTO.preis,
            rabatt: comicheftDTO.rabatt,
            lieferbar: comicheftDTO.lieferbar,
            datum: comicheftDTO.datum,
            homepage: comicheftDTO.homepage,
            schlagwoerter: comicheftDTO.schlagwoerter,
            titel: undefined,
            abbildungen: undefined,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }

    #errorMsgCreateComicheft(err: CreateError) {
        switch (err.type) {
            case 'IsbnExists': {
                return `Die ISBN ${err.isbn} existiert bereits`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }

    #errorMsgUpdateComicheft(err: UpdateError) {
        switch (err.type) {
            case 'ComicheftNotExists': {
                return `Es gibt kein Comicheft mit der ID ${err.id}`;
            }
            case 'VersionInvalid': {
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            }
            case 'VersionOutdated': {
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }
}
