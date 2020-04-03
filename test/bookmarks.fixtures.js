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

  function makeMaliciousBookmark() {
    const maliciousBookmark = {
          id: 911,
          title:'How-to',
          url:'Naughty naughty very naughty <script>alert("xss");</script>',
          description:`Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
          rating:1
      }
    const expectedBookmark = {
      ...makeMaliciousBookmark, 
      url: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
      description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return { 
      maliciousBookmark,
      expectedBookmark
    }
  } 
  
  module.exports = {
    makeBookmarksArray, makeMaliciousBookmark
  }