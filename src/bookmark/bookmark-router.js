const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const { bookmarks } = require('../store')
// I think the bookmarks-service belongs here 
const BookmarksService = require('../bookmarks-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter.route('/').get((req, res) => {
    res.send('Welcome to the bookmarks API, check out our bookmark endpoint to view booksmarks. GET and DELETE using bookmark id.')
})

bookmarkRouter.route('/bookmark')
    //Get all the bookmarks form the db here? 
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks)
            })
            .catch(next)
    })
    .post(bodyParser, (req, res) => {
        // How do I insert this into the DB? Right now, it's still using STORE
        const { title, url } = req.body;
        console.log(title, url) 
        if(!title){
            logger.error(`Bookmark title is required`);
            return res.status(400).send('Invalid data');
        }
        if(!url){
            logger.error(`Bookmark URL is required`);
            return res.status(400).send('Invalid data');
        }
        if(!description){
            logger.error(`Bookmark description is required`);
            return res.status(400).send('Invalid data');
        }
        if(!rating){
            logger.error(`Bookmark rating is required`);
            return res.status(400).send('Invalid data');
        }
        const id = uuid()
        const bookmark = {
            id, title, url, description, rating
        }
        // Change this to add the DB
        //BookmarksService method to insert 
        // BookmarksService.
        bookmarks.push(bookmark);

        logger.info(`New bookmark with id ${id} was created`)

        res.status(201).location(`http://localhost/8000/bookmark/${id}`).json({id})
    });

bookmarkRouter.route('/bookmark/:id')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const bookmarkId = req.params.id
        // console log the id and chase it down
        BookmarksService.getById(knexInstance, bookmarkId)
            .then(bookmark => {
                console.log(`here is the bm id: ${bookmark.id}`)
                if(!bookmark){
                    return res.status(404).json({
                        error: {message: `Bookmark doesn't exist`}
                    })
                }
                res.json({
                    id: bookmark.id,
                    title: bookmark.title,
                    url: bookmark.url,
                    description: bookmark.description,
                    rating: bookmark.rating
                })
            })
            .catch(next)
    })
    .delete((req, res) => {
        //implement with DB delete?
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