import parseArticle from './wiktParser.js'
import { findBestResult, httpGetPromise, alt, normalize, localStorage } from './utils.js'

const MENU_ITEM_ID = 'selectionContextMenu';
const EN_WIKI = 'https://en.wiktionary.org/wiki/';
const EN_WIKT_API = 'https://en.wiktionary.org/w/api.php?';
const QUERY = 'action=query&format=json&list=search&utf8=1&srwhat=text&srlimit=30&srprop=size&srsearch=';
const CACHE_SUFFIX = '--c';

var selectionHandler = function (e) {
  if (e.menuItemId === MENU_ITEM_ID && e.selectionText) {
    var data = { selection: e.selectionText };
    const cacheKey = e.selectionText + CACHE_SUFFIX;
    localStorage.get(cacheKey)
      .then(items => {
        if (!items[cacheKey]) {
          return Promise.resolve('No cached value');
        }
        sendMessage(items[cacheKey]);
        return Promise.reject('Found cached value');
      }, error => {
        console.warn(JSON.stringify(error));
        return Promise.resolve('No cached value')
      })
      .then(() => httpGetPromise(EN_WIKT_API + QUERY + e.selectionText))
      .then(searchForSelection.bind(data))
      .then(title => httpGetPromise(EN_WIKI + normalize(title) + '?action=raw'))
      .then(processBestResult.bind(data))
      .then(processLinkedArticles.bind(data))
      .catch(handleReject);
  }
}

function searchForSelection(text) {
  const json = JSON.parse(text);
  if (json.error) {
    return Promise.reject(json.error);
  }
  this.hits = parseInt(json.query.searchinfo.totalhits);
  if (this.hits === 0) {
    sendMessage(this);
    return Promise.reject('Zero hits');
  }
  const title = findBestResult(this.selection, json.query.search.map(el => el.title));
  this.title = title;
  return title;
}

function processBestResult(article) {
  this.info = parseArticle(article, this.title);
  this.info.titles = [this.title];
  return followLinks(this);
}

function followLinks(data) {
  var promises = [];
  if (data.info.inflections) {
    data.posLinkPairs = collectPosLinkPairs(data.info);
    for (let pair of data.posLinkPairs) {
      promises.push(httpGetPromise(EN_WIKI + normalize(pair.link) + '?action=raw'));
    }
  }
  return Promise.all(promises);
}

function collectPosLinkPairs(info) {
  if (!info.inflections) {
    return [];
  }
  var posLinkPairs = [];
  for (let pos in info.inflections) {
    if (info.definitions && info.definitions[pos]) {
      continue;
    }
    let iipos = info.inflections[pos];
    let link = alt(iipos.normalizedLemma, iipos.alternative);
    posLinkPairs.push({ pos: pos, link: link });
  }
  return posLinkPairs;
}

function processLinkedArticles(articles) {
  for (let i = 0; i < articles.length; i++) {
    let pair = this.posLinkPairs[i];
    const lemmaInfo = parseArticle(articles[i], pair.link, new Set([pair.pos]));
    mergeDefinitions(this.info, lemmaInfo);
  }
  if (this.posLinkPairs) {
    delete this.posLinkPairs;
  }
  sendMessage(this);
}

function mergeDefinitions(info, newInfo) {
  if (!newInfo.definitions) {
    return;
  }
  if (!info.definitions) {
    info.definitions = {};
  }
  for (var pos in newInfo.definitions) {
    if (!(pos in info.definitions)) {
      info.definitions[pos] = newInfo.definitions[pos]
    }
  }
  info.titles.push(newInfo.title);
}

function sendMessage(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, data);
  });
}

function handleReject(rejectedItem) {
  if (rejectedItem === 'Zero hits' || rejectedItem == 'Found cached value') {
    // OK
  } else if (rejectedItem instanceof Error) {
    console.error(rejectedItem.stack);
  } else {
    console.error(JSON.stringify(rejectedItem));
  }
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.clear(function () { });
  chrome.contextMenus.create({
    "title": "Get info for '%s'",
    "id": MENU_ITEM_ID,
    "contexts": ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(selectionHandler);

chrome.runtime.onMessage.addListener(function (message, sender, _) {
  if (message.badgeText != undefined) {
    chrome.browserAction.setBadgeText({ text: message.badgeText });
    chrome.browserAction.setBadgeBackgroundColor({color: "gray"});
  }
});