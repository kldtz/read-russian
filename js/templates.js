import { isCyrillic, titleCase } from './utils.js'

const FORM_OF = ['form of', 'abbreviation of', 'comparative of', 'superlative of', 'alternative spelling of', 'misspelling of'];
const FORM_OF_PATTERN = new RegExp('{{(' + FORM_OF.join('|') + ')\\|(.+?)}}');
const INFLECTION_OF_PATTERN = /{{(inflection of|ru-participle of)\|(.+?)}}/;

function parseFormOf(line) {
    const formOf = FORM_OF_PATTERN.exec(line);
    if (!formOf) {
        return null;
    }
    var info = {};
    info.grammarInfo = formOf[1].substring(0, formOf[1].length - 3);
    parseFields(info, formOf[2].split('|'));
    return info;
}

function parseFields(info, fields) {
    for (let field of fields) {
        field = field.trim();
        if (!field) {
            // empty
            continue;
        }
        if (field.includes('=')) {
            // named parameter
            let keyVal = field.split('=');
            if (keyVal[0].toLowerCase() === 'pos') {
                info.pos = titleCase(keyVal[1]);
            }
            continue;
        }
        if (!info.lemma && isCyrillic(field)) {
            info.lemma = field;
        }
    }
    if (!info.lemma) {
        info.lemma = fields[0];
    }
}

function parseInflectionOf(line) {
    const inflectionOf = INFLECTION_OF_PATTERN.exec(line);
    if (!inflectionOf) {
        return null;
    }
    var info = {};
    var features = []
    for (let field of inflectionOf[2].split('|')) {
        field = field.trim();
        if (!field) {
            // empty
            continue;
        }
        if (field.includes('=')) {
            // named parameter
            let keyVal = field.split('=');
            if (keyVal[0].toLowerCase() === 'pos') {
                info.pos = titleCase(keyVal[1]);
            }
            continue;
        }
        if (isCyrillic(field)) {
            if (!info.lemma) {
                info.lemma = field;
            }
            continue;
        }
        features.push(field);
    }
    info.grammarInfo = features.join('|');
    return info;
}

function processTemplateW(line) {
    var processed = [];
    var pattern = /{{w\|([^|}]+).*?}}/g;
    var match;
    var start = 0;
    while (match = pattern.exec(line)) {
        processed.push(line.substring(start, match.index));
        processed.push(match[1]);
        start = match.index + match[0].length;
    }
    processed.push(line.substring(start, line.length));
    return processed.join('');
}

function removeTemplates(line) {
    var numOpenBrackets = 0;
    var cleanLetters = [];
    for (let c of line) {
        if (c === '{') {
            numOpenBrackets++;
        }
        if (!numOpenBrackets) {
            cleanLetters.push(c);
        }
        if (c === '}') {
            numOpenBrackets--;
        }
    }
    return cleanLetters.join('');
}

export { parseFormOf, parseInflectionOf, processTemplateW, removeTemplates };

