import { isCyrillic, titleCase } from './utils.js'

const FORM_OF = ['form of', 'abbreviation of', 'comparative of', 'superlative of', 'alternative spelling of', 'misspelling of'];
const FORM_OF_PATTERN = new RegExp('{{(' + FORM_OF.join('|') + ')\\|(.+?)}}');
const INFLECTION_OF_PATTERN = /{{(inflection of|ru-participle of)\|(.+?)}}/;
const TEMPLATE_FUNCTION_MAPPING = {
    glossary: replaceGlossary,
    i: replaceItalics,
    m: replaceMention
};

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

function replaceTemplates(roots, line, start, end) {
    var result = [];
    var i = start;
    for (let root of roots) {
        result.push(line.substring(i, root.start));
        result.push(replaceTemplate(root, line));
        i = root.end;
    }
    result.push(line.substring(i, end));
    return result.join('');
}

function replaceTemplate(root, line) {
    let paramStrings = [];
    for (let param of root.params) {
        if (param.templates.length > 0) {
            let replacement = replaceTemplates(param.templates, line, param.start, param.end);
            paramStrings.push(replacement);
        } else {
            paramStrings.push(line.substring(param.start, param.end));
        }
    }
    return extractInfoFromTemplate(root.name, paramStrings);
}

function extractInfoFromTemplate(name, params) {
    if (name in TEMPLATE_FUNCTION_MAPPING) {
        return TEMPLATE_FUNCTION_MAPPING[name](params);
    }
    return '';
}

function replaceGlossary(params) {
    return params[0];
}

function replaceItalics(params) {
    return '<i>' + params[0] + '</i>';
}

function replaceMention(params) {
    return params[1];
}

function buildTemplateTrees(line) {
    var roots = [];
    var stack = [];
    const pattern = /{{(.+?)\||}}|\|/g;
    var match;
    while (match = pattern.exec(line)) {
        let i = match.index;
        if (match[0].startsWith('{{')) {
            let template = { start: i, name: match[1], params: [] };
            template.params.push({ start: i + match[0].length, templates: [] });
            if (stack.length > 0) {
                let curTemplate = peek(stack);
                if (curTemplate.params.length > 0) {
                    peek(curTemplate.params).templates.push(template);
                }
            }
            stack.push(template);
        } else if (match[0] === '}}') {
            let elem = stack.pop();
            peek(elem.params).end = i;
            elem.end = i + 2;
            if (stack.length === 0) {
                roots.push(elem);
            }
        } else if (stack.length > 0) {
            let curTemplate = peek(stack);
            peek(curTemplate.params).end = i;
            curTemplate.params.push({ start: i + 1, templates: [] });
        }
    }
    return roots;
}

function peek(stack) {
    return stack[stack.length - 1];
}

export { parseFormOf, parseInflectionOf, processTemplateW, removeTemplates, buildTemplateTrees, replaceTemplates };

