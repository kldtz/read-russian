import test from 'ava';
import fs from 'fs';

import parseArticle from '../wiktParser.js'

test('readsOnlyRussianSection', t => {
        const article = fs.readFileSync('test/data/число.wiki').toString();
        
        const info = parseArticle(article, 'число');

        t.is(info.pronunciation, 'число́');
        t.is(info.definitions.Noun.length, 4);
});

test('recognizesDefaultPronunciation', t => {
        const article = fs.readFileSync('test/data/вряд.wiki').toString();

        const info = parseArticle(article, 'вряд');

        t.is(info.pronunciation, 'вряд');
});