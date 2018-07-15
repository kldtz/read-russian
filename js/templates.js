import { isCyrillic } from './utils.js'

const FORM_OF = ['abbreviation of', 'comparative of', 'superlative of'];
const FORM_OF_PATTERN = new RegExp('{{((' + FORM_OF.join('|') + ').+?)}}');

function parseFormOf(line) {
    const formOf = FORM_OF_PATTERN.exec(line);
    if (!formOf) {
        return null;
    }
    const fields = formOf[1].split('|');
    const grammarInfo = fields[0].substring(0, fields[0].length - 3);
    const lemma = extractLemma(fields);
    return {lemma: lemma, grammarInfo: grammarInfo};
}

function extractLemma(fields) {
    for (let field of fields.slice(1)) {
        if (field.includes('=')) {
            // parameter
            continue;
        }
        if (isCyrillic(field)) {
            return field;
        }
    }
    return fields[1];
}

export { isCyrillic, parseFormOf };

