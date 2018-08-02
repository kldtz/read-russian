import { localStorage } from './utils.js'

const DOUBLE_QUOTES = /"/g;

document.addEventListener('DOMContentLoaded', function () {
    var links = document.getElementsByTagName("a");
    for (let link of links) {
        (function () {
            var location = link.href;
            link.onclick = function () {
                chrome.tabs.create({ active: true, url: location });
            };
        })();
    }
});

function saveFlashcards() {
    localStorage.get('history')
        .then(items => {
            if (!items.history) {
                return Promise.reject('Empty history!');
            }
            return localStorage.get(items.history);
        })
        .then(items => {
            var vocabList = [];
            for (let [k, v] of Object.entries(items)) {
                if (!v.infoString || v.infoString.startsWith('No English Wiktionary article found')) {
                    continue;
                }
                vocabList.push(quote(k) + ',' + quote(v.infoString));
            }
            const content = vocabList.join('\n');
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                saveAs: true
            });
        })
        .catch(rejectedItem => {
            if (rejectedItem === 'Empty history!') {
                alert('Empty history!');
            } else {
                console.error(JSON.stringify(rejectedItem));
            }
        });
}

function quote(value) {
    return '"' + value.replace(DOUBLE_QUOTES, '""') + '"';
}

function clearCache() {
    chrome.storage.local.clear(function() {
        updateCacheElements();
    });
}

function updateCacheElements() {
    var size = 0;
    localStorage.get('history')
    .then(items => {
        if (items.history) {
            size = items.history.length;
        }
        document.querySelector('#history-info').innerHTML = size + '/200';
        if (size > 0) {
            createButtons();
        }
    });
}

function createButtons() {
    var buttonDiv = document.querySelector('#buttons');

    var saveFlashcardsButton = document.createElement('a');
    saveFlashcardsButton.id = 'save-flashcards';
    saveFlashcardsButton.innerHTML = 'Save Flashcards';
    saveFlashcardsButton.title = 'Save flashcards in CSV format'
    saveFlashcardsButton.addEventListener('click', saveFlashcards);
    buttonDiv.appendChild(saveFlashcardsButton);

    var sep = document.createElement('span');
    sep.innerHTML = ' | ';
    buttonDiv.appendChild(sep);

    var clearCacheButton = document.createElement('a');
    clearCacheButton.id = 'clear-cache';
    clearCacheButton.innerHTML = 'Clear Cache';
    clearCacheButton.title = 'Reset collected words';
    clearCacheButton.addEventListener('click', clearCache);
    buttonDiv.appendChild(clearCacheButton);
}

updateCacheElements();