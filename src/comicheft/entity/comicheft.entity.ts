// Nest unterstützt verschiedene Werkzeuge fuer OR-Mapping
// https://docs.nestjs.com/techniques/database
//  * TypeORM     https://typeorm.io
//  * Sequelize   https://sequelize.org
//  * Knex        https://knexjs.org

// TypeORM unterstützt die Patterns
//  * "Data Mapper" und orientiert sich an Hibernate (Java), Doctrine (PHP) und Entity Framework (C#)
//  * "Active Record" und orientiert sich an Mongoose (JavaScript)

// TypeORM unterstützt u.a. die DB-Systeme
//  * Postgres
//  * MySQL
//  * SQLite durch sqlite3 und better-sqlite3
//  * Oracle
//  * Microsoft SQL Server
//  * SAP Hana
//  * Cloud Spanner von Google

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { Abbildung } from './abbildung.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { DecimalTransformer } from './decimal-transformer.js';
import { Titel } from './titel.entity.js';
import { dbType } from '../../config/dbtype.js';

/**
 * Alias-Typ für gültige Strings bei der Art eines Comicheftes.
 */
export type ComicheftArt = 'DRUCKAUSGABE' | 'KINDLE';

/**
 * Entity-Klasse zu einem relationalen Tabelle
 */
// https://typeorm.io/entities
@Entity()
export class Comicheft {
    @Column('int')
    // https://typeorm.io/entities#primary-columns
    // CAVEAT: zuerst @Column() und erst dann @PrimaryGeneratedColumn()
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar', { unique: true, length: 16 })
    @ApiProperty({ example: '0-0070-0644-6', type: String })
    readonly isbn!: string;

    @Column('int')
    @ApiProperty({ example: 5, type: Number })
    readonly rating: number | undefined;

    @Column('varchar', { length: 12 })
    @ApiProperty({ example: 'DRUCKAUSGABE', type: String })
    readonly art: ComicheftArt | undefined;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 1, type: Number })
    // statt number ggf. Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: number;

    @Column('decimal', {
        precision: 4,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 0.1, type: Number })
    readonly rabatt: number | undefined;

    @Column('boolean')
    @ApiProperty({ example: true, type: Boolean })
    readonly lieferbar: boolean | undefined;

    // das Temporal-API ab ES2022 wird von TypeORM noch nicht unterstuetzt
    @Column('date')
    @ApiProperty({ example: '2021-01-31' })
    readonly datum: Date | string | undefined;

    @Column('varchar', { length: 40 })
    @ApiProperty({ example: 'https://test.de/', type: String })
    readonly homepage: string | undefined;

    // https://typeorm.io/entities#simple-array-column-type
    @Column('simple-array')
    readonly schlagwoerter: string[] | undefined;

    // undefined wegen Updates
    @OneToOne(() => Titel, (titel) => titel.comicheft, {
        cascade: ['insert', 'remove'],
    })
    readonly titel: Titel | undefined;

    // undefined wegen Updates
    @OneToMany(() => Abbildung, (abbildung) => abbildung.comicheft, {
        cascade: ['insert', 'remove'],
    })
    readonly abbildungen: Abbildung[] | undefined;

    // https://typeorm.io/entities#special-columns
    // https://typeorm.io/entities#column-types-for-postgres
    // https://typeorm.io/entities#column-types-for-mysql--mariadb
    // https://typeorm.io/entities#column-types-for-sqlite--cordova--react-native--expo
    // 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    // SQLite:
    // @CreateDateColumn({ type: 'datetime' })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    // SQLite:
    // @UpdateDateColumn({ type: 'datetime' })
    readonly aktualisiert: Date | undefined;
}
