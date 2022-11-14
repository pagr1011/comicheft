/**
 * Das Modul besteht aus der Controller-Klasse für Health-Checks.
 * @packageDocumentation
 */

import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator,
    TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Agent } from 'node:https';
import { ApiTags } from '@nestjs/swagger';
import { k8sConfig } from '../config/kubernetes.js';
import { nodeConfig } from '../config/node.js';

/**
 * Die Controller-Klasse für Health-Checks.
 */
@Controller('health')
@ApiTags('Health')
export class HealthController {
    readonly #health: HealthCheckService;

    readonly #http: HttpHealthIndicator;

    readonly #typeorm: TypeOrmHealthIndicator;

    readonly #schema = k8sConfig.detected && !k8sConfig.tls ? 'http' : 'https';

    readonly #httpsAgent = new Agent({
        requestCert: true,
        rejectUnauthorized: false,
        // cert aus interface HttpsOptions (von Nest) ist undefined
        ca: nodeConfig.httpsOptions?.cert as Buffer, // type-coverage:ignore-line
    });

    constructor(
        health: HealthCheckService,
        http: HttpHealthIndicator,
        typeorm: TypeOrmHealthIndicator,
    ) {
        this.#health = health;
        this.#http = http;
        this.#typeorm = typeorm;
    }

    @Get('live')
    @HealthCheck()
    live() {
        return this.#health.check([
            () =>
                this.#http.pingCheck(
                    'comicheft REST-API',
                    `${this.#schema}://${nodeConfig.host}:${
                        nodeConfig.port
                    }/api/00000000-0000-0000-0000-000000000001`,
                    { httpsAgent: this.#httpsAgent },
                ),
        ]);
    }

    @Get('ready')
    @HealthCheck()
    ready() {
        return this.#health.check([() => this.#typeorm.pingCheck('DB')]);
    }
}
