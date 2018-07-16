import test from 'ava';

import { parseFormOf, parseInflectionOf } from '../templates.js'

test('extracts lemma from "superlative of" template', t => {
    const line  = '# {{superlative of|ста́рый|lang=ru}}';

    const result = parseFormOf(line)

    t.deepEqual(result, {lemma: 'ста́рый', grammarInfo: 'superlative'});
});

test('extracts lemma from "comparative of" template', t => {
    const line  = '# {{comparative of|POS=adjective|ста́рый|lang=ru}}';

    const result = parseFormOf(line)

    t.deepEqual(result, {lemma: 'ста́рый', grammarInfo: 'comparative'});
});

test('parses "inflection of" template, ignores order, lang parameter and empty field', t => {
    const lines  = ['# {{inflection of|весь||gen|s|f|lang=ru}}', '# {{inflection of|lang=ru|весь||gen|s|f}}'];

    const results = lines.map(parseInflectionOf);

    const expectedResult = {lemma: 'весь', grammarInfo: 'gen|s|f'};
    t.deepEqual(results[0], expectedResult);
    t.deepEqual(results[1], expectedResult);
});