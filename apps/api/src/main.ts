import { createApplication } from './bootstrap.js';
import { loadApiEnvironment } from './config/environment.js';

const environment = loadApiEnvironment();
const application = await createApplication();

await application.listen(environment.port, environment.host);
