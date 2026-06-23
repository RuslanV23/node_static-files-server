'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

function createServer() {
  return http.createServer((req, res) => {
    if ((req.url || '/').includes('..')) {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 400;
      res.end('URL is not correct');

      return;
    }

    const url = new URL(
      req.url || '/',
      `http://${req.headers.host || 'localhost'}`,
    );
    const pathname = url.pathname;

    if (!pathname.startsWith('/file/')) {
      res.setHeader('Content-Type', 'text/plain');

      if (path.extname(pathname)) {
        res.statusCode = 400;
        res.end('URL is not correct');
      } else {
        res.statusCode = 200;

        res.end(
          // eslint-disable-next-line max-len
          'The URL should be something like "/file/nonexistent.txt" or "/file/"',
        );
      }

      return;
    }

    const filePath = pathname.slice('/file/'.length) || '/';

    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.txt': 'text/plain',
      '.js': 'application/javascript',
      '.json': 'application/json',
    };

    const ext = path.extname(filePath);

    if (!contentTypes[ext] && filePath.at(-1) !== '/') {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 200;

      res.end('The URL should be something like "/dir/file.txt" or "/file/"');

      return;
    }

    if (filePath.includes('//')) {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 404;
      res.end('URL is not correct');

      return;
    }

    const finalPathname =
      filePath.at(-1) !== '/'
        ? path.join(__dirname, '..', 'public', filePath)
        : path.join(__dirname, '..', 'public', filePath, 'index.html');

    if (!fs.existsSync(finalPathname)) {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 404;

      res.end('Not found');

      return;
    }

    res.setHeader(
      'Content-Type',
      contentTypes[path.extname(finalPathname)] || 'text/plain',
    );
    res.statusCode = 200;

    const fileStream = fs.createReadStream(finalPathname);

    fileStream.pipe(res);

    fileStream.on('error', () => {
      res.statusCode = 500;
      res.end('Server error');
    });

    res.on('close', () => {
      fileStream.destroy();
    });
  });
}

module.exports = {
  createServer,
};
