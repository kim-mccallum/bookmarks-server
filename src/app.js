require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config')
const logger = require('./logger');

// require route handler 
const bookmarkRouter = require('./bookmark/bookmark-router');

const app = express();

// Middleware
const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());


// Validate authToken first
app.use(function validateBearerToken(req, res, next){
    const apiToken = process.env.API_TOKEN;

    const authToken = req.get('Authorization');

    if(!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        // THROW would be an option - this is how it would work
        // throw new Error('Oh no!!! Coronavirus!!!')
        return res.status(401).json({ error: "Unauthorized request" })
    }
    next()
})

// Then implement router
app.use(bookmarkRouter);

// Error handling at the end
app.use(function errorHandler(error, req, res, next){
    let response 
    if (NODE_ENV === 'production'){
        response = { error: { message: 'server error' } }
    } else {
        console.log(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app;