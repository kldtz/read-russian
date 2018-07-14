import test from 'ava';

import { findBestResult, normalize } from '../utils.js'

test('selects result with maximal common prefix length', t => {
    const resultTitles = ['вопреки всему', 'всему приходит конец', 'размазать', 'судить', 'весь'];

    const bestResult = findBestResult('всему', resultTitles);

    t.is(bestResult, 'весь');
});

test('keeps combining characters unrelated to pronunciation', t => {
    const words = ['слу́чай']

    const normalizedWords = words.map(normalize);

    const expectedNormalizedWords = ['случай'];
    t.deepEqual(normalizedWords, expectedNormalizedWords);
})