/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { FindOptionsUtils, Repository, type SelectQueryBuilder } from 'typeorm';
import { Comicheft } from '../entity/comicheft.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/db.js';

/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #comicheftAlias = `${Comicheft.name
        .charAt(0)
        .toLowerCase()}${Comicheft.name.slice(1)}`;

    readonly #repo: Repository<Comicheft>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Comicheft) repo: Repository<Comicheft>) {
        this.#repo = repo;
    }

    /**
     * Ein Comicheft mit der ID suchen.
     * @param id ID des gesuchten Comicheftes
     * @returns QueryBuilder
     */
    buildId(id: string) {
        const queryBuilder = this.#repo.createQueryBuilder(
            this.#comicheftAlias,
        );
        // Option { eager: true } in der Entity-Klasse wird nur bei find-Methoden des Repositories beruecksichtigt
        // https://github.com/typeorm/typeorm/issues/8292#issuecomment-1036991980
        // https://github.com/typeorm/typeorm/issues/7142
        FindOptionsUtils.joinEagerRelations(
            queryBuilder,
            queryBuilder.alias,
            this.#repo.metadata,
        );

        queryBuilder.where(`${this.#comicheftAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    // eslint-disable-next-line max-lines-per-function
    build(suchkriterien: Record<string, any>) {
        this.#logger.debug('build: suchkriterien=%o', suchkriterien);

        let queryBuilder = this.#repo.createQueryBuilder(this.#comicheftAlias);
        // Option { eager: true } in der Entity-Klasse wird nur bei find-Methoden des Repositories beruecksichtigt
        // https://github.com/typeorm/typeorm/issues/8292#issuecomment-1036991980
        // https://github.com/typeorm/typeorm/issues/7142
        FindOptionsUtils.joinEagerRelations(
            queryBuilder,
            queryBuilder.alias,
            this.#repo.metadata,
        );

        // z.B. { titel: 'a', rating: 5, javascript: true }
        // Rest Properties fuer anfaengliche WHERE-Klausel
        // type-coverage:ignore-next-line
        const { titel, isbn, javascript, typescript, ...props } = suchkriterien;

        queryBuilder = this.#buildSchlagwoerter(
            queryBuilder,
            javascript, // eslint-disable-line @typescript-eslint/no-unsafe-argument
            typescript, // eslint-disable-line @typescript-eslint/no-unsafe-argument
        );

        let useWhere = true;

        // Titel in der Query: Teilstring des Titels und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (titel !== undefined && typeof titel === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#comicheftAlias}.titel ${ilike} :titel`,
                { titel: `%${titel}%` },
            );
            useWhere = false;
        }

        // type-coverage:ignore-next-line
        if (isbn !== undefined && typeof isbn === 'string') {
            // "-" aus ISBN-Nummer entfernen, da diese nicht abgespeichert sind
            const isbnOhne = isbn.replaceAll('-', '');
            const param = {
                isbn: isbnOhne,
            };
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#comicheftAlias}.isbn = :isbn`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#comicheftAlias}.isbn = :isbn`,
                      param,
                  );
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = props[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#comicheftAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#comicheftAlias}.${key} = :${key}`,
                      param,
                  );
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }

    #buildSchlagwoerter(
        queryBuilder: SelectQueryBuilder<Comicheft>,
        javascript: string | undefined,
        typescript: string | undefined,
    ) {
        // Schlagwort JAVASCRIPT aus der 2. Tabelle
        if (javascript === 'true') {
            // https://typeorm.io/select-query-builder#inner-and-left-joins
            // eslint-disable-next-line no-param-reassign
            queryBuilder = queryBuilder.innerJoinAndSelect(
                `${this.#comicheftAlias}.schlagwoerter`,
                'swJS',
                'swJS.schlagwort = :javascript',
                { javascript: 'JAVASCRIPT' },
            );
        }
        if (typescript === 'true') {
            // eslint-disable-next-line no-param-reassign
            queryBuilder = queryBuilder.innerJoinAndSelect(
                `${this.#comicheftAlias}.schlagwoerter`,
                'swTS',
                'swTS.schlagwort = :typescript',
                { typescript: 'TYPESCRIPT' },
            );
        }
        return queryBuilder;
    }
}
