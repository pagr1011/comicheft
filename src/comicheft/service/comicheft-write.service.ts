/* eslint-disable max-lines */
/**
 * Das Modul besteht aus der Klasse {@linkcode ComicheftWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { Comicheft, removeIsbnDash } from '../entity/comicheft.entity.js';
import {
    type ComicheftNotExists,
    type CreateError,
    type TitelExists,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { type DeleteResult, Repository } from 'typeorm';
import { ComicheftReadService } from './comicheft-read.service.js';
import { ComicheftValidationService } from './comicheft-validation.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import RE2 from 're2';
import { Schlagwort } from '../entity/schlagwort.entity.js';
import { getLogger } from '../../logger/logger.js';
import { v4 as uuid } from 'uuid';

/**
 * Die Klasse `ComicheftWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class ComicheftWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Comicheft>;

    readonly #readService: ComicheftReadService;

    readonly #validationService: ComicheftValidationService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(ComicheftWriteService.name);

    // eslint-disable-next-line max-params
    constructor(
        @InjectRepository(Comicheft) repo: Repository<Comicheft>,
        readService: ComicheftReadService,
        validationService: ComicheftValidationService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#validationService = validationService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Comicheft soll angelegt werden.
     * @param comicheft Das neu abzulegende Comicheft
     * @returns Die ID des neu angelegten Comicheftes oder im Fehlerfall
     * [CreateError](../types/comicheft_service_errors.CreateError.html)
     */
    async create(comicheft: Comicheft): Promise<CreateError | string> {
        this.#logger.debug('create: comicheft=%o', comicheft);
        const validateResult = await this.#validateCreate(comicheft);
        if (validateResult !== undefined) {
            return validateResult;
        }

        comicheft.id = uuid(); // eslint-disable-line require-atomic-updates
        comicheft.schlagwoerter.forEach((schlagwort) => {
            schlagwort.id = uuid();
        });

        // implizite Transaktion
        const comicheftDb = await this.#repo.save(removeIsbnDash(comicheft)); // implizite Transaktion
        this.#logger.debug('create: comicheftDb=%o', comicheftDb);

        await this.#sendmail(comicheftDb);

        return comicheftDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein vorhandenes Comicheft soll aktualisiert werden.
     * @param comicheft Das zu aktualisierende Comicheft
     * @param id ID des zu aktualisierenden Comicheft
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall [UpdateError](../types/comicheft_service_errors.UpdateError.html)
     */
    async update(
        id: string | undefined,
        comicheft: Comicheft,
        version: string,
    ): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%s, comicheft=%o, version=%s',
            id,
            comicheft,
            version,
        );
        if (id === undefined || !this.#validationService.validateId(id)) {
            this.#logger.debug('update: Keine gueltige ID');
            return { type: 'ComicheftNotExists', id };
        }

        const validateResult = await this.#validateUpdate(
            comicheft,
            id,
            version,
        );
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Comicheft)) {
            return validateResult;
        }

        const comicheftNeu = validateResult;
        const merged = this.#repo.merge(
            comicheftNeu,
            removeIsbnDash(comicheft),
        );
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein Comicheft wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Comicheftes
     * @returns true, falls das Comicheft vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: string) {
        this.#logger.debug('delete: id=%s', id);
        if (!this.#validationService.validateId(id)) {
            this.#logger.debug('delete: Keine gueltige ID');
            return false;
        }

        const comicheft = await this.#readService.findById(id);
        if (comicheft === undefined) {
            return false;
        }

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Comicheft zur gegebenen ID asynchron loeschen
            const { schlagwoerter } = comicheft;
            const schlagwoerterIds = schlagwoerter.map(
                (schlagwort) => schlagwort.id,
            );
            const deleteResultSchlagwoerter = await transactionalMgr.delete(
                Schlagwort,
                schlagwoerterIds,
            );
            this.#logger.debug(
                'delete: deleteResultSchlagwoerter=%o',
                deleteResultSchlagwoerter,
            );
            deleteResult = await transactionalMgr.delete(Comicheft, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate(
        comicheft: Comicheft,
    ): Promise<CreateError | undefined> {
        const validateResult = this.#validationService.validate(comicheft);
        if (validateResult !== undefined) {
            const messages = validateResult;
            this.#logger.debug('#validateCreate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const { titel } = comicheft;
        let comichefte = await this.#readService.find({ titel: titel }); // eslint-disable-line object-shorthand
        if (comichefte.length > 0) {
            return { type: 'TitelExists', titel };
        }

        const { isbn } = comicheft;
        comichefte = await this.#readService.find({ isbn: isbn }); // eslint-disable-line object-shorthand
        if (comichefte.length > 0) {
            return { type: 'IsbnExists', isbn };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #sendmail(comicheft: Comicheft) {
        const subject = `Neues Comicheft ${comicheft.id}`;
        const body = `Das Comicheft mit dem Titel <strong>${comicheft.titel}</strong> ist angelegt`;
        await this.#mailService.sendmail(subject, body);
    }

    async #validateUpdate(
        comicheft: Comicheft,
        id: string,
        versionStr: string,
    ): Promise<Comicheft | UpdateError> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: comicheft=%o, version=%s',
            comicheft,
            version,
        );

        const validateResult = this.#validationService.validate(comicheft);
        if (validateResult !== undefined) {
            const messages = validateResult;
            this.#logger.debug('#validateUpdate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const resultTitel = await this.#checkTitelExists(comicheft);
        if (resultTitel !== undefined && resultTitel.id !== id) {
            return resultTitel;
        }

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !ComicheftWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #checkTitelExists(
        comicheft: Comicheft,
    ): Promise<TitelExists | undefined> {
        const { titel } = comicheft;

        const comichefte = await this.#readService.find({ titel: titel }); // eslint-disable-line object-shorthand
        if (comichefte.length > 0) {
            const [gefundenesComicheft] = comichefte;
            const { id } = gefundenesComicheft!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            this.#logger.debug('#checkTitelExists: id=%s', id);
            return { type: 'TitelExists', titel, id: id! }; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        }

        this.#logger.debug('#checkTitelExists: ok');
        return undefined;
    }

    async #findByIdAndCheckVersion(
        id: string,
        version: number,
    ): Promise<Comicheft | ComicheftNotExists | VersionOutdated> {
        const comicheftDb = await this.#readService.findById(id);
        if (comicheftDb === undefined) {
            const result: ComicheftNotExists = {
                type: 'ComicheftNotExists',
                id,
            };
            this.#logger.debug(
                '#checkIdAndVersion: ComicheftNotExists=%o',
                result,
            );
            return result;
        }

        // nullish coalescing
        const versionDb = comicheftDb.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return comicheftDb;
    }
}
/* eslint-enable max-lines */
