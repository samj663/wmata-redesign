const { createProxyMiddleware } = require('http-proxy-middleware');
//import {createProxyMiddleware} from 'http-proxy-middleware';

module.exports = function(app) {
  app.use(
    '/api/*',
    createProxyMiddleware({
      target: process.env.REACT_APP_PROXY_ADDR,
      changeOrigin: true,
    })
  );
};