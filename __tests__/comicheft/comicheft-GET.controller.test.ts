import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type ComichefteModel } from '../../src/comicheft/rest/comicheft-get.controller.js';
import { HttpStatus } from '@nestjs/common';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const titelVorhanden = 'a';
const titelNichtVorhanden = 'xx';
const schlagwortVorhanden = 'batman';
const schlagwortNichtVorhanden = 'spiderman';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// eslint-disable-next-line max-lines-per-function
describe('GET /rest', () => {
    let baseURL: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle Comichefte', async () => {
        // when
        const response: AxiosResponse<ComichefteModel> = await client.get('');

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        // eslint-disable-next-line no-underscore-dangle
        const { comichefte } = data._embedded;

        comichefte
            // eslint-disable-next-line no-underscore-dangle
            .map((comicheft) => comicheft._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'iu'));
            });
    });

    test('Comichefte mit einem Teil-Titel suchen', async () => {
        // given
        const params = { titel: titelVorhanden };

        // when
        const response: AxiosResponse<ComichefteModel> = await client.get('/', {
            params,
        });

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        // eslint-disable-next-line no-underscore-dangle
        const { comichefte } = data._embedded;

        // Jedes Comicheft hat einen Titel mit dem Teilstring 'a'
        comichefte
            .map((comicheft) => comicheft.titel)
            .forEach((titel) =>
                expect(titel.titel.toLowerCase()).toEqual(
                    expect.stringContaining(titelVorhanden),
                ),
            );
    });

    test('Comichefte zu einem nicht vorhandenen Teil-Titel suchen', async () => {
        // given
        const params = { titel: titelNichtVorhanden };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });

    test('Mind. 1 Comicheft mit vorhandenem Schlagwort', async () => {
        // given
        const params = { [schlagwortVorhanden]: 'true' };

        // when
        const response: AxiosResponse<ComichefteModel> = await client.get('/', {
            params,
        });

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        // JSON-Array mit mind. 1 JSON-Objekt
        expect(data).toBeDefined();

        // eslint-disable-next-line no-underscore-dangle
        const { comichefte } = data._embedded;

        // Jedes Comicheft hat im Array der Schlagwoerter z.B. "spiderman"
        comichefte
            .map((comicheft) => comicheft.schlagwoerter)
            .forEach((schlagwoerter) =>
                expect(schlagwoerter).toEqual(
                    expect.arrayContaining([schlagwortVorhanden.toUpperCase()]),
                ),
            );
    });

    test('Keine Comichefte zu einem nicht vorhandenen Schlagwort', async () => {
        // given
        const params = { [schlagwortNichtVorhanden]: 'true' };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });

    test('Keine Comicheft zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });
});
