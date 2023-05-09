/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type ComicheftDTO } from '../../src/comicheft/graphql/comicheft-query.resolver.js';
import { HttpStatus } from '@nestjs/common';

/* eslint-disable jest/no-export */
export type GraphQLQuery = Pick<GraphQLRequest, 'query'>;
export type GraphQLResponseBody = Pick<GraphQLResponse, 'data' | 'errors'>;
/* eslint-enable jest/no-export */

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';

const titelVorhanden = 'Alpha';

const teilTitelVorhanden = 'a';

const teilTitelNichtVorhanden = 'abc';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Comicheft zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    comicheft(id: "${idVorhanden}") {
                        version
                        isbn
                        art
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { comicheft } = data.data!;
        const result: ComicheftDTO = comicheft;

        expect(result.titel?.titel).toMatch(/^\w/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Comicheft zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    comicheft(id: "${id}") {
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.comicheft).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(
            `Es wurde kein Comicheft mit der ID ${id} gefunden.`,
        );
        expect(path).toBeDefined();
        expect(path!![0]).toBe('comicheft');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Comicheft zu vorhandenem Titel', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    buecher(titel: "${titelVorhanden}") {
                        art
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { buecher } = data.data!;

        expect(buecher).not.toHaveLength(0);

        const buecherArray: ComicheftDTO[] = buecher;

        expect(buecherArray).toHaveLength(1);

        const [comicheft] = buecherArray;

        expect(comicheft!.titel?.titel).toBe(titelVorhanden);
    });

    test('Comicheft zu vorhandenem Teil-Titel', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    buecher(titel: "${teilTitelVorhanden}") {
                        art
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { buecher } = data.data!;

        expect(buecher).not.toHaveLength(0);

        const buecherArray: ComicheftDTO[] = buecher;
        buecherArray
            .map((comicheft) => comicheft.titel)
            .forEach((titel) =>
                expect(titel?.titel.toLowerCase()).toEqual(
                    expect.stringContaining(teilTitelVorhanden),
                ),
            );
    });

    test('Comicheft zu nicht vorhandenem Titel', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    buecher(titel: "${teilTitelNichtVorhanden}") {
                        art
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.buecher).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe('Es wurden keine Buecher gefunden.');
        expect(path).toBeDefined();
        expect(path!![0]).toBe('buecher');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
