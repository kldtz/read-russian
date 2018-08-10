import { localStorage, download } from './utils.js'

const DOUBLE_QUOTES = /"/g;
const CACHE_SUFFIX = '--c';
const FLASHCARDS = 'flashcards';

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
                vocabList.push(quote(extractSelection(k)) + ',' + quote(cleanInfo(v.infoString)));
            }
            const content = vocabList.join('\n');
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            return download({
                url: url,
                saveAs: true
            });
        })
        .catch(rejectedItem => {
            if (rejectedItem === 'Empty history!') {
                alert('No flashcards to export!');
            } else {
                console.error(JSON.stringify(rejectedItem));
            }
        });
}

function extractSelection(cacheKey) {
    return cacheKey.slice(0, cacheKey.length - CACHE_SUFFIX.length);
}

function quote(value) {
    return '"' + value.replace(DOUBLE_QUOTES, '""') + '"';
}

function cleanInfo(value) {
    return value.replace(/title="Save as flashcard"/g, '');
}

function deleteFlashcards() {
    localStorage.get(FLASHCARDS)
        .then(items => {
            if (!items[FLASHCARDS]) {
                return Promise.reject('No flashcards!');
            }
            return localStorage.remove(items[FLASHCARDS].concat(FLASHCARDS));
        })
        .then(() => {
            updateCacheElements();
        })
        .catch(rejectedItem => {
            if (rejectedItem === 'No flashcards!') {
                alert('No flashcards to export!');
            } else {
                console.error(JSON.stringify(rejectedItem));
            }
        });
}

function updateCacheElements() {
    var size = 0;
    localStorage.get(FLASHCARDS)
        .then(items => {
            if (items[FLASHCARDS]) {
                size = items[FLASHCARDS].length;
            }
        })
        .catch(_ => {
            // ignore rejections
         })
        .finally(() => {
            document.querySelector('#flashcard-info').innerHTML = size + '/100';
            if (size > 0) {
                createButtons();
            }
        });
}

function createButtons() {
    var buttonDiv = document.querySelector('#buttons');

    var saveFlashcardsButton = document.createElement('a');
    saveFlashcardsButton.id = 'save-flashcards';
    saveFlashcardsButton.innerHTML = 'Export Flashcards';
    saveFlashcardsButton.title = 'Export flashcards in CSV format'
    saveFlashcardsButton.addEventListener('click', saveFlashcards);
    buttonDiv.appendChild(saveFlashcardsButton);

    var sep = document.createElement('span');
    sep.innerHTML = ' | ';
    buttonDiv.appendChild(sep);

    var clearCacheButton = document.createElement('a');
    clearCacheButton.id = 'clear-cache';
    clearCacheButton.innerHTML = 'Clear Storage';
    clearCacheButton.title = 'Delete all flashcards';
    clearCacheButton.addEventListener('click', deleteFlashcards);
    buttonDiv.appendChild(clearCacheButton);
}

updateCacheElements();