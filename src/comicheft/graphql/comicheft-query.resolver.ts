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
import { Args, Query, Resolver } from '@nestjs/graphql';
import { BadUserInputError } from './errors.js';
import { type Comicheft } from '../entity/comicheft.entity.js';
import { ComicheftReadService } from '../service/comicheft-read.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UseInterceptors } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';

export type ComicheftDTO = Omit<
    Comicheft,
    'abbildungen' | 'aktualisiert' | 'erzeugt'
>;
export interface IdInput {
    id: number;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class ComicheftQueryResolver {
    readonly #service: ComicheftReadService;

    readonly #logger = getLogger(ComicheftQueryResolver.name);

    constructor(service: ComicheftReadService) {
        this.#service = service;
    }

    @Query()
    async comicheft(@Args() idInput: IdInput) {
        const { id } = idInput;
        this.#logger.debug('findById: id=%d', id);

        const comicheft = await this.#service.findById({ id });
        if (comicheft === undefined) {
            // https://www.apollographql.com/docs/apollo-server/data/errors
            throw new BadUserInputError(
                `Es wurde kein Comicheft mit der ID ${id} gefunden.`,
            );
        }
        const comicheftDTO = this.#toComicheftDTO(comicheft);
        this.#logger.debug('findById: comicheftDTO=%o', comicheftDTO);
        return comicheftDTO;
    }

    @Query()
    async buecher(@Args() titel: { titel: string } | undefined) {
        const titelStr = titel?.titel;
        this.#logger.debug('find: titel=%s', titelStr);
        const suchkriterium = titelStr === undefined ? {} : { titel: titelStr };
        const comichefte = await this.#service.find(suchkriterium);
        if (comichefte.length === 0) {
            throw new BadUserInputError('Es wurden keine Buecher gefunden.');
        }

        const comichefteDTO = comichefte.map((comicheft) =>
            this.#toComicheftDTO(comicheft),
        );
        this.#logger.debug('find: comichefteDTO=%o', comichefteDTO);
        return comichefteDTO;
    }

    #toComicheftDTO(comicheft: Comicheft): ComicheftDTO {
        return {
            id: comicheft.id,
            version: comicheft.version,
            isbn: comicheft.isbn,
            rating: comicheft.rating,
            art: comicheft.art,
            preis: comicheft.preis,
            rabatt: comicheft.rabatt,
            lieferbar: comicheft.lieferbar,
            datum: comicheft.datum,
            homepage: comicheft.homepage,
            schlagwoerter: comicheft.schlagwoerter,
            titel: comicheft.titel,
        };
    }
}
