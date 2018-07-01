import test from 'ava';
import fs from 'fs';

import parseArticle from '../wiktParser.js'

test('readsOnlyRussianSection', t => {
        var article = fs.readFileSync('test/data/число.md').toString();
        
        var info = parseArticle(article);

        t.is(info.pronunciation, 'число́');
        t.is(info.definitions.Noun.length, 4);
});

