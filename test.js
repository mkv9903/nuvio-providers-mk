// test-flixindia.js
const { getStreams } = require('./providers/flixindia.js');

(async () => {
  const streams = await getStreams(1054867, 'movie', null, null);
  console.log(streams);
})();
