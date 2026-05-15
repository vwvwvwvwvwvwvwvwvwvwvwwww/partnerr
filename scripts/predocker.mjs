import { dockerComposeUpWait } from './docker-up.mjs';

try {
  await dockerComposeUpWait();
} catch (error) {
  console.error(error.message ?? error);
  process.exit(1);
}
