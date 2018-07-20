import { isCyrillic, titleCase, peek } from './utils.js'

const FORM_OF = ['form of', 'abbreviation of', 'comparative of', 'superlative of', 'alternative spelling of', 'misspelling of'];
const FORM_OF_PATTERN = new RegExp('{{(' + FORM_OF.join('|') + ')\\|(.+?)}}');
const INFLECTION_OF_PATTERN = /{{(inflection of|ru-participle of)\|(.+?)}}/;
const NAMED_PARAMETER = /^\w+=[^=]+$/;
const TEMPLATE_FUNCTION_MAPPING = {
    gloss: replaceGloss,
    glossary: replaceGlossary,
    i: replaceI,
    lb: replaceLabel,
    lbl: replaceLabel,
    label: replaceLabel,
    m: replaceMention,
    mention: replaceMention,
    w: replaceWikipediaLink
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

function processTemplates(line) {
    const roots = buildTemplateTrees(line);
    return replaceTemplates(roots, line);
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
    if (!(root.name in TEMPLATE_FUNCTION_MAPPING)) {
        return ''; // unknown templates are removed
    }
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
    return extractParamAt(params, 2, 1);
}

function replaceI(params) {
    return '(' + params[0] + ')';
}

function replaceWikipediaLink(params) {
    return extractParamAt(params, 2, 1);
}

function replaceMention(params) {
    return extractParamAt(params, 3, 2);
}

function replaceLabel(params) {
    if (params.length < 2) {
        return '';
    }
    var cleanList = [params[1]];
    var i;
    for (i = 2; i < params.length; i++) {
        let param = params[i];
        if (param === '_' && params.length > ++i) {
            cleanList.push(cleanList.pop() + ' ' + params[i]);
        } else if ((param === 'or' || param === 'and') && params.length > ++i) {
            cleanList.push(cleanList.pop() + ' ' + param + ' ' + params[i])
        } else {
            cleanList.push(param);
        }
    }
    return '(<i>' + cleanList.join(', ') + '</i>)';
}

function replaceGloss(params) {
    return params.length === 1 ? '(' + params[0] + ')' : '';
}

/**
 * Extract an unnamed parameter at a prefered or alternative position. 
 * Positions are counted starting from 1!
 */
function extractParamAt(params, preferred, alternative) {
    var plainParams = [];
    for (let param of params) {
        if (!isNamedParameter(param)) {
            plainParams.push(param);
            if (plainParams.length === preferred) {
                return param;
            }
        }
    }
    if (alternative && plainParams.length >= alternative) {
        return plainParams[alternative - 1];
    }
    return '';
}

function isNamedParameter(param) {
    return NAMED_PARAMETER.test(param);
}

export { parseFormOf, parseInflectionOf, buildTemplateTrees, processTemplates };

