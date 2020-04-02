function makeBookmarksArray() {
    return [
      {
        id: 1,
        title: 'first Bookmark',
        url: 'https://www.pinkbike.com/',
        description: 'first description',
        rating: 5
      },
      {
        id: 2,
        title: 'second Bookmark',
        url: 'https://www.pinkbike.com/',
        description: 'second description',
        rating: 5
      },
      {
        id: 3,
        title: 'third Bookmark',
        url: 'https://www.pinkbike.com/',
        description: 'third description',
        rating: 3
      },
    ];
  }
  
  module.exports = {
    makeBookmarksArray,
  }