const { expect } = require('chai');
const knex = require('knex');
const app =  require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures')

describe(`Bookmarks endpoints`, function() {
    let db 

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())
  
    describe(`GET /api/bookmark`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/bookmark')
                    .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                    .expect(200, [])
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
    
            beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
            })
            it('responds with 200 and all of the bookmarks', () => {  
            return supertest(app)
                .get('/api/bookmark')
                .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                .expect(200, testBookmarks)
            })
        })
        //context for XSS attack here
        context(`Given an XSS attack article`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it(`Removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/bookmark`)
                    .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].url).to.eql(expectedBookmark.url)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            })
        })
        })
    
        describe(`GET /api/bookmark/:bookmark_id`, () => {
            context(`Given no bookmarks`, () =>{
                it(`responds with 404 and not found message`, () => {
                    const bookmarkId = 123456
                    return supertest(app)
                        .get(`/api/bookmark/${bookmarkId}`)
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .expect(404, {error: {message: `Bookmark doesn't exist`}})
                })
            })
            context('Given there are bookmarks in the database', () => {
                const testBookmarks = makeBookmarksArray()
        
                beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
                })
                it('responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/api/bookmark/${bookmarkId}`)
                    .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                    .expect(200, expectedBookmark)
                })
            })

            context(`Given an XSS attack bookmark`, () => {
                const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

                beforeEach('insert malicious bookmark', () => {
                    return db 
                        .into('bookmarks')
                        .insert([ maliciousBookmark ])
                })

                it('removes XSS attack content', () => {
                    return supertest(app)
                        .get(`/api/bookmark/${maliciousBookmark.id}`)
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .expect(200)
                        .expect(res => {
                            expect(res.body.url).to.eql(expectedBookmark.url)
                            expect(res.body.description).to.eql(expectedBookmark.description)
                        })
                })
            })

        })
        // Test for POST
        describe('POST /api/bookmark', () => {
            it(`Creates an bookmark, responding with 201 and the new bookmark`, function() {
                const newBookmark = {
                    title:'Test new bookmark',
                    url:'www.yippee.com',
                    rating:4
                }
                return supertest(app)
                    .post('/api/bookmark')
                    .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                    .send(newBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newBookmark.title)
                        expect(res.body.url).to.eql(newBookmark.url)
                        expect(res.body.rating).to.eql(newBookmark.rating)
                        expect(res.body).to.have.property('id')
                        // what does this mean about headers?
                        expect(res.headers.location).to.eql(`/bookmark/${res.body.id}`)
                    })
                    .then(postRes => 
                        supertest(app)
                            .get(`/api/bookmark/${postRes.body.id}`)
                            .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                            .expect(postRes.body)
                        )
            })

            const requiredFields = ['title', 'url', 'rating'];

            requiredFields.forEach(field => {
                const newBookmark = { 
                    title: 'Test new bookmark',
                    url: 'www.google.com',
                    rating: 5
                }

                it(`Responds with 400 and an error message when the '${field}' is missing`, () => {
                    delete newBookmark[field]

                    return supertest(app)
                        .post('/api/bookmark')
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .send(newBookmark)
                        .expect(400, {
                            error: { message: `Missing '${field}' in request body`}
                        })
                })
            })

        })
        // Test for DELETE 
        describe('DELETE /api/bookmark/:bookmark_id', () => {
            context('Given there are bookmarks in the database', () => {
                const testBookmarks = makeBookmarksArray()

                beforeEach('insert bookmarks', () => {
                  return db
                    .into('bookmarks')  
                    .insert(testBookmarks)
                })

                it(`responds with 204 and removes the article`, () => {
                    const idToRemove = 2
                    const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                    return supertest(app)
                        .delete(`/api/bookmark/${idToRemove}`)
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .expect(204)
                        .then(res => supertest(app)
                            .get('/api/bookmark')
                            .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                            .expect(expectedBookmarks)
                        )
                })

            })

            context(`Given no bookmarks`, () => {
                it(`responds with 404`, () => {
                    const bookmarkId = 123456
                    return supertest(app)
                        .delete(`/api/bookmark/${bookmarkId}`)
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .expect(404, {error: { message: `Bookmark doesn't exist` }})
                })
            })
        })
        // PATCH
        describe(`PATCH /api/bookmark/:bookmark_id`, () => {
            context(`Given no bookmarks`, () => {
                it(`responds with 404`, () => {
                    const bookmarkId = 123456;
                    return supertest(app)
                        .patch(`/api/bookmark/${bookmarkId}`)
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .expect(404, {error: { message: `Bookmark doesn't exist`}})
                })
            })

            context(`Given there are bookmarks in the database`, () => {
                const testBookmarks = makeBookmarksArray()

                beforeEach(`insert bookmarks`, () => {
                    return db 
                        .into('bookmarks')
                        .insert(testBookmarks)
                })

                it(`responds with 204 and updates the bookmarks`, () => {
                    const idToUpdate = 2;
                    const updateBookmark = { 
                        title: 'Updated bookmark title', 
                        url: 'www.google.com', 
                        rating: 5,
                    }
                    const expectedBookmark = {
                        ...testBookmarks[idToUpdate - 1], 
                        ...updateBookmark
                    }
                    return supertest(app)
                        .patch(`/api/bookmark/${idToUpdate}`)
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .send(updateBookmark)
                        .expect(204)
                        .then(res => 
                            supertest(app)    
                                .get(`/api/bookmark/${idToUpdate}`)
                                .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                                .expect(expectedBookmark)
                        )
                })

                it(`responds with 400 when no required fields suplied`, () => {
                    const idToUpdate = 2
                    return supertest(app)
                        .patch(`/api/bookmark/${idToUpdate}`)
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .send({ irreleventField: 'foo' })
                        .expect(400, {
                            error: {
                                message: `Request body must contain either 'title', 'url' or 'rating'`
                            }
                        })
                })

                it(`responds with 204 when updating only a subset of fields`, () => {
                    const idToUpdate = 2;
                    const updateBookmark = { 
                        title: 'updated bookmark title',
                    }
                    const expectedBookmark = {
                        ...testBookmarks[idToUpdate - 1],
                        ...updateBookmark
                    }

                    return supertest(app)
                        .patch(`/api/bookmark/${idToUpdate}`)
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .send({
                            ...updateBookmark, 
                            fieldToIgnore: 'should not be in GET response'
                        })
                        .expect(204)
                        .then(res => 
                            supertest(app)
                            .get(`/api/bookmark/${idToUpdate}`)
                            .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                            .expect(expectedBookmark)
                        )
                })
            })
        })
})