chrome.runtime.onMessage.addListener(function (message, sender) {
    clearInfoDiv();
    if (message.hits === 0) {
        info.innerHTML = "No English Wiktionary article found for '" + message.selection + "'.";
        return;
    } 
    info.innerHTML = generateInfoDiv(message.info);
});

function generateInfoDiv(data) {
    var div = [];
    div.push(data.title);
    div.push(data.pronunciation ? ' (' + data.pronunciation + ')' : '');
    div.push(': ');
    for (let pos of collectPos(data)) {
        div.push(pos);
        if (data.inflections && data.inflections[pos]) {
            div.push(' (' + data.inflections[pos].lemma + ', ' + data.inflections[pos].grammarInfos.join(', ') + ')');
        }
        div.push(': ')
        if (data.definitions && data.definitions[pos]) {
            div.push(data.definitions[pos].map((el, i) => (i + 1) + '. ' + el).join('; '));
        }
        div.push('. ');
    }
    return div.join('');
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

function clearInfoDiv() {
    while (info.lastChild) {
        info.removeChild(info.lastChild);
    }
}

var info = document.createElement("div");
info.id = 'wikt-info';
document.body.insertBefore(info, document.body.firstChild);
