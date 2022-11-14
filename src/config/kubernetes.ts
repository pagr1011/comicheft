/**
 * Das Modul enthält die Information, ob man innerhalb von Kubernetes ist.
 * @packageDocumentation
 */

import { env } from './env.js';
import { hostname } from 'node:os';

// DNS-Name eines Kubernetes-Pod endet z.B. mit -75469ff64b-q3bst
const kubernetesRegexp = /^\w+-[a-z\d]{8,10}-[a-z\d]{5}$/u;

const isK8s = kubernetesRegexp.exec(hostname()) !== null;

interface K8sConfig {
    readonly detected: boolean;
    readonly tls: boolean;
}

const { k8sConfigEnv } = env;
const { tls } = k8sConfigEnv;

/**
 * Das Konfigurationsobjekt für Kubernetes.
 */
export const k8sConfig: K8sConfig = {
    detected: isK8s,
    tls: tls === undefined || tls.toLowerCase() === 'true',
};

console.info('k8sConfig: %o', k8sConfig);
