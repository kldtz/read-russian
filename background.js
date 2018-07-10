import parseArticle from './wiktParser.js'
import { findBestResult } from './utils.js'

var selectionHandler = function (e) {
  if (e.selectionText) {
    const url = 'https://en.wiktionary.org/w/api.php?action=query&format=json&list=search&utf8=1&srwhat=text&srsearch=' + e.selectionText;
    httpGetAsync(url, function (text) {
      const json = JSON.parse(text);
      const hits = parseInt(json.query.searchinfo.totalhits);
      if (hits > 0) {
        var title = findBestResult(e.selectionText, json.query.search.map(el => el.title));
        httpGetAsync('https://en.wiktionary.org/wiki/' + title + '?action=raw', function (article) {
          var info = parseArticle(article, title);
          alert(JSON.stringify(info));
          if (info.inflections) {
            for (let pos in info.inflections) {
              var link = info.inflections[pos].normalizedLemma;
              if (!link) {
                link = info.inflections[pos].alternative;
              }
              httpGetAsync('https://en.wiktionary.org/wiki/' + link + '?action=raw', function (lemmaArticle) {
                const lemmaInfo = parseArticle(lemmaArticle, link, new Set([pos]));
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