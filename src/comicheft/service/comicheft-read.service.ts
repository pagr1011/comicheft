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
 * Das Modul besteht aus der Klasse {@linkcode ComicheftReadService}.
 * @packageDocumentation
 */

import { Comicheft, type ComicheftArt } from './../entity/comicheft.entity.js';
import { Injectable } from '@nestjs/common';
import { QueryBuilder } from './query-builder.js';
import RE2 from 're2';
import { getLogger } from '../../logger/logger.js';

/**
 * Typdefinition für `findById`
 */
export interface FindByIdParams {
    /** ID des gesuchten Comichefts */
    id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    mitAbbildungen?: boolean;
}
export interface Suchkriterien {
    readonly isbn?: string;
    readonly rating?: number;
    readonly art?: ComicheftArt;
    readonly preis?: number;
    readonly rabatt?: number;
    readonly lieferbar?: boolean;
    readonly datum?: string;
    readonly homepage?: string;
    readonly batman?: boolean;
    readonly ironman?: boolean;
    readonly titel?: string;
}

/**
 * Die Klasse `ComicheftReadService` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class ComicheftReadService {
    static readonly ID_PATTERN = new RE2('^[1-9][\\d]*$');

    readonly #comicheftProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(ComicheftReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const comicheftDummy = new Comicheft();
        this.#comicheftProps = Object.getOwnPropertyNames(comicheftDummy);
        this.#queryBuilder = queryBuilder;
    }

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C# und Mono<> aus Project Reactor
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Comicheft asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Comicheftes
     * @returns Das gefundene Comicheft vom Typ [Comicheft](comicheft_entity_comicheft_entity.Comicheft.html) oder undefined
     *          in einem Promise aus ES2015 (vgl.: Mono aus Project Reactor oder
     *          Future aus Java)
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async findById({ id, mitAbbildungen = false }: FindByIdParams) {
        this.#logger.debug('findById: id=%d', id);

        // https://typeorm.io/working-with-repository
        // Das Resultat ist undefined, falls kein Datensatz gefunden
        // Lesen: Keine Transaktion erforderlich
        const comicheft = await this.#queryBuilder
            .buildId({ id, mitAbbildungen })
            .getOne();
        if (comicheft === null) {
            this.#logger.debug('findById: Kein Comicheft gefunden');
            return;
        }

        this.#logger.debug('findById: comicheft=%o', comicheft);
        return comicheft;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen Büchern. Ggf. ist das Array leer.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        // Keine Suchkriterien?
        if (suchkriterien === undefined) {
            const comichefte = await this.#queryBuilder.build({}).getMany();
            return comichefte;
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            const comichefte = await this.#queryBuilder
                .build(suchkriterien)
                .getMany();
            return comichefte;
        }

        // Falsche Namen fuer Suchkriterien?
        if (!this.#checkKeys(keys)) {
            return [];
        }

        // QueryBuilder https://typeorm.io/select-query-builder
        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const comichefte = await this.#queryBuilder
            .build(suchkriterien)
            .getMany();
        this.#logger.debug('find: comichefte=%o', comichefte);

        return comichefte;
    }

    #checkKeys(keys: string[]) {
        // Ist jedes Suchkriterium auch eine Property von Comicheft oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#comicheftProps.includes(key) &&
                key !== 'batman' &&
                key !== 'ironman'
            ) {
                this.#logger.debug(
                    '#find: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
