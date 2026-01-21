import { app } from './src/app.js';
const port = process.env.PORT || 3000;

// Only listen locally, Vercel will handle the export in src/app.js
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🔐 Keygen Server running on port ${port}`);
  });
}

