import parseArticle from './wiktParser.js'
import { findBestResult, httpGetAsync } from './utils.js'

const EN_WIKT_API = 'https://en.wiktionary.org/w/api.php?';
const QUERY = 'action=query&format=json&list=search&utf8=1&srwhat=text&srlimit=30&srprop=size&srsearch=';

var selectionHandler = function (e) {
  if (e.selectionText) {
    const url = EN_WIKT_API + QUERY + e.selectionText;
    httpGetAsync(url, annotateSelection.bind({ selection: e.selectionText }));
  }
}

function annotateSelection(text) {
  const json = JSON.parse(text);
  this.hits = parseInt(json.query.searchinfo.totalhits);
  if (this.hits === 0) {
    sendMessage(this);
    return;
  }
  this.title = findBestResult(this.selection, json.query.search.map(el => el.title));
  httpGetAsync('https://en.wiktionary.org/wiki/' + this.title + '?action=raw', processBestResult.bind(this));
}

function processBestResult(article) {
  var info = parseArticle(article, this.title);
  info.titles = [this.title];
  this.info = info;
  if (info.inflections) {
    for (let pos in info.inflections) {
      if (info.definitions && info.definitions.pos) {
        continue;
      }
      let link = info.inflections[pos].normalizedLemma;
      if (!link) {
        link = info.inflections[pos].alternative;
      }
      httpGetAsync('https://en.wiktionary.org/wiki/' + link + '?action=raw', parseLemmaArticle.bind({data:this, link:link, pos:pos}));
    }
  } else {
    sendMessage(this);
  }
}

function parseLemmaArticle(lemmaArticle) {
  const lemmaInfo = parseArticle(lemmaArticle, this.link, new Set([this.pos]));
  mergeDefinitions(this.data.info, lemmaInfo);
  sendMessage(this.data);
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

chrome.runtime.onInstalled.addListener(function () {
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