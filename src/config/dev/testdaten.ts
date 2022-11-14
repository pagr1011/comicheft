/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { type Comicheft } from '../../comicheft/entity/comicheft.entity.js';
import { type Schlagwort } from './../../comicheft/entity/schlagwort.entity.js';

// TypeORM kann keine SQL-Skripte ausfuehren

export const comichefte: Comicheft[] = [
    // -------------------------------------------------------------------------
    // L e s e n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000001',
        version: 0,
        titel: 'Marsupilami',
        rating: 4,
        art: 'DRUCKAUSGABE',
        verlag: 'ZEIT_VERLAG',
        preis: 24.7,
        rabatt: 0.89,
        lieferbar: true,
        datum: new Date('2022-02-01'),
        // "Konzeption und Realisierung eines aktiven Datenbanksystems"
        isbn: '9783897225831',
        homepage: 'https://marsupilami.en/',
        schlagwoerter: [],
        erzeugt: new Date('2022-02-01'),
        aktualisiert: new Date('2022-02-01'),
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        version: 0,
        titel: 'Asterix',
        rating: 2,
        art: 'KINDLE',
        verlag: 'BOCOLA_VERLAG',
        preis: 2.23,
        rabatt: 0.02,
        lieferbar: true,
        datum: new Date('2022-02-29'),
        // "Verteilte Komponenten und Datenbankanbindung"
        isbn: '9783827315526',
        homepage: 'https://asterixundso.com/',
        schlagwoerter: [],
        erzeugt: new Date('2022-02-29'),
        aktualisiert: new Date('2022-02-29'),
    },
    {
        id: '00000000-0000-0000-0000-000000000003',
        version: 0,
        titel: 'Persepolis',
        rating: 1,
        art: 'DRUCKAUSGABE',
        verlag: 'ZEIT_VERLAG',
        preis: 7.1,
        rabatt: 0.013,
        lieferbar: true,
        datum: new Date('2022-02-03'),
        // "Design Patterns"
        isbn: '9780201633610',
        homepage: 'https://marjane.com/',
        schlagwoerter: [],
        erzeugt: new Date('2022-02-03'),
        aktualisiert: new Date('2022-02-03'),
    },
    // -------------------------------------------------------------------------
    // A e n d e r n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000040',
        version: 0,
        titel: 'Superman',
        rating: 3,
        art: 'DRUCKAUSGABE',
        verlag: 'BOCOLA_VERLAG',
        preis: 1944.4,
        rabatt: 0.001,
        lieferbar: true,
        datum: new Date('2022-02-04'),
        isbn: '0007097328',
        homepage: 'https://legacy.com/',
        schlagwoerter: [],
        erzeugt: new Date('2022-02-04'),
        aktualisiert: new Date('2022-02-04'),
    },
    // -------------------------------------------------------------------------
    // L o e s c h e n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000050',
        version: 0,
        titel: 'Vendetta',
        rating: 2,
        art: 'KINDLE',
        verlag: 'ZEIT_VERLAG',
        preis: 2.5,
        rabatt: 0.012,
        lieferbar: true,
        datum: new Date('2022-02-05'),
        // "Maschinelle Lernverfahren zur Behandlung von Bonitätsrisiken im Mobilfunkgeschäft"
        isbn: '9783824404810',
        homepage: 'https://vendetta.es/',
        schlagwoerter: [],
        erzeugt: new Date('2022-02-05'),
        aktualisiert: new Date('2022-02-05'),
    },
    {
        id: '00000000-0000-0000-0000-000000000060',
        version: 0,
        titel: 'Garfield',
        rating: 2,
        art: 'KINDLE',
        verlag: 'ZEIT_VERLAG',
        preis: 6.7,
        rabatt: 0.01,
        lieferbar: true,
        datum: new Date('2022-02-06'),
        // "Software pioneers",
        isbn: '9783540430810',
        homepage: 'https://lasagne.it/',
        schlagwoerter: [],
        erzeugt: new Date('2022-02-06'),
        aktualisiert: new Date('2022-02-06'),
    },
];

export const schlagwoerter: Schlagwort[] = [
    {
        id: '00000000-0000-0000-0000-010000000001',
        comicheft: comichefte[0],
        schlagwort: 'JAVASCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-020000000001',
        comicheft: comichefte[1],
        schlagwort: 'TYPESCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-030000000001',
        comicheft: comichefte[2],
        schlagwort: 'JAVASCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-030000000002',
        comicheft: comichefte[2],
        schlagwort: 'TYPESCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-500000000001',
        comicheft: comichefte[4],
        schlagwort: 'TYPESCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-600000000001',
        comicheft: comichefte[5],
        schlagwort: 'TYPESCRIPT',
    },
];

comichefte[0]!.schlagwoerter.push(schlagwoerter[0]!);
comichefte[1]!.schlagwoerter.push(schlagwoerter[1]!);
comichefte[2]!.schlagwoerter.push(schlagwoerter[2]!, schlagwoerter[3]!);
comichefte[4]!.schlagwoerter.push(schlagwoerter[4]!);
comichefte[5]!.schlagwoerter.push(schlagwoerter[5]!);

/* eslint-enable @typescript-eslint/no-non-null-assertion */
