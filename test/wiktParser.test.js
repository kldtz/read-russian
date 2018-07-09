import test from 'ava';
import fs from 'fs';

import { parseArticle, normalize } from '../wiktParser.js'

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
        t.is(info.inflections.Noun.normalizedLemma, 'школа');
        t.deepEqual(info.inflections.Noun.grammarInfos, ['gen|s', 'nom|p', 'acc|p']);
});

test('extracts lemma from "ru-participle of" template', t => {
        const article = fs.readFileSync('test/data/скачанный.wiki').toString();

        const info = parseArticle(article, 'скачанный');

        t.is(info.inflections.Verb.lemma, 'скача́ть')
});

test('reads only filtered pos', t => {
        const article = fs.readFileSync('test/data/знать.wiki').toString();

        const info = parseArticle(article, 'знать', new Set(['Noun', 'Verb']));

        t.is(Object.keys(info.definitions).length, 2);
        t.truthy(info.definitions.Noun)
        t.truthy(info.definitions.Verb)
        t.falsy(info.definitions.Adverb)
})

test('extracts alternative form', t => {
        const article = fs.readFileSync('test/data/счет.wiki').toString();

        const info = parseArticle(article, 'счет');

        t.is(info.inflections.Noun.alternative, 'счёт');
})

test('extracts only second part of link', t => {
        const article = fs.readFileSync('test/data/место.wiki').toString();

        const info = parseArticle(article, 'счет');

        t.is(info.definitions.Noun[0], 'place');
        t.is(info.definitions.Noun[1], 'region, area')
        t.is(info.definitions.Noun[2], 'site, scene')
})

test('ignores sub-items in definitions', t => {
        const article = fs.readFileSync('test/data/суть.wiki').toString();

        const info = parseArticle(article, 'суть');

        t.is(info.definitions.Noun.length, 1);
})

test('removes only first part inside link', t => {
        const article = fs.readFileSync('test/data/серия.wiki').toString();

        const info = parseArticle(article, 'серия');

        t.is(info.definitions.Noun.length, 2);
        t.is(info.definitions.Noun[0], 'series');
        t.is(info.definitions.Noun[1], 'episode, part')
})

test('extracts definition "to be"', t => {
        const article = fs.readFileSync('test/data/быть.wiki').toString();

        const info = parseArticle(article, 'быть', new Set(['Verb']));

        t.is(info.definitions.Verb.length, 1);
        t.is(info.definitions.Verb[0], 'to be');
})

test('removes italics and bold markup', t => {
        const article = fs.readFileSync('test/data/список.wiki').toString();

        const info = parseArticle(article, 'список');

        t.is(info.definitions.Noun[1], 'copy (especially of a picture or an icon)');
})

test('removes nested templates', t => {
        const article = fs.readFileSync('test/data/готовый.wiki').toString();

        const info = parseArticle(article, 'готовый');

        t.is(info.definitions.Adjective[0], 'ready, prepared');
})

test('keeps combining characters unrelated to pronunciation', t => {
        const words = ['слу́чай']

        const normalizedWords = words.map(normalize);

        const expectedNormalizedWords = ['случай'];
        t.deepEqual(normalizedWords, expectedNormalizedWords);
})

