chrome.runtime.onMessage.addListener(function (message, sender) {
    clearInfoSpan();
    info.style.display = 'block';
    if (message.hits === 0) {
        span.innerHTML = "No English Wiktionary article found for '" + message.selection + "'.";
        return;
    } 
    span.innerHTML = generateInfoString(message.info);
});

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

function clearInfoSpan() {
    while (span.lastChild) {
        span.removeChild(span.lastChild);
    }
}

var info = document.createElement('div');
info.id = 'wikt-info';
info.style.display = 'none';
document.body.insertBefore(info, document.body.firstChild);

var span = document.createElement('span');
info.appendChild(span);

var close = document.createElement('button');
close.id = 'wikt-info-close';
close.innerHTML = '&#10060;';
close.addEventListener('click', function() {
    document.getElementById('wikt-info').style.display = 'none';
});
info.appendChild(close);