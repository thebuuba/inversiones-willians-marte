import { handleAsNodeRequest } from 'cloudflare:node';
import compiledWorker from './dist/worker.js';

export default compiledWorker.createWorkerHandler(handleAsNodeRequest);
