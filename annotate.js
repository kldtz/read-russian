chrome.runtime.onMessage.addListener(function (message, sender) {
    clearInfoDiv();
    var data = message.data;
    addTitle(data.title);
    if (data.definitions) {
        addDefinitions(data.definitions);
    }
});

function clearInfoDiv() {
    while (info.lastChild) {
        info.removeChild(info.lastChild);
    }
}

function addTitle(title) {
    var h1 = document.createElement('h1');
    h1.textContent = title;
    info.appendChild(h1);
}

function addDefinitions(definitions) {
    for (let pos in definitions) {
        var posH2 = document.createElement('h2');
        posH2.textContent = pos
        info.appendChild(posH2);
        var ol = document.createElement('ol');
        for (let def of definitions[pos]) {
            var li = document.createElement('li');
            li.textContent = def;
            ol.appendChild(li)
        }
        info.appendChild(ol);
    }
}

var info = document.createElement("div");
info.id = 'wikt-info';
document.body.insertBefore(info, document.body.firstChild);
