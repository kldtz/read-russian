const CYRILLIC = /^[\u0300-\u036F\u0410-\u045F\-]+$/;

function findBestResult(searchTerm, titles) {
    var swTitles = titles.filter(title => title.split(/\s+/).length === 1);
    if (swTitles.length === 0) {
        return titles[0]; // default: first result 
    }
    searchTerm = searchTerm.toLowerCase();
    searchTerm = normalize(searchTerm);
    // return element that has maximal common prefix length with search term
    const maxCplIndex = swTitles.map(title => normalize(title).toLowerCase())
        .map(title => commonPrefixLength(title, searchTerm))
        .reduce((maxIndex, cpl, i, cpls) => {
            return cpl > cpls[maxIndex] ? i : maxIndex;
        }, 0);
    return swTitles[maxCplIndex];
}

function commonPrefixLength(a, b) {
    const l = a.length;
    var cpl = 0;
    while (cpl < l && a.charAt(cpl) === b.charAt(cpl)) cpl++;
    return cpl;
}

function normalize(word) {
    return word.normalize('NFD').replace(/[\u0300-\u0303]/g, '');
}

function isCyrillic(word) {
    return CYRILLIC.test(word);
}

function titleCase(word) {
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
}

function peek(stack) {
    return stack[stack.length - 1];
}

function countChar(c, line) {
    var i = 0;
    while (line[i] === c) {
      i++;
    }
    return i;
  }

export { findBestResult, normalize, isCyrillic, titleCase, peek, countChar };