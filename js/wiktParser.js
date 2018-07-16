import { normalize } from './utils.js'
import { parseFormOf, parseInflectionOf } from './templates.js'

const POS_HEADERS = new Set(['Adjective', 'Adverb', 'Article', 'Classifier', 'Conjunction',
  'Contraction', 'Counter', 'Determiner', 'Interjection', 'Noun', 'Numeral', 'Participle',
  'Particle', 'Postposition', 'Predicative', 'Preposition', 'Pronoun', 'Proper noun', 'Verb']);

export default function parseArticle(markup, title, posFilter) {
  var info = { title: title };
  var state = { russian: false, pos: null };
  if (!posFilter) {
    posFilter = POS_HEADERS;
  }
  for (var line of markup.split(/\r?\n/)) {
    processLine(info, state, posFilter, line);
  }
  return info;
}

function processLine(info, state, posFilter, line) {
  line = line.trim();
  updateLanguage(state, line);
  if (state.russian) {
    addPronunciation(info, line);
    updatePos(state, line, posFilter);
    if (state.pos) {
      addAlternativeForm(info, line, state.pos);
      let inflection = extractInflection(line);
      if (inflection) {
        let pos = inflection.pos ? inflection.pos : state.pos;
        addInflection(info, pos, inflection.lemma, inflection.grammarInfo);
      } else {
        addDefinition(info, line, state.pos);
      }
    }
  }
}

function updateLanguage(state, line) {
  if (/^==Russian==$/.exec(line)) {
    state.russian = true;
  } else if (/^==[^=]+==$/.exec(line)) {
    state.russian = false;
  }
}

function addPronunciation(info, line) {
  if (!info.pronunciation && line.includes('{{ru-IPA}}')) {
    info['pronunciation'] = info.title;
    return;
  }
  var pronMatch = /{{ru\-IPA\|(.+?)(\|.+?)?}}/.exec(line);
  if ((!info.pronunciation || info.pronunciation === info.title) && pronMatch) {
    info['pronunciation'] = pronMatch[1];
  }
}

function updatePos(state, line, posFilter) {
  var headerMatch = /===([^=]+)===/g.exec(line);
  if (headerMatch) {
    var heading = headerMatch[1];
    if (posFilter.has(heading)) {
      if (heading === 'Participle') {
        state.pos = 'Verb'; // treat participle as verb
      } else {
        state.pos = heading;
      }
    } else {
      state.pos = null;
    }
  }
}

function addAlternativeForm(info, line, pos) {
  var alternative = /{{ru-.+?-alt-ё\|(.+?)\|?[^|]*?}}/.exec(line);
  if (alternative) {
    if (!info.inflections) {
      info.inflections = {};
    }
    if (!info.inflections[pos]) {
      info.inflections[pos] = {};
    }
    info.inflections[pos].alternative = alternative[1];
  }
}

function addDefinition(info, line, pos) {
  const definition = extractDefinition(line);
  if (definition) {
    if (!info.definitions) {
      info.definitions = {};
    }
    addValue(info.definitions, pos, definition);
  }
}

function extractInflection(line) {
  const formOf = parseFormOf(line);
  if (formOf) {
    return formOf;
  }
  const inflectionOf = parseInflectionOf(line);
  if (inflectionOf) {
    return inflectionOf;
  }
  return null;
}

function addInflection(info, pos, lemma, grammarInfo) {
  if (!info.inflections) {
    info.inflections = {};
  }
  if (!info.inflections[pos]) {
    info.inflections[pos] = {};
  }
  if (!info.inflections[pos].lemma) {
    info.inflections[pos].lemma = lemma;
  }
  if (!info.inflections[pos].normalizedLemma) {
    info.inflections[pos].normalizedLemma = normalize(lemma);
  }
  if (!info.inflections[pos].grammarInfos) {
    info.inflections[pos].grammarInfos = []
  }
  info.inflections[pos].grammarInfos.push(grammarInfo);
}

function extractDefinition(line) {
  if (line.startsWith('#') && !line.startsWith('#:')) {
    var definition = line.substring(1).replace(/\[\[[^\]]+?\|/g, '');
    definition = definition.replace(/(\[\[|\]\])/g, '');
    definition = processTemplateW(definition);
    definition = removeTemplates(definition);
    definition = definition.replace(/\(\s*\)/g, '');
    definition = definition.replace(/''+/g, '');
    if (definition && !definition.match(/^[\s\W]+$/)) {
      definition = definition.replace(/[\s]+/g, ' ');
      return definition.trim();
    }
  }
  return null;
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

function addValue(definitions, pos, definition) {
  if (!definitions[pos]) {
    definitions[pos] = [];
  }
  definitions[pos].push(definition.trim());
}


export { parseArticle };

