const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sessionConfig = require('../config/session');

const setupMiddleware = (app) => {
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static('public'));
  app.set('trust proxy', true);
  app.use(sessionConfig);
};

module.exports = setupMiddleware;