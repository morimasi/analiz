import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // API rotalarını burada tanımlayın
  // Örnek: app.use('/api', apiRouter);
  // api/index.ts dosyasındaki rotaları doğrudan kullanacağımız için burada ayrıca tanımlamaya gerek yok.
  // Ancak, api/index.ts'den gelen 'app' objesini kullanmalıyız.
  const apiApp = await import('./api/index');
  app.use(apiApp.default);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
