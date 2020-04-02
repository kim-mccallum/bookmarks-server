const { expect } = require('chai');
const knex = require('knex');
const app =  require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures')

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
        })
})