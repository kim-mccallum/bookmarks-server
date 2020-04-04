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
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(bookmark => {
                if(!bookmark){
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist`}
                    })
                }
                res.bookmark = bookmark //Save the bookmark for the next mid
                next()
            })
            .catch()
    })
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
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'), req.params.id
        )
            .then(bm => {
                if(!bm){
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist`}
                    })
                }
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;
        const bookmarkToUpdate = { title, url, description, rating }

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
        if (numberOfValues === 0){
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'url' or 'rating'`
                }
            })
        }

        BookmarksService.updateBookmark(
            req.app.get('db'), 
            req.params.id, 
            bookmarkToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarkRouter