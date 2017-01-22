var sw = require('stopword');

function wordFrequency(sentences) {
    //sentences = sentences.replace(/href\s*=\s*(['"])(https?:\/\/.+?)\1/ig,''); //replace all urls
    sentences = sentences.replace(/[^\w\s]/gi, '');//remove all special characters
    sentences = sentences.replace(/[\s\n\t\r]+/g, ' '); //convert all multi-space to single-space
    sentences = sentences.split(' ').sort(); //sorting and spliting 

    sentences = sw.removeStopwords(sentences);
  
    var wordsObj = {};
    
    sentences.forEach(function (key) {
      if (wordsObj.hasOwnProperty(key)) {
        wordsObj[key]++;
      } else {
        wordsObj[key] = 1;
      }
    });

    
    
    
    var wordAndFreq = [];
    
    wordAndFreq = Object.keys(wordsObj).map(function(key) {
      return {
        word: key,
        freq: wordsObj[key]
      };
    });
  
    wordAndFreq.sort(function(a, b) {
      return b.freq - a.freq;
    });
  
    return wordAndFreq;

}


module.exports = wordFrequency;

