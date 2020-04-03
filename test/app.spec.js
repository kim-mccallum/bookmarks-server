const app = require('../src/app')

describe.skip('App', () => {
    it('GET / responds with 200 containing "Hello, world!', () => {
        return supertest(app)
            .get('/')
            .set("Authorization", "Bearer d2942cae-6f67-11ea-bc55-0242ac130003")
            .expect(200, 'Hello, world!')
    })
})