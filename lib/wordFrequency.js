var sw = require('stopword');

function filterText(text){
    text = text.replace(/(?:^|[ ])[@#]([a-zA-Z]+)/gm, ''); //Remove handles and hashtags
    text = text.replace(/(?:https?|ftp|http):\/\/[\n\S]+/g, ''); //Remove links/urls
    text = text.replace(/[^\w\s]/gi, '');//remove all special characters
    text = text.replace(/[\s\n\t\r]+/g, ' '); //convert all multi-space to single-space
    text = text.split(' ').sort(); //sorting and spliting 
    text = sw.removeStopwords(text);
    return text;
}

function wordFrequency(sentences) {

    sentences = filterText(sentences)
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


exports.wordFrequency = wordFrequency;
exports.filterText = filterText;


