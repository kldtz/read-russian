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
    let n = roots[0];
    t.is(n.name, 'i');
    t.is(n.start, 0);
    t.is(n.end, line.length);

    t.is(n.params.length, 1);
    let p = n.params[0];
    t.is(line.substring(p.start, p.end), '{{m|ru|на}} + {{glossary|accusative}}');

    t.is(p.templates.length, 2);
    let n1 = p.templates[0];
    t.is(n1.name, 'm');
    t.is(line.substring(n1.start, n1.end), '{{m|ru|на}}');

    t.is(n1.params.length, 2);
    let p1 = n1.params[0];
    t.is(line.substring(p1.start, p1.end), 'ru');

    let p2 = n1.params[1];
    t.is(line.substring(p2.start, p2.end), 'на');

    let n2 = p.templates[1];
    t.is(n2.name, 'glossary');
    t.is(line.substring(n2.start, n2.end), '{{glossary|accusative}}');

    t.is(n2.params.length, 1);
    let p1n2 = n2.params[0];
    t.is(line.substring(p1n2.start, p1n2.end), 'accusative')
});