var Twitter = require('twitter');
var readLine = require('readline');
var fs = require('fs');
var wordsFrequency = require('./lib/wordFrequency');
var colors = require('colors');
var Table = require('cli-table');
var request = require('request');
var progress = require('request-progress');
var async = require('async');

var alchemy = require('node_alchemy')(process.env.ALCHEMY_API_KEY /*'API KEY GOES HERE'*/);

var watson = require('watson-developer-cloud');
var alchemy_language = watson.alchemy_language({
  api_key: process.env.ALCHEMY_API_KEY //'API KEY GOES HERE'
});

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY, //'TWITTER_CONSUMER_KEY',
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET, //'TWITTER_CONSUMER_SECRET',
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY, //'TWITTER_ACCESS_TOKEN_KEY',
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECET, //'TWITTER_ACCESS_TOKEN_SECET'
});

const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout
});

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

var table = new Table({
    head: [colors.yellow('S/no.'), colors.yellow('Word'), colors.yellow('Frequency')], 
    colWidths: [10, 30, 20]
});

var emotionTable = new Table({
	head: [colors.yellow('Emotion'), colors.yellow('Score')],
	colWidths: [30, 20]
})


console.log('');
console.log('');
console.log(colors.help.bold('\t WELCOME TO TWITITER DATA INSIGHT'));
console.log(colors.silly('------------------------------------------------'));
console.log('');
console.log(colors.verbose('\t You can perform Twitter \n \n 1. Word Analysis \n \n 2. Sentiment Analysis \n \n 3. Emotion Analysis'));
console.log(colors.silly('-------------------------------------------------'));
console.log('');

console.log(colors.red.bold('Note:! ') + colors.yellow.bold('You need a Twitter Handle e.g. AJUdensi to perform the above tasks'));
console.log('');
rl.question(colors.input('Enter a twitter handle: '), (twHandle) => {

	if(twHandle) {
		console.log('');
		console.log(colors.bgBlue('\t Verifying your twitter handle'));
		console.log(colors.silly('-------------------------------------------------'));

		client.get('statuses/user_timeline', {screen_name: twHandle}, function(err, tweets, res){
			
			var twUrl = 'https://api.twitter.com/1.1/statuses/user_timeline/${twHandle}.json';

		

			if(!err){
				twHandle = twHandle.toUpperCase();
				console.log('');
				console.log(colors.bgGreen.bold(` \t Hello ${twHandle} \t`));
				console.log('');
				console.log(colors.silly('----------------------------'));
				console.log('');
				console.log(colors.verbose('Choose a task you want to do. \n \n 1 => Word Frequency Analysis \n \n 2 => Sentiment Analysis \n \n 3 => Emotion Analysis'));
				console.log('');
				
				rl.question(colors.input('Enter 1 or 2 or 3: '), (toDo) => {
					console.log('');
					if(toDo == 1){

						console.log(colors.red.bold('\t Note:! ') + colors.yellow.bold('Only numbers are allowed (E.g. 12)'));
						console.log('');

						rl.question(colors.input('How many tweets do you want to analyse?: '), (twCount) => {
							console.log(''); 
							
							if(twCount || typeof twCount == 'number') {

								console.log(colors.bgGreen(`${twCount} tweets prepared`)); 
								
								console.log(''); 
								rl.question(colors.input('How many words do you need?: '), (wordsCount) => {
									console.log('');

									if(wordsCount || typeof wordsCount == 'number') {

										console.log(colors.bgGreen(`${wordsCount} words Analysed`)); 

										console.log('');

										client.get('statuses/user_timeline', {screen_name: twHandle, count: twCount}, function(err, tweets, res){
											if(!err){
												var twObj = {tweets: tweets};
												var twLength =twObj.tweets.length;
												var allTweet = '';
												//do word frequency
												for(let i = 0; i < twObj.tweets.length - 1; i++){
													 allTweet += twObj.tweets[i].text;
												}

												words = wordsFrequency(allTweet);
												let i = 1;

												for(var key in words){
													
													if(key == wordsCount) break;
												    if (words.hasOwnProperty(key)) {
												    	table.push(
														    [i, words[key].word, words[key].freq]
														);
												       //console.log(colors.verbose(`Word: ${words[key].word} <===> Frequency: ${words[key].freq}`));
												    }
												    i++;
									    		}

									    		console.log('');
									    		console.log(colors.verbose.bold(`\t \t Word Analysis for ${twHandle}`));
									    		console.log(colors.verbose(table.toString()));
									    		console.log('');
									    	} else {
									    		console.log(colors.bgRed('\n Sorry! An error occured. \n Pehaps bad internet'));
									    	}
									    });
									} else {
										console.log(colors.bgRed('Oh no! You passed an invalid value'));
										rl.close();
									}
									rl.close();
								});
							} else {
								console.log(colors.bgRed('Oh no! You passed an invalid value'));
								rl.close();
							}
						});
					} else if(toDo == 2){
						client.get('statuses/user_timeline', {screen_name: twHandle, count: 15}, function(err, tweets, res){
							if(!err){
								var twObj = {tweets: tweets};
								var twLength =twObj.tweets.length;
								var promises = [];
								var sentimentSum = 0;
						//do sentiment
								for(let i = 0; i < twLength - 1; i++){
									eachTweet = twObj.tweets[i];		

									var eachPromise = alchemy.lookup('sentiment', 'text', eachTweet.text)
					                    .then(function(result) {
					                    	if(result.data.docSentiment.score){
					                        	sentimentSum += parseFloat(result.data.docSentiment.score);
					                        }
					                    }).catch(function(err) {
					                        //console.log({ status: 'error', message: err });
					                    })
									promises.push(eachPromise);
								}
								
								Promise.all(promises).then((result) => {
											console.log('');
											console.log(colors.green(`${twHandle} sentiment cumulative is ${sentimentSum}`));
											var sentimentType = ((sentimentSum > 0) ? 'Positive' : ((sentimentSum < 0) ? 'Negative' : 'Neutal'));
											console.log('');
											console.log(colors.green(`I think you are generally ${sentimentType}`));
											console.log('');
										}).catch(()=>{
											console.log(colors.bgRed("error"));
										});
							}
						});
						rl.close();
					} else if(toDo == 3){
						client.get('statuses/user_timeline', {screen_name: twHandle, count: 15}, function(err, tweets, res){
							if(!err){
								var twObj = {tweets: tweets};
								var allPromise = [];
								
								twObj.tweets.forEach(function(values){
									var obj = {
											anger:0,
											disgust:0,
											fear:0,
											joy:0,
											sadness:0.0
									};	

									var eachPromise = new Promise(function(resolve, reject){
										alchemy_language.emotion({text: values.text}, function(err, response) {
											if(err){
												reject(err);
											} else {
												if(response.docEmotions.anger){
													obj.anger += parseFloat(response.docEmotions.anger);
												}
												if(response.docEmotions.disgust){
													obj.disgust += parseFloat(response.docEmotions.disgust);
												}
												if(response.docEmotions.fear){
													obj.fear += parseFloat(response.docEmotions.fear);
												}
												if(response.docEmotions.joy){
													obj.joy += parseFloat(response.docEmotions.joy);
												}
												if(response.docEmotions.sadness){
													obj.sadness += parseFloat(response.docEmotions.sadness);
												}
												resolve(obj);
											}
										})
									});
									allPromise.push(eachPromise);
								});

								Promise.all(allPromise).then((result)=>{
									var anger = 0
									var disgust = 0;
									var fear = 0;
									var joy = 0;
									var sadness = 0;
									arr.forEach(function(value){
								    	anger += value.anger;
								     	disgust += value.disgust;
								     	fear += value.fear;
								     	joy += value.joy;
								     	sadness += value.sadness;
								    });

									emotionTable.push(
										['Anger ', anger.toFixed(3)],
										['Disgust ', disgust.toFixed(3)],
										['Fear ', fear.toFixed(3)],
										['Joy ', joy.toFixed(3)],
										['Sadness ', sadness.toFixed(3)]
									);

									console.log('');
									console.log(colors.verbose.bold(`\t \t Emotion Analysis for ${twHandle}`));
									console.log('');
									console.log(colors.verbose(emotionTable.toString()))

								}).catch((res) => {
									console.log(colors.red(res.statusInfo));
								})

							}

						});
						rl.close();
					} else {
						console.log(colors.bgRed('Please try again with a valid task command'));
						rl.close();
					} 
				});
			
			} else {
				console.log(colors.bgRed('An error occurred. Enter a valid twitter handle or check network connection '));
				rl.close();
			}
		});
		
	} else {
		rl.close();
	}
});