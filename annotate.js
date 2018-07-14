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

    content = document.createElement('span');
    info.appendChild(content);

    var close = document.createElement('button');
    close.id = 'wikt-info-close';
    close.innerHTML = '&#10060;';
    close.addEventListener('click', function () {
        document.getElementById('wikt-info').style.display = 'none';
    });
    info.appendChild(close);
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