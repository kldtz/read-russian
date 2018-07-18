import test from 'ava';

import { parseFormOf, parseInflectionOf, buildTemplateTrees } from '../templates.js'

test('extracts lemma and grammarInfo from "superlative of" template', t => {
    const line  = '# {{superlative of|ста́рый|lang=ru}}';

    const result = parseFormOf(line)

    t.is(result.lemma, 'ста́рый')
    t.is(result.grammarInfo, 'superlative');
});

test('extracts lemma and grammarInfo from "comparative of" template', t => {
    const line  = '# {{comparative of|POS=adjective|ста́рый|lang=ru}}';

    const result = parseFormOf(line)

    t.is(result.lemma, 'ста́рый');
    t.is(result.grammarInfo, 'comparative');
});

test('parses "inflection of" template, ignores order, lang parameter and empty field', t => {
    const lines  = ['# {{inflection of|весь||gen|s|f|lang=ru}}', '# {{inflection of|lang=ru|весь||gen|s|f}}'];

    const results = lines.map(parseInflectionOf);

    const expectedResult = {lemma: 'весь', grammarInfo: 'gen|s|f'};
    t.deepEqual(results[0], expectedResult);
    t.deepEqual(results[1], expectedResult);
});

test('parses "form of" template, extracts pos', t => {
    const lines  = ['# {{comparative of|POS=adjective|ста́рый|lang=ru}}', '# {{comparative of|POS=adverb|старо́|lang=ru}}'];

    const results = lines.map(parseFormOf);

    t.is(results[0].pos, 'Adjective');
    t.is(results[1].pos, 'Adverb');
});


test('builds parse trees', t => {
    const line  = '{{i|{{m|ru|на}} + {{glossary|accusative}}}}';

    const roots = buildTemplateTrees(line);

    t.is(roots.length, 1);
    t.is(roots[0].name, 'i');
    t.is(roots[0].start, 0);
    t.is(roots[0].end, line.length);
    t.is(roots[0].children.length, 2);
    
    t.is(roots[0].children[0].name, 'm');
    t.is(roots[0].children[0].start, 4);
    t.is(roots[0].children[0].end, 15);

    t.is(roots[0].children[1].name, 'glossary');
    t.is(roots[0].children[1].start, 18);
    t.is(roots[0].children[1].end, 41);
});