/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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

/**
 * Das Modul besteht aus der Klasse {@linkcode ComicheftWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import {
    type ComicheftNotExists,
    type CreateError,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { type DeleteResult, Repository } from 'typeorm';
import { Abbildung } from '../entity/abbildung.entity.js';
import { Comicheft } from '../entity/comicheft.entity.js';
import { ComicheftReadService } from './comicheft-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import RE2 from 're2';
import { Titel } from '../entity/titel.entity.js';
import { getLogger } from '../../logger/logger.js';


/** Typdefinitionen zum Aktualisieren eines Buches mit `update`. */
export interface UpdateParams {
    /** ID des zu aktualisierenden Buches. */
    id: number | undefined;
    /** Buch-Objekt mit den aktualisierten Werten. */
    comicheft: Comicheft;
    /** Versionsnummer für die aktualisierenden Werte. */
    version: string;
}

/**
 * Die Klasse `BuchWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class ComicheftWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Comicheft>;

    readonly #readService: ComicheftReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(ComicheftWriteService.name);

    constructor(
        @InjectRepository(Comicheft) repo: Repository<Comicheft>,
        readService: ComicheftReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Buch soll angelegt werden.
     * @param comicheft Das neu abzulegende Buch
     * @returns Die ID des neu angelegten Buches oder im Fehlerfall
     * [CreateError](../types/buch_service_errors.CreateError.html)
     */
    async create(comicheft: Comicheft): Promise<CreateError | number> {
        this.#logger.debug('create: comicheft=%o', comicheft);
        const validateResult = await this.#validateCreate(comicheft);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const comicheftDb = await this.#repo.save(comicheft); // implizite Transaktion
        this.#logger.debug('create: comicheftDb=%o', comicheftDb);

        await this.#sendmail(comicheftDb);

        return comicheftDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein vorhandenes Buch soll aktualisiert werden.
     * @param comicheft Das zu aktualisierende Buch
     * @param id ID des zu aktualisierenden Buchs
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall [UpdateError](../types/buch_service_errors.UpdateError.html)
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async update({
        id,
        comicheft,
        version,
    }: UpdateParams): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%d, comicheft=%o, version=%s',
            id,
            comicheft,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            return { type: 'ComicheftNotExists', id };
        }

        const validateResult = await this.#validateUpdate(comicheft, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Comicheft)) {
            return validateResult;
        }

        const comicheftNeu = validateResult;
        const merged = this.#repo.merge(comicheftNeu, comicheft);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein Buch wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Buches
     * @returns true, falls das Buch vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const comicheft = await this.#readService.findById({
            id,
            mitAbbildungen: true,
        });
        if (comicheft === undefined) {
            return false;
        }

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Buch zur gegebenen ID mit Titel und Abb. asynchron loeschen

            // TODO "cascade" funktioniert nicht beim Loeschen
            const titelId = comicheft.titel?.id;
            if (titelId !== undefined) {
                await transactionalMgr.delete(Titel, titelId);
            }
            const abbildungen = comicheft.abbildungen ?? [];
            for (const abbildung of abbildungen) {
                await transactionalMgr.delete(Abbildung, abbildung.id);
            }

            deleteResult = await transactionalMgr.delete(Comicheft, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate(comicheft: Comicheft): Promise<CreateError | undefined> {
        this.#logger.debug('#validateCreate: comicheft=%o', comicheft);

        const { isbn } = comicheft;
        const comichefte = await this.#readService.find({ isbn: isbn }); // eslint-disable-line object-shorthand
        if (comichefte.length > 0) {
            return { type: 'IsbnExists', isbn };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #sendmail(comicheft: Comicheft) {
        const subject = `Neues Buch ${comicheft.id}`;
        const titel = comicheft.titel?.titel ?? 'N/A';
        const body = `Das Buch mit dem Titel <strong>${titel}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        comicheft: Comicheft,
        id: number,
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

    async #findByIdAndCheckVersion(
        id: number,
        version: number,
    ): Promise<Comicheft | ComicheftNotExists | VersionOutdated> {
        const comicheftDb = await this.#readService.findById({ id });
        if (comicheftDb === undefined) {
            const result: ComicheftNotExists = { type: 'ComicheftNotExists', id };
            this.#logger.debug('#checkIdAndVersion: ComicheftNotExists=%o', result);
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
