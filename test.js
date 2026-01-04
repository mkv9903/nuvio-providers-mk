// test-flixindia.js
const { getStreams } = require('./providers/flixindia.js');

(async () => {
  const streams = await getStreams(1381405, 'movie', null, null);
  console.log(streams);
})();
