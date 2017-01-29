var enterHandle = require('./lib/twitSight').enterHandle;
var rl = require('./lib/twitSight').rl;
var colors = require('./lib/twitSight').colors;



console.log('');
console.log('');
console.log(colors.help.bold('\t WELCOME TO TWEET SIGHT'));
console.log(colors.silly('------------------------------------------------'));
console.log('');
console.log(colors.verbose('\t You can perform Twitter \n \n 1. Word Analysis \n \n 2. Sentiment Analysis \n \n 3. Emotion Analysis'));
console.log(colors.silly('-------------------------------------------------'));
console.log('');

console.log(colors.red.bold('Note:! ') + colors.yellow.bold('You need a Twitter Handle e.g. AJUdensi to perform the above tasks'));
console.log('');

enterHandle();