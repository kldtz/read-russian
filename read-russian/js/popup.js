import { localStorage, download } from './utils.js'

const DOUBLE_QUOTES = /"/g;
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
    localStorage.get(FLASHCARDS)
        .then(items => {
            if (!items[FLASHCARDS]) {
                return Promise.reject('No Flashcards!');
            }
            return localStorage.get(items[FLASHCARDS]);
        })
        .then(items => {
            var vocabList = [];
            for (let [k, v] of Object.entries(items)) {
                vocabList.push(createFlashcard(k, v));
            }
            const content = vocabList.join('\n');
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            return download({
                url: url,
                saveAs: true,
                filename: 'Russian_flashcards_' + Date.now() + '.csv'
            });
        })
        .catch(rejectedItem => {
            if (rejectedItem === 'No Flashcards!') {
                alert('No flashcards to export!');
            } else {
                console.error(JSON.stringify(rejectedItem));
            }
        });
}

function createFlashcard(k, v) {
    const lemma = extractLemma(k);
    var fields = [
        quote(lemma), 
        quote(v.definitions),
        quote(v.context ? v.context : ''),
        quote(v.pronunciation ? v.pronunciation : lemma),
        quote(v.pos.toLowerCase() + (v.grammarInfos ? ', ' + v.grammarInfos : ''))
    ];
    return fields.join(',');
}

function extractLemma(value) {
    return value.split('--')[0];
}

function quote(value) {
    return '"' + value.replace(DOUBLE_QUOTES, '""') + '"';
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
            chrome.runtime.sendMessage({ badgeText: '' });
        })
        .catch(rejectedItem => {
            if (rejectedItem === 'No flashcards!') {
                // OK
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
            document.querySelector('#flashcard-info').innerHTML = size + '/200';
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