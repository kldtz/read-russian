import { collectInfo } from './wiktRequests.js'
import { sendMessage, localStorage } from './utils.js'

const MENU_ITEM_ID = 'selectionContextMenu';

const MAX_CACHE = 50;
const SLICED_CACHE = 25;
const CACHE = 'history';
const CACHE_SUFFIX = '--c';

var selectionHandler = function (e) {
  if (e.menuItemId === MENU_ITEM_ID && e.selectionText) {
    collectInfo(e.selectionText)
      .then(info => { sendMessage(info); cache(info); })
      .catch(rejectedItem => logError(rejectedItem));
  }
}

function logError(rejectedItem) {
  if (rejectedItem instanceof Error) {
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
    chrome.browserAction.setBadgeBackgroundColor({ color: "gray" });
  }
});

function cache(data) {
  if (data.cached) return;
  localStorage.get(CACHE)
    .then(updateCache.bind(data));
}

function updateCache(result) {
  const key = this.selection + CACHE_SUFFIX;
  var cache = [];
  if (!chrome.runtime.lastError && result[CACHE]) {
    cache = result[CACHE];
  }
  cache.push(key);
  if (cache.length > MAX_CACHE) {
    let numRemoved = cache.length - SLICED_CACHE;
    cache = cache.slice(numRemoved);
    chrome.storage.local.remove(cache.slice(0, numRemoved), function () { })
  }
  var setObj = {};
  setObj[CACHE] = cache;
  this.cached = true;
  setObj[key] = this;
  chrome.storage.local.set(setObj, function () { });
}