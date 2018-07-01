var POS_HEADERS = new Set(['Adjective', 'Adverb', 'Article', 'Classifier', 'Conjunction',
  'Contraction', 'Counter', 'Determiner', 'Interjection', 'Noun', 'Numeral',
  'Participle', 'Particle', 'Postposition', 'Preposition', 'Pronoun', 'Proper noun', 'Verb']);

export default function parseArticle(markup, title) {
  var info = { definitions: {}, title: title };
  var state = { russian: false, pos: null };
  for (var line of markup.split(/\r?\n/)) {
    updateLanguage(state, line);
    if (state.russian) {
      addPronunciation(info, line);
      updatePos(state, line);
      addDefinition(state.pos, info.definitions, line);
    }
  }
  return info;
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

function updatePos(state, line) {
  var headerMatch = /===([^=]+)===/g.exec(line);
  if (headerMatch) {
    var heading = headerMatch[1];
    if (POS_HEADERS.has(heading)) {
      state.pos = heading;
    } else {
      state.pos = null;
    }
  }
}

function addDefinition(pos, definitions, line) {
  if (pos) {
    var definition = extractDefinition(line);
    if (definition) {
      addValue(definitions, pos, definition);
    }
  }
}

function extractDefinition(line) {
  if (line.startsWith('#')) {
    var definition = line.replace(/(\[\[|\]\]|#)/g, '');
    definition = definition.replace(/{{.+?}}/g, '');
    if (definition && !definition.match(/^[\s\W]+$/)) {
      definition = definition.replace(/[\s]+/g, ' ');
      return definition;
    }
  }
  return null;
}

function addValue(definitions, pos, definition) {
  if (!definitions[pos]) {
    definitions[pos] = [];
  }
  definitions[pos].push(definition.trim());
}


export { parseArticle };

