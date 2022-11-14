/**
 * Das Modul enthält die Konfigurations-Information für Health.
 * @packageDocumentation
 */

import { env } from './env.js';

interface HealthConfig {
    readonly prettyPrint: boolean;
}

const { healthConfigEnv } = env;
const { prettyPrint } = healthConfigEnv;

/**
 * Das Konfigurationsobjekt für Health.
 */
export const healthConfig: HealthConfig = {
    prettyPrint:
        prettyPrint !== undefined && prettyPrint.toLowerCase() === 'true',
};

console.info('healthConfig: %o', healthConfig);
