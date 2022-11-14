import { Args, Query, Resolver } from '@nestjs/graphql';
import { type Comicheft } from '../entity/comicheft.entity.js';
import { ComicheftReadService } from '../service/comicheft-read.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';
import { getLogger } from '../../logger/logger.js';

export type ComicheftDTO = Omit<
    Comicheft,
    'aktualisiert' | 'erzeugt' | 'schlagwoerter'
> & { schlagwoerter: string[] };
export interface IdInput {
    id: string;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class ComicheftQueryResolver {
    readonly #service: ComicheftReadService;

    readonly #logger = getLogger(ComicheftQueryResolver.name);

    constructor(service: ComicheftReadService) {
        this.#service = service;
    }

    @Query('comicheft')
    async findById(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('findById: id=%s', idStr);

        const comicheft = await this.#service.findById(idStr);
        if (comicheft === undefined) {
            // UserInputError liefert Statuscode 200
            // Weitere Error-Klasse in apollo-server-errors:
            // SyntaxError, ValidationError, AuthenticationError, ForbiddenError,
            // PersistedQuery, PersistedQuery
            // https://www.apollographql.com/blog/graphql/error-handling/full-stack-error-handling-with-graphql-apollo
            throw new UserInputError(
                `Es wurde kein Comicheft mit der ID ${idStr} gefunden.`,
            );
        }
        const comicheftDTO = this.#toComicheftDTO(comicheft);
        this.#logger.debug('findById: comicheftDTO=%o', comicheftDTO);
        return comicheftDTO;
    }

    @Query('comichefte')
    async find(@Args() titel: { titel: string } | undefined) {
        const titelStr = titel?.titel;
        this.#logger.debug('find: titel=%s', titelStr);
        const suchkriterium = titelStr === undefined ? {} : { titel: titelStr };
        const comichefte = await this.#service.find(suchkriterium);
        if (comichefte.length === 0) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError('Es wurden keine Comichefte gefunden.');
        }

        const comichefteDTO = comichefte.map((comicheft) =>
            this.#toComicheftDTO(comicheft),
        );
        this.#logger.debug('find: comichefteDTO=%o', comichefteDTO);
        return comichefteDTO;
    }

    #toComicheftDTO(comicheft: Comicheft) {
        const schlagwoerter = comicheft.schlagwoerter.map(
            (schlagwort) => schlagwort.schlagwort!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        );
        const comicheftDTO: ComicheftDTO = {
            id: comicheft.id,
            version: comicheft.version,
            titel: comicheft.titel,
            rating: comicheft.rating,
            art: comicheft.art,
            verlag: comicheft.verlag,
            preis: comicheft.preis,
            rabatt: comicheft.rabatt,
            lieferbar: comicheft.lieferbar,
            datum: comicheft.datum,
            isbn: comicheft.isbn,
            homepage: comicheft.homepage,
            schlagwoerter,
        };
        return comicheftDTO;
    }
}
