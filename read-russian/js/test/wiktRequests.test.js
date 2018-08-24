import fs from 'fs';
import test from 'ava';
import sinon from 'sinon';
import * as wiktRequests from '../wiktRequests.js';
import * as utils from '../utils.js'

var localStorageStub;
var httpGetPromiseStub;

test.before(t => {
    localStorageStub = sinon.stub(utils.localStorage, 'get');
    httpGetPromiseStub = sinon.stub(utils, 'httpGetPromise');
});

test.afterEach(t => {
    localStorageStub.reset();
    httpGetPromiseStub.reset();
})

test('Collects expected information from article', t => {
    const selection = 'число';
    localStorageStub.resolves({});
    const responseString = fs.readFileSync('test/data/successful-search.json').toString();
    httpGetPromiseStub.withArgs(wiktRequests.EN_WIKT_API + wiktRequests.QUERY + selection).resolves(responseString);
    const article = fs.readFileSync('test/data/число.wiki').toString();
    httpGetPromiseStub.withArgs(wiktRequests.EN_WIKI + selection + '?action=raw').resolves(article);

    return wiktRequests.collectInfo(selection).then(result => {
        t.is(result.title, selection);
        t.is(result.info.pronunciation, 'число́');
        t.is(result.info.definitions.Noun[0].text, 'cardinal number');
    });
});

test('Returns selection and zero hits', t => {
    const selection = 'Blupp';
    localStorageStub.resolves({});
    const responseString = fs.readFileSync('test/data/unsuccessful-search.json').toString();
    httpGetPromiseStub.withArgs(wiktRequests.EN_WIKT_API + wiktRequests.QUERY + selection).resolves(responseString);

    return wiktRequests.collectInfo(selection).then(result => {
        t.is(result.hits, 0);
        t.is(result.selection, selection);
    });
});

test('Returns rejected item on error', t => {
    localStorageStub.resolves({});
    httpGetPromiseStub.resolves('{"error": {"reason": "test"}}');

    return wiktRequests.collectInfo('test').catch(rejected => {
        t.is(rejected.reason, 'test');
    });
});

test('Returns value from local storage if present', t => {
    const selection = 'test';
    localStorageStub.resolves({ 'test--c': { title: selection } });

    return wiktRequests.collectInfo(selection).then(result => {
        t.is(result.title, selection);
    });
});