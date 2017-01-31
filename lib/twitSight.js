require('dotenv').config();

var Twitter = require('twitter');
var readLine = require('readline');
var _progress = require('cli-progress');
var alchemy = require('node_alchemy')(process.env.ALCHEMY_API_KEY /*'API KEY GOES HERE'*/ );
var watson = require('watson-developer-cloud');
var sw = require('stopword');

var alchemy_language = watson.alchemy_language({
    api_key: process.env.ALCHEMY_API_KEY //'API KEY GOES HERE'
});
var wordsFrequency = require('./wordFrequency').wordFrequency;
var filterText = require('./wordFrequency').filterText;
var colors = require('colors');
var Table = require('cli-table');


var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY, //'TWITTER_CONSUMER_KEY',
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET, //'TWITTER_CONSUMER_SECRET',
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY, //'TWITTER_ACCESS_TOKEN_KEY',
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECET, //'TWITTER_ACCESS_TOKEN_SECET'
});

var rl = readLine.createInterface({
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






var tweetCountResolve = tweetCount(5);

function tweetCount(count) {
    count = parseInt(count);
    return count;
}


function doProgress(twHandle) {

    // create new progress bar using default values
    twHandle = twHandle.toUpperCase();

    var tweets = '';
    var count = tweetCount.apply(this, [tweetCountResolve]);



    return new Promise((resolve, reject) => {

        getTwitterUser(twHandle).then((result) => {
            tweets += result;
        }).catch((error) => {
            reject(error);
        })

        var b2 = new _progress.Bar({
            barCompleteChar: '>> ',
            barIncompleteChar: '__',
            format: colors.green('Fetching and saving tweets: ') + ' || ' + '{bar}' + ' || ' + colors.green('{percentage}% ETA: {eta}s'),
            fps: 5,
            stream: process.stdout,
            barsize: 30
        });

        b2.start(count * (count >= 20 ? 5 : 20), 0);


        // 50ms update rate
        var timer = setInterval(function() {
            // increment value
            b2.increment();

            // set limit
            if (b2.value >= b2.getTotal()) {
                // stop timer
                clearInterval(timer);

                b2.stop();

                resolve(tweets);
            }
        }, 50);

    }).then((result) => {
        console.log(colors.green('\n \t ALL TWEETS FETCHED AND ACCOUNT VERIFIED \n'));
        console.log(result);
    }).then(() => {
        chooseTask(twHandle);
    }).catch((error) => {
        console.log(error);
    });
}


function getTweets() {
    var count = tweetCount.apply(this, [tweetCountResolve]);

    return new Promise((resolve, reject) => {
        client.get('statuses/user_timeline', {
            screen_name: 'ajudensi',
            count: count
        }, function(err, tweets, res) {
            if (!err) {
                var twObj = {
                    tweets: tweets
                };
                var twLength = twObj.tweets.length;
                var allTweet = '+';
                //do word frequency
                for (let i = 0; i < twObj.tweets.length - 1; i++) {
                    allTweet += twObj.tweets[i].text + '\n \n';
                }
                resolve(allTweet);
            } else {
                reject(err);
            }

        });
    });
}


function getTwitterUser(twHandle) {
    return new Promise((resolve, reject) => {
        client.get('statuses/user_timeline', {
            screen_name: twHandle
        }, function(err, tweets, res) {
            // jsonTweet = JSON.stringify(tweets);
            // fs.appendFile('tweets.json', jsonTweet, (err)=>{
            //     if(err){
            //       console.log(colors.red('An error occured saving tweets'));
            //     }else{
            //       console.log(colors.green('\n Tweets are saved well'));
            //     }
            // });

            if (!err) {
                var result = '\n' +
                    colors.cyan.bold('\t Hello ' + twHandle + '\t') +
                    '\n' +
                    colors.silly('----------------------------') +
                    '\n \n';
                resolve(result);
            } else {
                reject(err);
            }
        });
    })
}

function chooseTask(twHandle) {

    return new Promise((resolve, reject) => {

        console.log(colors.verbose('\n Choose a task you want to do. \n \n 1 => Word Frequency Analysis \n \n 2 => Sentiment Analysis \n \n 3 => Emotion Analysis'));

        rl.question(colors.input('\n Enter 1 or 2 or 3: '), (toDo) => {
            console.log('\n');
            resolve(toDo);
        });
    }).then((toDo) => {
        if (toDo == 1) {
            doWordFrequencyAnalysis(twHandle);
        } else if (toDo == 2) {
            doSentimentAnalysis(twHandle);
        } else if (toDo == 3) {
            doEmotionAnalysis(twHandle);

        } else {
            console.log(colors.bgRed('Please try again with a valid task command \n'));
            chooseTask(twHandle);
        }
    });
}

function doWordFrequencyAnalysis(twHandle) {

    howManyTweets(twHandle);

}

function doSentimentAnalysis(twHandle) {
    client.get('statuses/user_timeline', {
        screen_name: twHandle,
        count: 25
    }, function(err, tweets, res) {
        if (!err) {
            var twObj = {
                tweets: tweets
            };
            var twLength = twObj.tweets.length;
            var promises = [];
            var sentimentSum = 0;
            //do sentiment
            for (let i = 0; i < twLength - 1; i++) {
                eachTweet = filterText(twObj.tweets[i].text);

                var eachPromise = alchemy.lookup('sentiment', 'text', eachTweet)
                    .then(function(result) {
                        if (result.data.docSentiment.score) {
                            sentimentSum += parseFloat(result.data.docSentiment.score);
                        }
                    }).catch(function(err) {
                        //console.log({ status: 'error', message: err });
                    })
                promises.push(eachPromise);
            }

            Promise.all(promises).then((result) => {

                var sentimentType = ((sentimentSum > 0) ? 'Positive' : ((sentimentSum < 0) ? 'Negative' : 'Neutal'));

                if (sentimentType == 'Negative') senTypeColor = colors.red;
                if (sentimentType == 'Positive') senTypeColor = colors.green;
                if (sentimentType == 'Neutral') senTypeColor = colors.grey;

                console.log('');
                console.log(senTypeColor(`${twHandle} sentiment cumulative is ${sentimentSum}`));
                console.log('');

                console.log(senTypeColor(`I think you are generally ${sentimentType}`));
                console.log('');

                whatNext(twHandle);

            }).catch(() => {
                console.log(colors.bgRed("error \n"));
                chooseTask(twHandle);
            });
        } else {
            console.log(colors.bgRed('An error occured \n TRY AGAIN \n'));
            chooseTask(twHandle);
        }
    });

}

function doEmotionAnalysis(twHandle) {
    client.get('statuses/user_timeline', {
        screen_name: twHandle,
        count: 50
    }, function(err, tweets, res) {
        if (!err) {
            var twObj = {
                tweets: tweets
            };
            var allPromise = [];

            twObj.tweets.forEach(function(values) {
                var obj = {
                    anger: 0,
                    disgust: 0,
                    fear: 0,
                    joy: 0,
                    sadness: 0.0
                };

                values = filterText(values.text);


                var eachPromise = new Promise(function(resolve, reject) {
                    alchemy_language.emotion({
                        text: values,
                        language: 'english'
                    }, function(err, response) {
                        if (err) {
                            reject(err);
                        } else {
                            if (response.docEmotions.anger) {
                                obj.anger += parseFloat(response.docEmotions.anger);
                            }
                            if (response.docEmotions.disgust) {
                                obj.disgust += parseFloat(response.docEmotions.disgust);
                            }
                            if (response.docEmotions.fear) {
                                obj.fear += parseFloat(response.docEmotions.fear);
                            }
                            if (response.docEmotions.joy) {
                                obj.joy += parseFloat(response.docEmotions.joy);
                            }
                            if (response.docEmotions.sadness) {
                                obj.sadness += parseFloat(response.docEmotions.sadness);
                            }
                            resolve(obj);
                        }
                    })
                });
                allPromise.push(eachPromise);
            });

            Promise.all(allPromise).then((result) => {
                var anger = 0
                var disgust = 0;
                var fear = 0;
                var joy = 0;
                var sadness = 0;
                result.forEach(function(value) {
                    anger += value.anger;
                    disgust += value.disgust;
                    fear += value.fear;
                    joy += value.joy;
                    sadness += value.sadness;
                });
                
                var emotionTable = new Table({
                    head: [colors.yellow('Emotion'), colors.yellow('Score')],
                    colWidths: [30, 20]
                })

                emotionTable.push(
                    ['Anger ', anger.toFixed(3)], ['Disgust ', disgust.toFixed(3)], ['Fear ', fear.toFixed(3)], ['Joy ', joy.toFixed(3)], ['Sadness ', sadness.toFixed(3)]
                );

                console.log('');
                console.log(colors.verbose.bold(`\t \t Emotion Analysis for ${twHandle}`));
                console.log('');
                console.log(colors.verbose(emotionTable.toString()));

                console.log(colors.verbose('Higher scores indicate higher corresponding emotion'));
                console.log(colors.red('Negative scores') + colors.verbose(' are possible'));

                console.log(colors.cyan('\n Thank you for trying out TwitSight \n USE APP AGAIN? \n'));
                whatNext(twHandle);

            }).catch((res) => {
                console.log(colors.red(res.statusInfo + '\n'));
                whatNext(twHandle);
            })

        }

    });
}



function makeWordFrequency(twHandle, twCount) {
    console.log(colors.verbose('\n How many words do you need? \n'));

    rl.question(colors.input(' Enter number here (e.g. 15): '), (wordsCount) => {
        console.log('');

        wordsCount = parseInt(wordsCount);

        if (wordsCount && typeof wordsCount == 'number') {

            console.log(colors.bgGreen(`${wordsCount} words Analysed`));

            console.log('');

            client.get('statuses/user_timeline', {
                screen_name: twHandle,
                count: twCount
            }, function(err, tweets, res) {
                if (!err) {
                    var twObj = {
                        tweets: tweets
                    };
                    var twLength = twObj.tweets.length;
                    var allTweet = '';
                    //do word frequency
                    for (let i = 0; i < twObj.tweets.length - 1; i++) {
                        allTweet += twObj.tweets[i].text;
                    }

                    words = wordsFrequency(allTweet);
                    let i = 1;

                    var wordFrequencyTable = new Table({
                        head: [colors.yellow('S/no.'), colors.yellow('Word'), colors.yellow('Frequency')],
                        colWidths: [10, 30, 20]
                    });

                    for (var key in words) {

                        if (key == wordsCount) break;
                        if (words.hasOwnProperty(key)) {
                            wordFrequencyTable.push(
                                [i, words[key].word, words[key].freq]
                            );
                            //console.log(colors.verbose(`Word: ${words[key].word} <===> Frequency: ${words[key].freq}`));
                        }
                        i++;
                    }

                    console.log('');
                    console.log(colors.verbose.bold(`\t \t Word Analysis for ${twHandle}`));
                    console.log(colors.verbose(wordFrequencyTable.toString()));
                    console.log('');

                    whatNext(twHandle);

                } else {
                    console.log(colors.bgRed('\n Sorry! An error occured. \n Pehaps bad internet'));
                    chooseTask(twHandle);
                }
            });
        } else {
            console.log(colors.bgRed('\n Oh no! You passed an invalid value\n'));
            console.log(colors.bgRed('\t TRY AGAIN\n'));
            makeWordFrequency(twHandle, twCount);
        }
    });
}

function howManyTweets(twHandle) {
    console.log(colors.red.bold('\t Note:! ') + colors.yellow.bold('Only numbers are allowed (E.g. 12)'));
    console.log('');
    console.log(colors.verbose(' How many tweets do you want to analyse?\n'));

    rl.question(colors.input(' Enter number here (e.g. 40)?: '), (twCount) => {
        console.log('');

        twCount = parseInt(twCount);
        if (twCount && typeof twCount == 'number') {

            console.log(colors.bgGreen(`${twCount} tweets prepared`));

            console.log('');

            makeWordFrequency(twHandle, twCount);

        } else {
            console.log(colors.bgRed('\n Oh no! You passed an invalid value\n'));
            console.log(colors.bgRed('\t TRY AGAIN \n'));
            howManyTweets(twHandle);
        }
    });

}

function enterHandle() {
    rl.question(colors.input('Enter a twitter handle: '), (twHandle) => {

        if (twHandle) {
            console.log('');
            console.log(colors.bgBlue('\t Verifying handle and saving tweets'));
            console.log(colors.silly('-------------------------------------------------'));

            doProgress(twHandle);

        } else {
            console.log(colors.bgRed(`\n ${err} \n An error occurred. Enter a valid twitter handle or check network connection \n`));
            rl.close();
        }
    });
}

function whatNext(twHandle) {
    console.log(colors.cyan.bold('\t \t MENU \n'));
    console.log(colors.cyan('\n 1. Word Frequency Analysis \n 2. Sentiment Analysis \n 3. Emotion Analysis \n 4. Enter a different handle \n 5. Ctrl C to exit App'));
    console.log();

    rl.question(colors.input('\n Enter a number here '), (task) => {

        task = parseInt(task);

        if (task && typeof task == 'number') {
            if (task == 1) doWordFrequencyAnalysis(twHandle); //do word
            if (task == 2) doSentimentAnalysis(twHandle); // do sentiment
            if (task == 3) doEmotionAnalysis(twHandle); //do emotion
            if (task == 4) enterHandle(); // enter new handle
        } else {
            console.log(colors.bgRed('\n You have entered a wrong value\n'));
            console.log(colors.bgRed('\t TRY AGAIN \n'));
            whatNext(twHandle);
        }
    });

}

exports.doProgress = doProgress;
exports.getTwitterUser = getTwitterUser;
exports.chooseTask = chooseTask;
exports.doWordFrequencyAnalysis = doWordFrequencyAnalysis;
exports.doSentimentAnalysis = doSentimentAnalysis;
exports.doEmotionAnalysis = doEmotionAnalysis;
exports.rl = rl;
exports.colors = colors;
exports.enterHandle = enterHandle;