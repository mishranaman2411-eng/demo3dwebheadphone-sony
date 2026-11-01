import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-videos',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/videos/')) {
            const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
            const filePath = path.join(__dirname, decodedUrl);
            if (fs.existsSync(filePath)) {
              const stat = fs.statSync(filePath);
              const range = req.headers.range;

              if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
                const chunksize = end - start + 1;
                const file = fs.createReadStream(filePath, { start, end });
                res.writeHead(206, {
                  'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                  'Accept-Ranges': 'bytes',
                  'Content-Length': chunksize,
                  'Content-Type': 'video/mp4',
                });
                file.pipe(res);
                return;
              } else {
                res.writeHead(200, {
                  'Content-Length': stat.size,
                  'Content-Type': 'video/mp4',
                  'Accept-Ranges': 'bytes',
                });
                fs.createReadStream(filePath).pipe(res);
                return;
              }
            }
          }
          next();
        });
      },
      closeBundle() {
        // Copy videos to dist/videos for production build
        const distVideos = path.join(__dirname, 'dist', 'videos');
        const srcVideos = path.join(__dirname, 'videos');
        if (fs.existsSync(srcVideos)) {
          if (!fs.existsSync(distVideos)) {
            fs.mkdirSync(distVideos, { recursive: true });
          }
          const files = fs.readdirSync(srcVideos);
          for (const file of files) {
            fs.copyFileSync(path.join(srcVideos, file), path.join(distVideos, file));
          }
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
