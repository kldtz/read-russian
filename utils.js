function findBestResult(searchTerm, titles) {
    var swTitles = titles.filter(title => title.split(/\s+/).length === 1);
    if (!swTitles) {
        return titles[0]; // default: first result 
    }
    searchTerm = searchTerm.toLowerCase();
    searchTerm = normalize(searchTerm);
    // return element that has maximal common prefix length with search term
    const maxCplIndex = swTitles.map(title => title.toLowerCase)
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

export { findBestResult, normalize };