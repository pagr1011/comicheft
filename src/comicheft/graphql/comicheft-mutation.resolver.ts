import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { type Comicheft } from '../entity/comicheft.entity.js';
import { ComicheftWriteService } from '../service/comicheft-write.service.js';
import { type IdInput } from './comicheft-query.resolver.js';
//import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
//import { Roles } from '../../security/auth/roles/roles.decorator.js';
//import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { type Schlagwort } from '../entity/schlagwort.entity.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';
import { getLogger } from '../../logger/logger.js';

type ComicheftCreateDTO = Omit<
    Comicheft,
    'aktualisiert' | 'erzeugt' | 'id' | 'schlagwoerter' | 'version'
> & { schlagwoerter: string[] };
type ComicheftUpdateDTO = Omit<
    Comicheft,
    'aktualisiert' | 'erzeugt' | 'schlagwoerter'
>;

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
//@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class ComicheftMutationResolver {
    readonly #service: ComicheftWriteService;

    readonly #logger = getLogger(ComicheftMutationResolver.name);

    constructor(service: ComicheftWriteService) {
        this.#service = service;
    }

    @Mutation()
    // @Roles('admin', 'mitarbeiter')
    async create(@Args('input') comicheftDTO: ComicheftCreateDTO) {
        this.#logger.debug('create: comicheftDTO=%o', comicheftDTO);

        const result = await this.#service.create(
            this.#dtoToComicheft(comicheftDTO),
        );
        this.#logger.debug('createComicheft: result=%o', result);

        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError(
                this.#errorMsgCreateComicheft(result as CreateError),
            );
        }
        return result;
    }

    @Mutation()
    //@Roles('admin', 'mitarbeiter')
    async update(@Args('input') comicheft: ComicheftUpdateDTO) {
        this.#logger.debug('update: comicheft=%o', comicheft);
        const versionStr = `"${comicheft.version?.toString()}"`;

        const result = await this.#service.update(
            comicheft.id,
            comicheft as Comicheft,
            versionStr,
        );
        if (typeof result === 'object') {
            throw new UserInputError(this.#errorMsgUpdateComicheft(result));
        }
        this.#logger.debug('updateComicheft: result=%d', result);
        return result;
    }

    @Mutation()
    //@Roles('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteComicheft: result=%s', result);
        return result;
    }

    #dtoToComicheft(comicheftDTO: ComicheftCreateDTO): Comicheft {
        const comicheft: Comicheft = {
            id: undefined,
            version: undefined,
            titel: comicheftDTO.titel,
            rating: comicheftDTO.rating,
            art: comicheftDTO.art,
            verlag: comicheftDTO.verlag,
            preis: comicheftDTO.preis,
            rabatt: comicheftDTO.rabatt,
            lieferbar: comicheftDTO.lieferbar,
            datum: comicheftDTO.datum,
            isbn: comicheftDTO.isbn,
            homepage: comicheftDTO.homepage,
            schlagwoerter: [],
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        comicheftDTO.schlagwoerter.forEach((s) => {
            const schlagwort: Schlagwort = {
                id: undefined,
                schlagwort: s,
                comicheft,
            };
            comicheft.schlagwoerter.push(schlagwort);
        });

        return comicheft;
    }

    #errorMsgCreateComicheft(err: CreateError) {
        switch (err.type) {
            case 'ConstraintViolations': {
                return err.messages.join(' ');
            }
            case 'TitelExists': {
                return `Der Titel "${err.titel}" existiert bereits`;
            }
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
            case 'ConstraintViolations': {
                return err.messages.join(' ');
            }
            case 'TitelExists': {
                return `Der Titel "${err.titel}" existiert bereits`;
            }
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
