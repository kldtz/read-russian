import test from 'ava';

import { findBestResult, normalize, isCyrillic } from '../utils.js'

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
});

test('isCyrillic is true for cyrillic words', t => {
    const words = ['случай', 'число́', 'шко́ла', 'счёт'];

    const numCyrillicWords = words.map(isCyrillic);

    const expectedResults = words.map(w => true);
    t.deepEqual(numCyrillicWords, expectedResults);
});

test('isCyrillic is false for non-cyrillic words', t => {
    const words = ['test', 'passé', 'tчисло́'];

    const numCyrillicWords = words.map(isCyrillic);

    const expectedResults = words.map(w => false);
    t.deepEqual(numCyrillicWords, expectedResults);
});