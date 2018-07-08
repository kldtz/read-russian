import test from 'ava';

import { findBestResult } from '../utils.js'

test('selects result with maximal common prefix length', t => {
    const resultTitles = ['вопреки всему', 'всему приходит конец', 'размазать', 'судить', 'весь'];

    const bestResult = findBestResult('всему', resultTitles);

    t.is(bestResult, 'весь');
});