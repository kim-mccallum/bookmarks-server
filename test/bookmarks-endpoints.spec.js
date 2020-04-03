const { expect } = require('chai');
const knex = require('knex');
const app =  require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures')

describe.only(`Bookmarks endpoints`, function() {
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
  
    describe(`GET /bookmark`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmark')
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
                .get('/bookmark')
                .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                .expect(200, testBookmarks)
            })
        })
        //context for XSS attack here
        context(`Given an XSS attack article`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            console.log(`here is the malicious bm: ${maliciousBookmark}`)
            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it(`Removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/bookmark`)
                    .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].url).to.eql(expectedBookmark.url)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            })
        })
        })
    
        describe(`GET /bookmark/:bookmark_id`, () => {
            context(`Given no bookmarks`, () =>{
                it(`responds with 404 and not found message`, () => {
                    const bookmarkId = 123456
                    return supertest(app)
                        .get(`/bookmark/${bookmarkId}`)
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
                    .get(`/bookmark/${bookmarkId}`)
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
                        .get(`/bookmark/${maliciousBookmark.id}`)
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
        describe('POST /bookmark', () => {
            it.only(`Creates an bookmark, responding with 201 and the new bookmark`, function() {
                const newBookmark = {
                    title:'Test new bookmark',
                    url:'www.yippee.com',
                    rating:4
                }
                return supertest(app)
                    .post('/bookmark')
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
                            .get(`/bookmark/${postRes.body.id}`)
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
                        .post('/bookmark')
                        .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
                        .send(newBookmark)
                        .expect(400, {
                            error: { message: `Missing '${field}' in request body`}
                        })
                })
            })

        })
        // Test for DELETE - later
})