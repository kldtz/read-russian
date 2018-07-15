import test from 'ava';

import { parseFormOf } from '../templates.js'

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