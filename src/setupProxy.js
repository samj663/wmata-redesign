const { createProxyMiddleware } = require('http-proxy-middleware');

//import { API_URL } from './tokens';
//import {createProxyMiddleware} from 'http-proxy-middleware';
/*
module.exports = function(app) {
  app.use(
    '/api/*',
    createProxyMiddleware({
      target: process.env.REACT_APP_PROXY_ADDR,
      changeOrigin: true,
    })
  );
};
*/

module.exports = function(app) {
  console.log("HELLLOOOO" );
 /* app.use(createProxyMiddleware('/*',
   { target: process.env.REACT_APP_PROXY_ADDR,
    changeOrigin: true,
  }));*/
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    app.use(createProxyMiddleware('http://localhost:4000/*',
    { target: process.env.REACT_APP_API_URL,
      changeOrigin: true,
    }));
  }
/*  app.use(createProxyMiddleware('/api/*',
   { target: (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') ? 
                process.env.REACT_APP_API_URL : 'https://wmata-backend.onrender.com',
    changeOrigin: true,
  }));*/
};