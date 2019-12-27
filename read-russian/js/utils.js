const CYRILLIC = /^[\u0300-\u036F\u0410-\u045Fо́\-]+$/;

function findBestResult(searchTerm, titles) {
    var swTitles = titles.filter(title => title.split(/\s+/).length === 1);
    if (swTitles.length === 0) {
        return titles[0]; // default: first result 
    }
    searchTerm = searchTerm.toLowerCase();
    searchTerm = normalize(searchTerm);
    // return element that has maximal common prefix length with search term
    const maxCplIndex = swTitles.map(title => normalize(title).toLowerCase())
        .map(title => commonPrefixLength(title, searchTerm))
        .reduce((maxIndex, cpl, i, cpls) => {
            return cpl > cpls[maxIndex] ? i : maxIndex;
        }, 0);
    return swTitles[maxCplIndex];
}

function commonPrefixLength(a, b) {
    const l = a.length;
    var cpl = 0;
    while (cpl < l && a.charAt(cpl) === b.charAt(cpl)) cpl++;
    return cpl;
}

function normalize(word) {
    return word.normalize('NFD').replace(/[\u0300-\u0303\u0308]/g, '');
}

function normalizeUrl(word) {
    return word.normalize('NFD').replace(/[\u0300-\u0303]/g, '');
}

function isCyrillic(word) {
    return CYRILLIC.test(word);
}

function titleCase(word) {
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
}

function peek(stack) {
    return stack[stack.length - 1];
}

function countChar(c, line) {
    var i = 0;
    while (line[i] === c) {
        i++;
    }
    return i;
}

function alt(a, b) {
    return a ? a : b ? b : '';
}

function findFirst(array, property) {
    for (let el of array) {
        if (property(el)) {
            return el;
        }
    }
    return null;
}

function httpGetPromise(url) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (this.status == 200) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        }
        xhr.open("GET", encodeURI(url), true);
        xhr.send();
    });
}

var localStorage = {
    get: (keys) => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (items) => {
                let lastErr = chrome.runtime.lastErr;
                if (lastErr) {
                    reject(lastErr);
                } else {
                    resolve(items);
                }
            })
        });
    },
    set: (items) => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(items, () => {
                let lastError = chrome.runtime.lastError;
                if (lastError) {
                    reject(lastError);
                } else {
                    resolve();
                }
            });
        });
    },
    getBytesInUse: (keys) => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.getBytesInUse(keys, (items) => {
                let lastError = chrome.runtime.lastError;
                if (lastError) {
                    reject(lastError);
                } else {
                    resolve(items);
                }
            });
        });
    },
    remove: (keys) => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(keys, () => {
                let lastError = chrome.runtime.lastError;
                if (lastError) {
                    reject(lastError);
                } else {
                    resolve();
                }
            });
        });
    },
    clear: () => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.clear(() => {
                let lastError = chrome.runtime.lastError;
                if (lastError) {
                    reject(lastError);
                } else {
                    resolve();
                }
            });
        });
    }
}

function download(options) {
    return new Promise((resolve, reject) => {
        chrome.downloads.download(options, id => {
            let lastErr = chrome.runtime.lastErr;
            if (lastErr) {
                reject(lastErr);
            } else {
                resolve({ downloadId: id, message: 'download error' });
            }
        });
    })
}

function sendMessage(data) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, data);
    });
}

function queryTabPromise() {
    return new Promise((resolve, _) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            resolve(tabs);
        });
    });
}

export {
    findBestResult, normalize, normalizeUrl, isCyrillic, titleCase, peek, countChar,
    alt, findFirst, httpGetPromise, localStorage, download, sendMessage, queryTabPromise
};