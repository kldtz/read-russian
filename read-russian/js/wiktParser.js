import { normalizeUrl, countChar } from './utils.js'
import { parseFormOf, parseInflectionOf, parseIpa, processTemplates } from './templates.js'

const POS_HEADERS = new Set(['Adjective', 'Adverb', 'Article', 'Classifier', 'Conjunction',
  'Contraction', 'Counter', 'Determiner', 'Interjection', 'Noun', 'Numeral', 'Participle',
  'Particle', 'Postposition', 'Predicative', 'Prefix', 'Preposition', 'Pronoun', 'Proper noun', 
  'Verb']);

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
        let pos = inflection.pos && POS_HEADERS.has(inflection.pos) ? inflection.pos : state.pos;
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
  var pronMatch = /{{ru\-IPA\|(.+?)}}/.exec(line);
  if ((!info.pronunciation || info.pronunciation === info.title) && pronMatch) {
    info.pronunciation = parseIpa(pronMatch[1].split('|'));
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
  var alternative = /{{(ru-.+?-alt-ё|alternative form of)\|(.+?)}}/.exec(line);
  if (alternative) {
    if (!info.inflections) {
      info.inflections = {};
    }
    if (!info.inflections[pos]) {
      info.inflections[pos] = {};
    }
    info.inflections[pos].alternative = alternative[2].split('|')[0];
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
    info.inflections[pos].normalizedLemma = normalizeUrl(lemma);
  }
  if (!info.inflections[pos].grammarInfos) {
    info.inflections[pos].grammarInfos = []
  } else if (info.inflections[pos].grammarInfos.indexOf(grammarInfo) > -1) {
    return;
  }
  info.inflections[pos].grammarInfos.push(grammarInfo);
}

function extractDefinition(line) {
  if (/^#+[^:*]/.test(line)) {
    const depth = countChar('#', line);
    var definition = line.substring(depth).replace(/\[\[[^\]]+?\|/g, '');
    definition = definition.replace(/(\[\[|\]\])/g, '');
    definition = processTemplates(definition);
    definition = definition.replace(/\(\s*\)/g, '');
    definition = definition.replace(/''+/g, '');
    definition = definition.replace(/\.+$/, '');
    if (definition && !definition.match(/^[\s\W]+$/)) {
      definition = definition.replace(/[\s]+/g, ' ');
      return { text: definition.trim(), depth: depth };
    }
  }
  return null;
}

function addValue(definitions, pos, definition) {
  if (!definitions[pos]) {
    definitions[pos] = [];
  }
  definitions[pos].push(definition);
}

export { parseArticle };

