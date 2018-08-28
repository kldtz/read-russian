const MAX_CACHE = 50;
const SLICED_CACHE = 25;
const CACHE = 'history';
const CACHE_SUFFIX = '--c';

const MAX_FLASHCARDS = 200;
const FLASHCARDS = 'flashcards';
const FLASHCARD_SUFFIX = '--f';

var info;
var content;
var titles;
var maxCardsDiv;


chrome.runtime.onMessage.addListener(function (message, sender) {
    if (!info) {
        createInfo();
    }
    info.style.display = 'block';
    if (message.hits === 0) {
        content.innerHTML = "No English Wiktionary article found for '" + message.selection + "'.";
        titles.innerHTML = '';
        cache(message);
        return;
    }
    updateContent(content, message.info)
    const titlesString = generateTitlesString(message.info.titles);
    if (titlesString) {
        titles.innerHTML = titlesString;
    }
    cache(message);
});

function generateTitlesString(titles) {
    return '(' + titles.map(convertToLink).join(', ') + ')';
}

function cache(message) {
    const key = message.selection + CACHE_SUFFIX;
    chrome.storage.local.get(CACHE, function (result) {
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
        setObj[key] = message;
        chrome.storage.local.set(setObj, function () { });
    });
}

function storeFlashcard() {
    const key = this.lemma + '--' + this.pos + FLASHCARD_SUFFIX;
    const card = this;
    chrome.storage.local.get([key, FLASHCARDS], function (result) {
        var flashcards = [];
        if (!chrome.runtime.lastError && result[FLASHCARDS] != undefined) {
            flashcards = result[FLASHCARDS];
            if (flashcards.length >= MAX_FLASHCARDS) {
                if (!maxCardsDiv) {
                    maxCardsDiv = createMaxCardsDiv();
                }
                maxCardsDiv.style.display = 'block';
                info.style.display = 'none';
                return;
            }
        }
        if (result[key]) {
            return;
        }
        flashcards.push(key);
        var setObj = {};
        setObj[FLASHCARDS] = flashcards;
        setObj[key] = card;
        chrome.storage.local.set(setObj, function () {
            if (flashcards.length >= MAX_FLASHCARDS) {
                if (!maxCardsDiv) {
                    maxCardsDiv = createMaxCardsDiv();
                }
                maxCardsDiv.style.display = 'block';
                info.style.display = 'none';
            }
            chrome.runtime.sendMessage({ badgeText: String(flashcards.length) });
        });
    });
}

function createMaxCardsDiv() {
    var maxCardsDiv = document.createElement('div');
    maxCardsDiv.id = 'max-flashcards-dialog';

    var close = document.createElement('button');
    close.id = 'max-cards-div-close';
    close.innerHTML = '&#10060;';
    close.addEventListener('click', function () {
        maxCardsDiv.style.display = 'none';
        info.style.display = 'block';
    });
    maxCardsDiv.appendChild(close);

    var message = document.createElement('div');
    message.id = 'max-flashcards-message';
    message.innerHTML = '<div>You have reached the limit of ' + MAX_FLASHCARDS +
        ' flashcards. Please (export and) delete your cards before you continue!</div>' +
        '<div id="max-flashcard-sub">Click on the extension\'s toolbar icon to find the export and delete options.</div>';
    maxCardsDiv.appendChild(message);

    document.body.insertBefore(maxCardsDiv, document.body.firstChild);
    return maxCardsDiv;
}

function convertToLink(title) {
    return '<a href="https://en.wiktionary.org/wiki/' + title + '">' + title + '</a>';
}

function createInfo() {
    info = document.createElement('div');
    info.id = 'wikt-info';
    info.className = 'wikt-info-class';
    info.style.display = 'none';
    document.body.insertBefore(info, document.body.firstChild);

    var close = document.createElement('button');
    close.id = 'wikt-info-close';
    close.className = 'wikt-info-class';
    close.innerHTML = '&#10060;';
    close.addEventListener('click', function () {
        document.getElementById('wikt-info').style.display = 'none';
    });
    info.appendChild(close);

    var align = document.createElement('div')
    align.id = 'wikt-info-align';
    align.className = 'wikt-info-class';
    info.appendChild(align);

    content = document.createElement('div');
    content.id = 'wikt-info-content';
    content.className = 'wikt-info-class';
    align.appendChild(content);

    align.appendChild(createFooter());

    info.style.display = 'block';
}

function createFooter() {
    var footer = document.createElement('div');
    footer.id = 'wikt-info-footer';
    footer.className = 'wikt-info-class';
    var wiktionaryLink = document.createElement('a');
    wiktionaryLink.href = 'https://www.wiktionary.org/';
    wiktionaryLink.innerText = 'Wiktionary';
    var licenseLink = document.createElement('a');
    licenseLink.href = 'http://creativecommons.org/licenses/by-sa/3.0/';
    licenseLink.innerText = 'CC BY-SA 3.0';
    licenseLink.title = 'Creative Commons Attribution-ShareAlike 3.0 Unported';
    titles = document.createElement('span')
    titles.id = 'wikt-info-titles';
    titles.className = 'wikt-info-class';
    footer.appendChild(document.createTextNode('This information was aggregated from '));
    footer.appendChild(wiktionaryLink);
    footer.appendChild(titles);
    footer.appendChild(document.createTextNode(' under '));
    footer.appendChild(licenseLink);
    footer.appendChild(document.createTextNode('.'));
    return footer;
}

function updateContent(div, data) {
    removeChildren(div);
    div.appendChild(createTitleAndPronunciation(data));
    // add colon
    const pos_set = collectPos(data);
    if (pos_set.size > 0) {
        div.appendChild(document.createTextNode(': '));
        // add features and definitions
        for (let pos of pos_set) {
            div.appendChild(createPosSpan(data, pos));
            div.appendChild(document.createTextNode('. '));
        }
    }
}

function createPosSpan(data, pos) {
    var card = { pos: pos, lemma: data.title, pronunciation: data.pronunciation };
    var posLemma = document.createElement('span');
    var parts = [pos];
    if (data.inflections && data.inflections[pos]) {
        const p = data.inflections[pos];
        const lemma = p.lemma ? p.lemma : p.alternative;
        card.pronunciation = lemma;
        card.lemma = normalize(lemma);
        parts.push(' (' + lemma + grammarTags(data.inflections[pos].grammarInfos) + ')');
    }
    if (data.definitions && data.definitions[pos]) {
        parts.push(': ');
        if (data.definitions[pos].length === 1) {
            card.definitions = data.definitions[pos][0].text;
            parts.push(card.definitions);
        } else {
            card.definitions = generateDefinitionsString(data.definitions[pos]);
            parts.push(card.definitions);
        }
        posLemma.className = 'flashcard-option';
        posLemma.title = "Save flashcard for '" + card.lemma + " (" + card.pos + ")'";
        posLemma.addEventListener('click', storeFlashcard.bind(card));
    }
    posLemma.innerHTML = parts.join('');
    return posLemma;
}

function removeChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function createTitleAndPronunciation(data) {
    var title = document.createElement('span');
    title.id = 'titleAndPronunciation'
    if (!data.pronunciation) {
        title.innerHTML = data.title;
    } else if (normalize(data.pronunciation) == normalize(data.title)) {
        title.innerHTML = data.pronunciation;
    } else {
        title.innerHTML = data.title + ' [' + data.pronunciation + ']';
    }
    return title;
}

function grammarTags(grammarInfos) {
    if (!grammarInfos) {
        return '';
    }
    const tags = grammarInfos.join('|');
    return ', <span class="tags">' + tags + '</span>';
}

function generateDefinitionsString(definitions) {
    var lastDepth = 0;
    var num = 1;
    var parts = [];
    for (let def of definitions) {
        if (def.depth > 2) continue;
        if (parts.length > 0) {
            if (lastDepth < def.depth) {
                parts.push(': ');
            } else {
                parts.push('; ');
            }
        }
        if (def.depth === 1) {
            parts.push('<span class="sense-num">' + num++ + '. ' + '</span>');
        }
        parts.push(def.text);
        lastDepth = def.depth;
    }
    return parts.join('');
}

function collectPos(data) {
    var posList = [];
    if (data.inflections) {
        posList.push(...Object.keys(data.inflections));
    }
    if (data.definitions) {
        posList.push(...Object.keys(data.definitions));
    }
    posList.sort();
    return new Set(posList);
}

function normalize(word) {
    return word.normalize('NFD').replace(/[\u0300-\u0303\u0308]/g, '');
}