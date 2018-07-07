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
          var info = parseArticle(article, title);
          if (!info.definitions && info.inflections) {
            for (var pos in info.inflections) {
              var normalizedLemma = info.inflections[pos].normalizedLemma;
              httpGetAsync('https://en.wiktionary.org/wiki/' + normalizedLemma + '?action=raw', function (lemmaArticle) {
                const lemmaInfo = parseArticle(lemmaArticle, normalizedLemma, new Set([pos]));
                mergeDefinitions(info, lemmaInfo);
                sendMessage(info);
              });
            }
          } else {
            sendMessage(info);
          }
        });
      }
    });
  }
}

function mergeDefinitions(info, newInfo) {
  if (!info.definitions) {
    info.definitions = {};
  }
  for (var pos in newInfo.definitions) {
    if (!(pos in info.definitions)) {
      info.definitions[pos] = newInfo.definitions[pos]
    }
  }
}

function sendMessage(info) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { data: info });
  });
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