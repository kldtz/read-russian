import { isCyrillic } from './utils.js'

const FORM_OF = ['form of', 'abbreviation of', 'comparative of', 'superlative of', 'alternative spelling of', 'misspelling of'];
const FORM_OF_PATTERN = new RegExp('{{(' + FORM_OF.join('|') + ')\\|(.+?)}}');
const INFLECTION_OF_PATTERN = /{{(inflection of|ru-participle of)\|(.+?)}}/;

function parseFormOf(line) {
    const formOf = FORM_OF_PATTERN.exec(line);
    if (!formOf) {
        return null;
    }
    const grammarInfo = formOf[1].substring(0, formOf[1].length - 3);
    const fields = formOf[2].split('|');
    const lemma = extractLemma(fields);
    return {lemma: lemma, grammarInfo: grammarInfo};
}

function extractLemma(fields) {
    for (let field of fields) {
        if (field.includes('=')) {
            // named parameter
            continue;
        }
        if (isCyrillic(field)) {
            return field;
        }
    }
    return fields[1];
}

function parseInflectionOf(line) {
    const inflectionOf = INFLECTION_OF_PATTERN.exec(line);
    if (!inflectionOf) {
        return null;
    }
    var lemma;
    var features = []
    for (let field of inflectionOf[2].split('|')) {
        field = field.trim();
        if (!field) {
            // empty
            continue;
        }
        if (field.includes('=')) {
            // named parameter
            continue;
        }
        if (isCyrillic(field)) {
            if (!lemma) {
                lemma = field;
            }
            continue;
        }
        features.push(field);
    }
    return {lemma: lemma, grammarInfo: features.join('|')};
}

export { parseFormOf, parseInflectionOf };

