const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const { bookmarks } = require('../store');
const xss = require('xss');
const BookmarksService = require('./bookmarks-service');

const bookmarkRouter = express.Router();
const jsonParser = express.json();

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: bookmark.title,
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: bookmark.rating
  })

bookmarkRouter.route('/').get((req, res) => {
    res.send('Welcome to the bookmarks API, check out our bookmark endpoint to view booksmarks. GET and DELETE using bookmark id.')
})

bookmarkRouter.route('/bookmark')
    //Get all the bookmarks form the db here? 
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    //POST a new one to the db
    .post(jsonParser, (req, res, next) => {
        const { title, url, rating } = req.body;
        const newBookmark = { title, url, rating }
        console.log(title, url, rating) 

        for (const [key, value] of Object.entries(newBookmark)){
            if(value == null){
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }
        if( rating < 1 || rating > 5){
            return res.status(400).json({
                error: { message: `Rating must be a value between 1 and 5.`}
            })
        }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            //Do I need to sanitize the bookmark going into the db?
            newBookmark
        )
            .then(bookmark => {
                res 
                    .status(201)
                    .location(`/bookmark/${bookmark.id}`)
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)

    });

bookmarkRouter.route('/bookmark/:id')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const bookmarkId = req.params.id
        // console log the id and chase it down
        BookmarksService.getById(knexInstance, bookmarkId)
            .then(bookmark => {
                if(!bookmark){
                    return res.status(404).json({
                        error: {message: `Bookmark doesn't exist`}
                    })
                }
                res.json({
                    id: bookmark.id,
                    title: bookmark.title,
                    url: xss(bookmark.url),
                    description: xss(bookmark.description),
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