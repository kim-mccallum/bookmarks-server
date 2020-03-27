const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const { bookmarks } = require('../store')

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter.route('/').get((req, res) => {
    res.send('Welcome to the bookmarks API, check out our bookmark endpoint to view booksmarks. GET and DELETE using bookmark id.')
})
bookmarkRouter.route('/bookmark')
    .get((req, res) => {
        // console.log(bookmarks)
        res.json(bookmarks)
    })
    .post(bodyParser, (req, res) => {
        const { title, url } = req.body;
        console.log(title, url) 
        //implement logic here
        if(!title){
            logger.error(`Bookmark title is required`);
            return res.status(400).send('Invalid data');
        }
        if(!url){
            logger.error(`Bookmark URL is required`);
            return res.status(400).send('Invalid data');
        }
        const id = uuid()
        const bookmark = {
            id, title, url
        }
        bookmarks.push(bookmark);

        logger.info(`New bookmark with id ${id} was created`)

        res.status(201).location(`http://localhost/8000/bookmark/${id}`).json({id})
    });

bookmarkRouter.route('/bookmark/:id')
    .get((req, res) => {
        //implement logic here
        const { id } = req.params;
        const bookmark = bookmarks.find(bm => bm.id == id);

        if(!bookmark){
            logger.error(`Bookmarks with id ${id} was not found`);
            return res.status(404).send('Bookmark not found')
        }
        res.json(bookmark);
    })
    .delete((req, res) => {
        //implement
        const { id } = req.params;

        const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);

        if(bookmarkIndex === -1){
            logger.error(`Bookmark with id ${id} was not found`);
            return res.status(404).send('Not found');
        }
        bookmarks.splice(bookmarkIndex, 1);
        logger.info(`Bookmark with id ${id} has been exterminated`);
        res.status(204).end();
    })

module.exports = bookmarkRouter