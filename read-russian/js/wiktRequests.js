import parseArticle from './wiktParser.js'
import { findBestResult, httpGetPromise, alt, normalizeUrl, localStorage } from './utils.js'

const EN_WIKI = 'https://en.wiktionary.org/wiki/';
const EN_WIKT_API = 'https://en.wiktionary.org/w/api.php?';
const QUERY = 'action=query&format=json&list=search&utf8=1&srwhat=text&srlimit=30&srprop=size&srsearch=';
const CACHE_SUFFIX = '--c';

function collectInfo(selection) {
    var data = { selection: selection };
    const cacheKey = selection + CACHE_SUFFIX;
    return localStorage.get(cacheKey)
        .then(items => {
            if (!items[cacheKey]) {
                return Promise.resolve('No cached value');
            }
            return Promise.reject({ message: 'Found cached value', info: items[cacheKey] });
        }, error => {
            return Promise.resolve('No cached value')
        })
        .then(() => httpGetPromise(EN_WIKT_API + QUERY + selection))
        .then(searchForSelection.bind(data))
        .then(title => httpGetPromise(EN_WIKI + normalizeUrl(title) + '?action=raw'))
        .then(processBestResult.bind(data))
        .then(processLinkedArticles.bind(data))
        .catch(handleReject);
}

function searchForSelection(text) {
    const json = JSON.parse(text);
    if (json.error) {
        return Promise.reject(json.error);
    }
    this.hits = parseInt(json.query.searchinfo.totalhits);
    if (this.hits === 0) {
        return Promise.reject({ message: 'Zero hits', info: this });
    }
    const title = findBestResult(this.selection, json.query.search.map(el => el.title));
    this.title = title;
    return title;
}

function processBestResult(article) {
    this.info = parseArticle(article, this.title);
    this.info.titles = [this.title];
    return followLinks(this);
}

function followLinks(data) {
    var promises = [];
    data.posLinkPairs = data.info.collectPosLinkPairs();
    for (let pair of data.posLinkPairs) {
        promises.push(httpGetPromise(EN_WIKI + normalizeUrl(pair.link) + '?action=raw'));
    }
    return Promise.all(promises);
}

function processLinkedArticles(articles) {
    for (let i = 0; i < articles.length; i++) {
        let pair = this.posLinkPairs[i];
        const lemmaInfo = parseArticle(articles[i], pair.link, new Set([pair.pos]));
        this.info.merge(lemmaInfo);
    }
    if (this.posLinkPairs) {
        delete this.posLinkPairs;
    }
    return Promise.resolve(this);
}

function handleReject(rejectedItem) {
    if (rejectedItem.message && (rejectedItem.message === 'Zero hits' || rejectedItem.message == 'Found cached value')) {
        return Promise.resolve(rejectedItem.info);
    } else {
        return Promise.reject(rejectedItem);
    }
}

export { collectInfo, QUERY, EN_WIKI, EN_WIKT_API };