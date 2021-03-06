import { isCyrillic, titleCase, peek, alt, findFirst } from './utils.js'

const FORM_OF = ['form of', 'abbreviation of', 'comparative of', 'superlative of', 'alternative spelling of', 'misspelling of', 'passive form of', 'passive of', 'alternative form of'];
const FORM_OF_PATTERN = new RegExp('{{(' + FORM_OF.join('|') + ')\\|(.+?)}}');
const INFLECTION_OF_PATTERN = /{{(inflection of|ru-participle of)\|(.+?)}}/;
const NAMED_PARAMETER = /^(\w+)=([^=]+)$/;
const SIMPLE_LINK = /\[\[([^{}\[]+?)\]\]/g;
const TEMPLATE_FUNCTION_MAPPING = {
    'diminutive of': replaceDiminutive,
    'given name': replaceGivenName,
    glink: replaceGlossary,
    gloss: replaceGloss,
    glossary: replaceGlossary,
    i: replaceI,
    'initialism of': replaceAcronym,
    l: replaceMention,
    label: replaceLabel,
    lb: replaceLabel,
    lbl: replaceLabel,
    link: replaceMention,
    m: replaceMention,
    mention: replaceMention,
    'non-gloss definition': replaceNonGlossDefinition,
    q: replaceI,
    'qualifier': replaceI,
    'pejorative of': replacePejorative,
    place: replacePlace,
    'ru-acronym of': replaceAcronym,
    'ru-initialism of': replaceAcronym,
    w: replaceWikipediaLink
};
const NAME_GENDER = new Set(['male', 'female', 'unisex']);

function parseFormOf(line) {
    var info = {};
    var formOf = FORM_OF_PATTERN.exec(line);
    if (!formOf) {
        formOf = /{{(ru-.+?-alt-ё)\|(.+?)}}/.exec(line);
        if (!formOf) {
            return null;
        }
        info.grammarInfo = "alternative spelling";
    } else {
        info.grammarInfo = formOf[1].substring(0, formOf[1].length - 3);
    }
    const pMap = parseParameters(formOf[2].split('|'));
    if (pMap.pos) {
        info.pos = titleCase(pMap.pos);
    }
    info.lemma = alt(findFirst(pMap.ps0, isCyrillic), pMap.ps0[0]);
    return info;
}

function parseInflectionOf(line) {
    const inflectionOf = INFLECTION_OF_PATTERN.exec(line);
    if (!inflectionOf) {
        return null;
    }
    var info = {};
    let templateString = replaceLinksNaively(inflectionOf[2]);
    const pMap = parseParameters(templateString.split('|'));
    if (pMap.pos) {
        info.pos = titleCase(pMap.pos);
    }
    info.lemma = alt(findFirst(pMap.ps0, isCyrillic), pMap.ps0[0]);
    info.grammarInfo = pMap.ps0.filter(el => el.length > 0 && !isCyrillic(el) && el != 'ru').join('.');
    return info;
}

function replaceLinksNaively(line) {
    var output = [];
    var match;
    var start = 0;
    while (match = SIMPLE_LINK.exec(line)) {
        output.push(line.substring(start, match.index));
        let fields = match[1].split('|');
        let lemma = fields[0].split('#')[0];
        output.push(lemma);
        start = match.index + match[0].length;
    }
    if (start == 0) {
        return line;
    }
    output.push(line.substring(start))
    return output.join('');
}

function parseIpa(params) {
    const pMap = parseParameters(params);
    return alt(pMap.phon, pMap.ps0[0]);
}

function parseRuVerb(line) {
    var headVerb = /{{ru-verb\|(.+?)}}/.exec(line);
    if (headVerb) {
        const params = parseParameters(headVerb[1].split('|'));
        var aspect = params.ps0[1];
        if (aspect === 'both') {
            aspect = 'impf/pf';
        }
        if (aspect) {
            const aspectPartner = params.impf ? params.impf : params.pf ? params.pf : null;
            return { aspect: aspect, aspectPartner: aspectPartner };
        }
    }
    return null;
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
        //alert(root.name);
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
    const ps = parsePositionalParams(params);
    return alt(ps[1], ps[0]);
}

function replaceI(params) {
    return params.length === 1 ? '(' + params[0] + ')' : '';
}

function replaceWikipediaLink(params) {
    const ps = parsePositionalParams(params);
    return alt(ps[1], ps[0]);
}

function replaceMention(params) {
    const ps = parsePositionalParams(params);
    return alt(ps[2], ps[1]);
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
    return '(<span class="lb">' + cleanList.join(', ') + '</span>)';
}

function replaceGloss(params) {
    return params.length === 1 ? '(' + params[0] + ')' : '';
}

function replaceNonGlossDefinition(params) {
    return params.length === 1 ? '<span class="non-gloss-def">' + params[0] + '</span>' : '';
}

function replaceAcronym(params) {
    const ps = parsePositionalParams(params);
    var parts = ['<span class="acronym">acronym of '];
    parts.push(alt(ps[0], ps[1]));
    const gloss = ps[2];
    if (gloss) {
        parts.push(' (' + gloss + ')')
    }
    parts.push('</span>');
    return parts.join('');
}

function replaceDiminutive(params) {
    const ps = parsePositionalParams(params);
    var parts = ['<span class="diminutive">diminutive of '];
    parts.push(alt(findFirst(ps, isCyrillic), ps[0]));
    parts.push('</span>');
    return parts.join('');
}

function replaceGivenName(params) {
    const paramMap = parseParameters(params);
    if (paramMap.gender)
        return paramMap.gender + ' given name';
    for (let param of paramMap.ps0) {
        if (NAME_GENDER.has(param))
            return param + ' given name';
    }
    return 'given name';
}

function replacePejorative(params) {
    const ps = parsePositionalParams(params);
    var parts = ['<span class="pejorative">pejorative of ']
    parts.push(alt(findFirst(ps, isCyrillic), ps[0]));
    parts.push('</span>')
    return parts.join('');
}

function replacePlace(params) {
    const paramMap = parseParameters(params);
    var parts = [];
    const translation = paramMap.t1;
    if (translation) {
        parts.push(translation);
        parts.push(' ');
    }
    const placetype = paramMap.ps0[1];
    parts.push('(');
    parts.push(placetype);
    parts.push(')');
    return parts.join('');
}

function parsePositionalParams(params) {
    var ps0 = [];
    for (let param of params) {
        param = param.trim();
        if (!NAMED_PARAMETER.test(param)) {
            ps0.push(param);
        }
    }
    return ps0;
}

function parseParameters(params) {
    var paramMap = { ps0: [] };
    for (let param of params) {
        param = param.trim();
        let match = NAMED_PARAMETER.exec(param);
        if (!match) {
            paramMap.ps0.push(param);
        } else {
            let key = match[1].toLowerCase();
            let value = match[2];
            paramMap[key] = value;
        }
    }
    return paramMap;
}

export { parseFormOf, parseInflectionOf, parseIpa, buildTemplateTrees, processTemplates, parseRuVerb };

