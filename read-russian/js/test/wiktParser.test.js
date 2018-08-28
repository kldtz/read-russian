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
        t.deepEqual(info.inflections.Noun.grammarInfos, ['gen.s', 'nom.p', 'acc.p']);
});

test('extracts lemma from "ru-participle of" template', t => {
        const article = fs.readFileSync('test/data/скачанный.wiki').toString();

        const info = parseArticle(article, 'скачанный');

        t.is(info.inflections.Verb.lemma, 'скача́ть')
});

test('extracts lemma from "superlative of" template', t => {
        const article = fs.readFileSync('test/data/старейший.wiki').toString();

        const info = parseArticle(article, 'старейший');

        t.is(info.inflections.Adjective.lemma, 'ста́рый');
});

test('reads only filtered pos', t => {
        const article = fs.readFileSync('test/data/знать.wiki').toString();

        const info = parseArticle(article, 'знать', new Set(['Noun', 'Verb']));

        t.is(Object.keys(info.definitions).length, 2);
        t.truthy(info.definitions.Noun)
        t.truthy(info.definitions.Verb)
        t.falsy(info.definitions.Adverb)
});

test('extracts alternative noun form', t => {
        const article = fs.readFileSync('test/data/счет.wiki').toString();

        const info = parseArticle(article, 'счет');

        t.is(info.inflections.Noun.alternative, 'счёт');
});

test('extracts alternative adjective form', t => {
        const article = fs.readFileSync('test/data/никчемный.wiki').toString();

        const info = parseArticle(article, 'никчемный');

        t.is(info.inflections.Adjective.alternative, 'никчёмный');
});

test('extracts only second part of link', t => {
        const article = fs.readFileSync('test/data/место.wiki').toString();

        const info = parseArticle(article, 'счет');

        t.is(info.definitions.Noun[0].text, 'place');
        t.is(info.definitions.Noun[1].text, 'region, area')
        t.is(info.definitions.Noun[2].text, 'site, scene')
});

test('ignores sub-items in definitions', t => {
        const article = fs.readFileSync('test/data/суть.wiki').toString();

        const info = parseArticle(article, 'суть');

        t.is(info.definitions.Noun.length, 1);
});

test('correctly parses nested definitions', t => {
        const article = fs.readFileSync('test/data/по.wiki').toString();

        const info = parseArticle(article, 'по');

        // 3 top-level items
        t.is(info.definitions.Preposition.reduce((acc, curr) => curr.depth == 1 ? acc + 1 : acc, 0), 3);
        // 13 second-level items
        t.is(info.definitions.Preposition.reduce((acc, curr) => curr.depth == 2 ? acc + 1 : acc, 0), 13);
});

test('ignores quotations', t => {
        const article = fs.readFileSync('test/data/сильный.wiki').toString();

        const info = parseArticle(article, 'сильный');

        t.is(info.definitions.Adjective.length, 2);
})

test('removes only first part inside link', t => {
        const article = fs.readFileSync('test/data/серия.wiki').toString();

        const info = parseArticle(article, 'серия');

        t.is(info.definitions.Noun.length, 2);
        t.is(info.definitions.Noun[0].text, 'series');
        t.is(info.definitions.Noun[1].text, 'episode, part')
});

test('parses template w (shorter links to English Wikipedia)', t => {
        const article = fs.readFileSync('test/data/Госдума.wiki').toString();

        const info = parseArticle(article, 'Госдума');

        t.is(info.definitions['Proper noun'][0].text, 'State Duma (lower house of Russian national parliament)');
});

test('extracts definition "to be"', t => {
        const article = fs.readFileSync('test/data/быть.wiki').toString();

        const info = parseArticle(article, 'быть', new Set(['Verb']));

        t.is(info.definitions.Verb.length, 1);
        t.is(info.definitions.Verb[0].text, 'to be');
});

test('removes italics and bold markup', t => {
        const article = fs.readFileSync('test/data/список.wiki').toString();

        const info = parseArticle(article, 'список');

        t.is(info.definitions.Noun[1].text, 'copy (especially of a picture or an icon)');
});

test('removes nested templates', t => {
        const article = fs.readFileSync('test/data/готовый.wiki').toString();

        const info = parseArticle(article, 'готовый');

        t.is(info.definitions.Adjective[0].text, 'ready, prepared (к + dative)');
});

test('recognizes predicative', t => {
        const article = fs.readFileSync('test/data/нельзя.wiki').toString();

        const info = parseArticle(article, 'нельзя');

        t.is(info.definitions.Predicative.length, 2);
});

test('ignores indented lines between definitions', t => {
        const article = fs.readFileSync('test/data/пост.wiki').toString();

        const info = parseArticle(article, 'пост');

        t.is(info.definitions.Noun.length, 4);
});

test('extracts phon parameter from ru-IPA template', t => {
        const article = fs.readFileSync('test/data/Йоханнесбург.wiki').toString();

        const info = parseArticle(article, 'Йоханнесбург');

        t.is(info.pronunciation, 'Йо̂ха́ннэсбург');
});

test('deals with trema', t => {
        const article = fs.readFileSync('test/data/тёмный.wiki').toString();

        const info = parseArticle(article, 'тёмный');

        t.is(info.pronunciation, 'тёмный');
        t.is(info.definitions['Adjective'][0].text, 'dark');
        t.is(info.definitions['Adjective'][1].text, 'ignorant, uneducated (person)');
});