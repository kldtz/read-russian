import { collectInfo } from './wiktRequests.js'
import { sendMessage } from './utils.js'

const MENU_ITEM_ID = 'selectionContextMenu';

var selectionHandler = function (e) {
  if (e.menuItemId === MENU_ITEM_ID && e.selectionText) {
      collectInfo(e.selectionText)
          .then(info => sendMessage(info))
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