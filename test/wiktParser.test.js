import test from 'ava';
import fs from 'fs';

import parseArticle from '../wiktParser.js'

test('reads only Russian section', t => {
        const article = fs.readFileSync('test/data/число.wiki').toString();

        const info = parseArticle(article, 'число');

        t.is(info.pronunciation, 'число́');
        t.is(info.definitions.Noun.length, 4);
});

test('recognizes default pronunciation', t => {
        const article = fs.readFileSync('test/data/вряд.wiki').toString();

        const info = parseArticle(article, 'вряд');

        t.is(info.pronunciation, 'вряд');
});

test('extracts lemma and grammar infos from inflection-of template', t => {
        const article = fs.readFileSync('test/data/школы.wiki').toString();

        const info = parseArticle(article, 'школы');

        t.is(info.inflections.Noun.lemma, 'шко́ла');
        t.deepEqual(info.inflections.Noun.grammarInfos, ['gen|s', 'nom|p', 'acc|p']);
});

test('reads only filtered pos', t => {
        const article = fs.readFileSync('test/data/знать.wiki').toString();

        const info = parseArticle(article, 'знать', new Set(['Noun', 'Verb']));

        t.is(Object.keys(info.definitions).length, 2);
        t.truthy(info.definitions.Noun)
        t.truthy(info.definitions.Verb)
        t.falsy(info.definitions.Adverb)
})