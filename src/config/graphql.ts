import { env } from './env.js';

const { apolloConfigEnv } = env;
const { debug } = apolloConfigEnv;

interface GraphQlConfig {
    readonly debug: boolean;
}

export const graphQlConfig: GraphQlConfig = {
    debug: debug?.toLowerCase() === 'true',
};
