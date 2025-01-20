import { Express } from 'express';
import { setupChatRoutes } from './chat';
import { setupAdminRoutes } from './admin';
import { setupConfigRoutes } from './config';
import { setupUpstreamRoutes } from './upstream';
import { setupUserRoutes } from './users';

export async function setupRoutes(app: Express) {
  setupChatRoutes(app);
  await setupAdminRoutes(app);
  await setupConfigRoutes(app);
  await setupUpstreamRoutes(app);
  await setupUserRoutes(app);
} 