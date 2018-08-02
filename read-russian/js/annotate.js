const MAX_HISTORY = 150;
const SLICED_HISTORY = 100;

var info;
var content;
var titles;


chrome.runtime.onMessage.addListener(function (message, sender) {
    if (!info) {
        createInfo();
    }
    if (message.infoString && message.titlesString) {
        content.innerHTML = message.infoString;
        titles.innerHTML = message.titlesString;
        return;
    }
    if (message.hits === 0) {
        const infoString = "No English Wiktionary article found for '" + message.selection + "'.";
        content.innerHTML = infoString;
        titles.innerHTML = '';
        store(message.selection, infoString, '');
        return;
    }
    const infoString = generateInfoString(message.info);
    content.innerHTML = infoString;
    const titlesString = '(' + message.info.titles.map(convertToLink).join(', ') + ')';
    if (titlesString) {
        titles.innerHTML = titlesString;
    }
    store(message.selection, infoString, titlesString);
});

function store(selection, infoString, titlesString) {
    chrome.storage.local.get('history', function (result) {
        var history = [];
        if (!chrome.runtime.lastError && result.history) {
            history = result.history;
        }
        history.push(selection);
        if (history.length > MAX_HISTORY) {
            let numRemoved = history.length - SLICED_HISTORY;
            history = history.slice(numRemoved);
            chrome.storage.local.remove(history.slice(0, numRemoved), function() {})
        }
        var setObj = {history: history};
        setObj[selection] = { infoString: infoString, titlesString: titlesString };
        chrome.storage.local.set(setObj, function () {});
    });
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
    licenseLink.innerText = 'Creative Commons Attribution-ShareAlike 3.0 Unported License';
    titles = document.createElement('span')
    titles.id = 'wikt-info-titles';
    titles.className = 'wikt-info-class';
    footer.appendChild(document.createTextNode('This information was aggregated from '));
    footer.appendChild(wiktionaryLink);
    footer.appendChild(titles);
    footer.appendChild(document.createTextNode(' under a '));
    footer.appendChild(licenseLink);
    footer.appendChild(document.createTextNode('.'));
    return footer;
}

function generateInfoString(data) {
    var parts = [];
    addTitleAndOrPronunciation(parts, data);
    const pos_set = collectPos(data);
    if (pos_set.size > 0) {
        parts.push(': ');
    }
    for (let pos of pos_set) {
        parts.push('<span class="pos">' + pos + '</span>');
        if (data.inflections && data.inflections[pos]) {
            const p = data.inflections[pos];
            parts.push(' (' + (p.lemma ? p.lemma : p.alternative) + grammarTags(data.inflections[pos].grammarInfos) + ')');
        }
        if (data.definitions && data.definitions[pos]) {
            parts.push(': ')
            if (data.definitions[pos].length === 1) {
                parts.push(data.definitions[pos][0].text);
            } else {
                parts.push(generateDefinitionsString(data.definitions[pos]));
            }
        }
        parts.push('. ');
    }
    return parts.join('');
}

function addTitleAndOrPronunciation(parts, data) {
    if (!data.pronunciation) {
        parts.push(data.title);
    } else if (normalize(data.pronunciation) == normalize(data.title)) {
        parts.push(data.pronunciation);
    } else {
        parts.push(data.title + ' [' + data.pronunciation + ']');
    }
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
    return word.normalize('NFD').replace(/[\u0300-\u0303]/g, '');
}