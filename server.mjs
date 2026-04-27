import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = normalize(dirname(__filename));
const SRC_DIR = join(ROOT_DIR, 'src');
const PORT = Number(process.env.PORT || 3000);
const DRIVE_FOLDER_ID = '1L5lsFtOUSaIFt0nzQgo7fbAezBc0nBh-';
const CREDENTIALS_PATH = join(ROOT_DIR, 'credentials.json');

/** In-memory cache for Drive API results to avoid frequent API calls. */
const VIDEOS_CACHE_TTL_MS = 60_000;
let videosCache = {
  expiresAt: 0,
  videos: [],
};

let cachedApiKey = '';

const MIME_BY_EXT = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/**
 * @param {import("node:http").ServerResponse} res
 * @param {number} code
 * @param {unknown} body
 */
function sendJson(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

/**
 * @param {string} fileId
 * @returns {string}
 */
function toDrivePreviewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Reads API key from env first, then from local credentials file.
 * Caches the result after the first successful read.
 *
 * @returns {Promise<string>}
 */
async function readApiKey() {
  if (process.env.GOOGLE_API_KEY) {
    cachedApiKey = process.env.GOOGLE_API_KEY;
    return cachedApiKey;
  }

  if (cachedApiKey) {
    return cachedApiKey;
  }

  try {
    const raw = await readFile(CREDENTIALS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed.apiKey === 'string' && parsed.apiKey.trim().length > 0) {
      cachedApiKey = parsed.apiKey.trim();
      return cachedApiKey;
    }
  } catch {
    return '';
  }

  return '';
}

/**
 * @returns {Promise<Array<{id: string, src: string, embedUrl: string, title: string, author: string, poster: string}>>}
 */
async function fetchDriveVideos() {
  const apiKey = await readApiKey();
  if (!apiKey) {
    throw new Error('Google API key is missing');
  }

  const query = encodeURIComponent(
    `'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'video/' and trashed = false`,
  );
  const fields = encodeURIComponent('files(id,name)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=1000&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Drive API request failed with ${response.status}: ${body}`,
    );
  }

  const data = await response.json();
  const files = Array.isArray(data.files) ? data.files : [];

  return files.map((file) => ({
    id: file.id,
    src: `/api/proxy/video/${file.id}`,
    embedUrl: toDrivePreviewUrl(file.id),
    title: String(file.name || 'Untitled').replace(/\.[^.]+$/, ''),
    author: '@google-drive',
    poster: '',
  }));
}

/**
 * @returns {Promise<Array<{id: string, src: string, embedUrl: string, title: string, author: string, poster: string}>>}
 */
async function getCachedDriveVideos() {
  const now = Date.now();
  if (videosCache.expiresAt > now && Array.isArray(videosCache.videos)) {
    return videosCache.videos;
  }

  const videos = await fetchDriveVideos();
  videosCache = {
    videos,
    expiresAt: now + VIDEOS_CACHE_TTL_MS,
  };
  return videos;
}

/**
 * @param {string} urlPath
 * @returns {string | null}
 */
function safePathFromUrl(urlPath) {
  if (urlPath === '/') {
    return join(SRC_DIR, 'index.html');
  }
  const cleaned = normalize(join(SRC_DIR, urlPath.replace(/^\//, '')));
  if (!cleaned.startsWith(SRC_DIR)) {
    return null;
  }
  return cleaned;
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 */
function serveStatic(req, res) {
  const path = safePathFromUrl(
    new URL(req.url, `http://${req.headers.host}`).pathname,
  );
  if (!path || !existsSync(path) || statSync(path).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const contentType = MIME_BY_EXT[extname(path)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(path).pipe(res);
}

/**
 * Returns a Google Drive direct download URL (bypasses API quota / anti-automation checks).
 *
 * @param {string} fileId
 * @returns {string}
 */
function toDriveDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * @param {string} fileId - the Google Drive file ID
 * @param {import("node:http").ServerResponse} res
 */
async function proxyVideo(fileId, res) {
  const driveUrl = toDriveDownloadUrl(fileId);

  try {
    const driveResponse = await fetch(driveUrl, {
      headers: {
        // Use a common user-agent to avoid automated-query detection
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!driveResponse.ok) {
      const body = await driveResponse.text();
      res.writeHead(driveResponse.status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
      });
      res.end(body);
      return;
    }

    const responseHeaders = {
      'Content-Type':
        driveResponse.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    };

    const contentLength = driveResponse.headers.get('content-length');
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    const acceptRanges = driveResponse.headers.get('accept-ranges');
    if (acceptRanges) {
      responseHeaders['Accept-Ranges'] = acceptRanges;
    }

    res.writeHead(driveResponse.status, responseHeaders);

    if (driveResponse.body) {
      await driveResponse.body.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          },
        }),
      );
    } else {
      res.end();
    }
  } catch (error) {
    const msg = `Failed to proxy video: ${error.message}`;
    res.writeHead(502, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': Buffer.byteLength(msg),
    });
    res.end(msg);
  }
}

/** Main server: API endpoints + static fallback. */
createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Invalid request URL' });
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  // GET /api/videos – returns the list of video metadata
  if (req.method === 'GET' && reqUrl.pathname === '/api/videos') {
    try {
      const videos = await getCachedDriveVideos();
      sendJson(res, 200, { videos });
    } catch (_error) {
      sendJson(res, 500, {
        videos: [],
        error: 'Failed to fetch videos from Google Drive API.',
      });
    }
    return;
  }

  // GET /api/proxy/video/:fileId – proxies a single video file from Google Drive
  const proxyMatch = reqUrl.pathname.match(
    /^\/api\/proxy\/video\/([a-zA-Z0-9_-]+)$/,
  );
  if (req.method === 'GET' && proxyMatch) {
    const apiKey = await readApiKey();
    if (!apiKey) {
      sendJson(res, 500, { error: 'Google API key is not configured.' });
      return;
    }
    await proxyVideo(proxyMatch[1], res);
    return;
  }

  // GET any other path – serve static files
  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}).listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
