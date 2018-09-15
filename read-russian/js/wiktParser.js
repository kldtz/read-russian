import { normalizeUrl, countChar } from './utils.js'
import { parseFormOf, parseInflectionOf, parseIpa, processTemplates, parseRuVerb } from './templates.js'

const POS_HEADERS = new Set(['Adjective', 'Adverb', 'Article', 'Classifier', 'Conjunction',
  'Contraction', 'Counter', 'Determiner', 'Interjection', 'Noun', 'Numeral', 'Participle',
  'Particle', 'Postposition', 'Predicative', 'Prefix', 'Preposition', 'Pronoun', 'Proper noun',
  'Verb']);

export default function parseArticle(markup, title, posFilter) {
  var info = new Info(title);
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
    info.setPronunciation(extractPronunciation(line));
    updatePos(state, line, posFilter);
    if (state.pos) {
      info.setAlternativeForm(state.pos, extractAlternativeForm(line));
      let inflection = extractInflection(line);
      if (inflection) {
        let pos = inflection.pos && POS_HEADERS.has(inflection.pos) ? inflection.pos : state.pos;
        info.addInflection(pos, inflection.lemma, inflection.grammarInfo);
        return;
      }
      let definition = extractDefinition(line);
      if (definition) {
        info.addDefinition(state.pos, definition);
        return;
      }
      let aspectInfo = parseRuVerb(line);
      if (aspectInfo) {
        info.setAspect(state.pos, aspectInfo);
        return;
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

function extractPronunciation(line) {
  var pronMatch = /{{ru\-IPA\|(.+?)}}/.exec(line);
  if (pronMatch) {
    return parseIpa(pronMatch[1].split('|'));
  }
  return null;
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

function extractAlternativeForm(line) {
  var alternative = /{{(ru-.+?-alt-ё|alternative form of)\|(.+?)}}/.exec(line);
  if (alternative) {
    return alternative[2].split('|')[0];
  }
  return null;
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

class Info {
  constructor(title) {
    this.title = title;
  }

  addInflection(pos, lemma, grammarInfo) {
    if (!this.inflections) {
      this.inflections = {};
    }
    if (!this.inflections[pos]) {
      this.inflections[pos] = {};
    }
    if (!this.inflections[pos].lemma) {
      this.inflections[pos].lemma = lemma;
    }
    if (!this.inflections[pos].normalizedLemma) {
      this.inflections[pos].normalizedLemma = normalizeUrl(lemma);
    }
    if (!this.inflections[pos].grammarInfos) {
      this.inflections[pos].grammarInfos = []
    } else if (this.inflections[pos].grammarInfos.indexOf(grammarInfo) > -1) {
      return;
    }
    this.inflections[pos].grammarInfos.push(grammarInfo);
  }

  setAlternativeForm(pos, alternativeForm) {
    if (!alternativeForm) return;
    if (!this.inflections) {
      this.inflections = {};
    }
    if (!this.inflections[pos]) {
      this.inflections[pos] = {};
    }
    this.inflections[pos].alternative = alternativeForm;
  }

  addDefinition(pos, definition) {
    if (!definition) return;
    if (!this.definitions) {
      this.definitions = {};
    }
    if (!this.definitions[pos]) {
      this.definitions[pos] = [];
    }
    this.definitions[pos].push(definition);
  }

  setAspect(pos, aspectInfo) {
    if (!aspectInfo) return;
    if (!this.inflections) {
      this.inflections = {};
    }
    if (!this.inflections[pos]) {
      this.inflections[pos] = {};
    }
    this.inflections[pos].aspect = aspectInfo.aspect;
    this.inflections[pos].aspectPartner = aspectInfo.aspectPartner;
  }

  setPronunciation(pronunciation) {
    if (!this.pronunciation && pronunciation) {
      this.pronunciation = pronunciation;
    }
  }
}

export { parseArticle };

