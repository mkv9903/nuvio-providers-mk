// test-flixindia.js
const { getStreams } = require('./providers/flixindia.js');

(async () => {
  const streams = await getStreams(1534964, 'movie', null, null);
  console.log(streams);
})();
