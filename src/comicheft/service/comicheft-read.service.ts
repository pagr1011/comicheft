/**
 * Das Modul besteht aus der Klasse {@linkcode ComicheftReadService}.
 * @packageDocumentation
 */

import {
    Comicheft,
    type ComicheftArt,
    type Verlag,
} from './../entity/comicheft.entity.js';
import { ComicheftValidationService } from './comicheft-validation.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { QueryBuilder } from './query-builder.js';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';

export interface Suchkriterien {
    readonly titel?: string;
    readonly rating?: number;
    readonly art?: ComicheftArt;
    readonly verlag?: Verlag;
    readonly preis?: number;
    readonly rabatt?: number;
    readonly lieferbar?: boolean;
    readonly datum?: string;
    readonly isbn?: string;
    readonly homepage?: string;
    readonly javascript?: boolean;
    readonly typescript?: boolean;
}

/**
 * Die Klasse `ComicheftReadService` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class ComicheftReadService {
    readonly #repo: Repository<Comicheft>;

    readonly #comicheftProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #validationService: ComicheftValidationService;

    readonly #logger = getLogger(ComicheftReadService.name);

    constructor(
        @InjectRepository(Comicheft) repo: Repository<Comicheft>,
        queryBuilder: QueryBuilder,
        validationService: ComicheftValidationService,
    ) {
        this.#repo = repo;
        const comicheftDummy = new Comicheft();
        this.#comicheftProps = Object.getOwnPropertyNames(comicheftDummy);
        this.#queryBuilder = queryBuilder;
        this.#validationService = validationService;
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
    async findById(id: string) {
        this.#logger.debug('findById: id=%s', id);

        if (!this.#validationService.validateId(id)) {
            this.#logger.debug('findById: Ungueltige ID');
            return;
        }

        // https://typeorm.io/working-with-repository
        // Das Resultat ist undefined, falls kein Datensatz gefunden
        // Lesen: Keine Transaktion erforderlich
        const comicheft = await this.#queryBuilder.buildId(id).getOne();
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
            return this.#findAll();
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return this.#findAll();
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

    async #findAll() {
        const comichefte = await this.#repo.find();
        this.#logger.debug('#findAll: alle comichefte=%o', comichefte);
        return comichefte;
    }

    #checkKeys(keys: string[]) {
        // Ist jedes Suchkriterium auch eine Property von Comicheft oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#comicheftProps.includes(key) &&
                key !== 'javascript' &&
                key !== 'typescript'
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
