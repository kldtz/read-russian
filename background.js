import parseArticle from './wiktParser.js'

var selectionHandler = function (e) {
  if (e.selectionText) {
    const url = 'https://en.wiktionary.org/w/api.php?action=query&format=json&list=search&utf8=1&srwhat=text&srsearch=' + e.selectionText;
    httpGetAsync(url, function (text) {
      const json = JSON.parse(text);
      const hits = json.query.searchinfo.totalhits;
      if (parseInt(hits) > 0) {
        var title = json.query.search[0].title;
        httpGetAsync('https://en.wiktionary.org/wiki/' + title + '?action=raw', function (article) {
          const info = parseArticle(article);
          var infoString = 'Pronunciation: ' + info.pronunciation + '\n';
          for (var key in info.definitions) {
            infoString += key + ': ' + info.definitions[key];
          }
          alert(infoString);
        });
      }
    });
  }
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({})
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
  chrome.contextMenus.create({
    "title": "Get info for '%s'",
    "id": "selectionContextMenu",
    "contexts": ["selection"]
  });
  chrome.contextMenus.onClicked.addListener(selectionHandler);
});

chrome.runtime.onStartup.addListener(function () {
  chrome.contextMenus.create({
    "title": "Get info for '%s'",
    "id": "selectionContextMenu",
    "contexts": ["selection"]
  });
  chrome.contextMenus.onClicked.addListener(selectionHandler);
});

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", encodeURI(theUrl), true); // true for asynchronous 
  xmlHttp.send(null);
}