var info;
var content;


chrome.runtime.onMessage.addListener(function (message, sender) {
    if (!info) {
        createInfo();
    }
    clearContent();
    info.style.display = 'block';
    if (message.hits === 0) {
        content.innerHTML = "No English Wiktionary article found for '" + message.selection + "'.";
        return;
    }
    content.innerHTML = generateInfoString(message.info);
});

function createInfo() {
    info = document.createElement('div');
    info.id = 'wikt-info';
    info.style.display = 'none';
    document.body.insertBefore(info, document.body.firstChild);

    var close = document.createElement('button');
    close.id = 'wikt-info-close';
    close.innerHTML = '&#10060;';
    close.addEventListener('click', function () {
        document.getElementById('wikt-info').style.display = 'none';
    });
    info.appendChild(close);

    var align = document.createElement('div')
    align.id = 'wikt-info-align'
    info.appendChild(align);

    content = document.createElement('div');
    content.id = 'wikt-info-content';
    align.appendChild(content);

    var footer = document.createElement('div');
    footer.id = 'wikt-info-footer';
    const wiktionaryLink = '<a href="https://www.wiktionary.org/">Wiktionary</a>';
    const licenseLink = '<a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/">Creative Commons Attribution-ShareAlike 3.0 Unported License</a>.'
    footer.innerHTML = 'This information is aggregated from ' + wiktionaryLink + ' under a ' + licenseLink;
    align.appendChild(footer);
}

function generateInfoString(data) {
    var parts = [];
    parts.push(data.title);
    parts.push(data.pronunciation ? ' (' + data.pronunciation + ')' : '');
    parts.push(': ');
    for (let pos of collectPos(data)) {
        parts.push(pos);
        if (data.inflections && data.inflections[pos]) {
            parts.push(' (' + data.inflections[pos].lemma + ', ' + data.inflections[pos].grammarInfos.join(', ') + ')');
        }
        parts.push(': ')
        if (data.definitions && data.definitions[pos]) {
            parts.push(data.definitions[pos].map((el, i) => (i + 1) + '. ' + el).join('; '));
        }
        parts.push('. ');
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
    return new Set(posList);
}

function clearContent() {
    while (content.lastChild) {
        content.removeChild(content.lastChild);
    }
}