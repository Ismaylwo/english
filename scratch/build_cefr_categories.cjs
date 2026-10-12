const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '..', 'src', 'data', 'words.json');
const categoriesPath = path.join(__dirname, '..', 'src', 'data', 'categories.json');
const csvPath = path.join(__dirname, 'oxford_5000.csv');

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const csvData = fs.readFileSync(csvPath, 'utf8');

// Build CEFR Map from official Oxford CSV
const cefrMap = {};
csvData.split('\n').slice(1).forEach(line => {
  const parts = line.split(',');
  if (parts.length >= 4) {
    const word = parts[1]?.trim().toLowerCase();
    const cefr = parts[3]?.trim().toUpperCase();
    if (word && cefr && ['A1', 'A2', 'B1', 'B2', 'C1'].includes(cefr)) {
      cefrMap[word] = cefr;
    }
  }
});

console.log(`Loaded CEFR map with ${Object.keys(cefrMap).length} entries.`);

// 10 Life Spheres definition
const CATEGORIES_CONFIG = [
  {
    id: 'meeting',
    index: 1,
    titleRu: 'Знакомство, люди и о себе',
    titleTj: 'Шиносоӣ, одамон ва нақл дар бораи худ',
    titleEn: 'Meeting People & Self',
    icon: 'Users',
    descriptionRu: 'Приветствия, имя, семья, люди, возраст, внешность и базовое общение',
    descriptionTj: 'Салом додан, ном, оила, синну сол, намуди зоҳирӣ ва муошират',
    topPriority: [
      'hello', 'hi', 'name', 'meet', 'nice', 'introduce', 'welcome', 'person', 'people', 'friend',
      'man', 'woman', 'boy', 'girl', 'family', 'live', 'speak', 'talk', 'call', 'mother',
      'father', 'brother', 'sister', 'good', 'glad', 'child', 'children', 'parent', 'parents', 'son',
      'daughter', 'baby', 'mr', 'mrs', 'miss', 'sir', 'lady', 'young', 'old', 'age',
      'from', 'who', 'what', 'where', 'how', 'first', 'last', 'happy', 'smile', 'say',
      'tell', 'hear', 'listen', 'ask', 'answer', 'address', 'born', 'birth', 'grow', 'relative',
      'husband', 'wife', 'married', 'single', 'neighbor', 'colleague', 'guest', 'stranger', 'face',
      'eye', 'hair', 'tall', 'short', 'kind', 'polite', 'honest', 'friendly', 'smart', 'quiet'
    ],
    ruPatterns: [
      /знаком/i, /привет/i, /человек/i, /люди/i, /мужчин/i, /женщин/i, /мальчик/i, /девочк/i,
      /друг/i, /семь/i, /отец/i, /пап/i, /мам/i, /мать/i, /брат/i, /сестр/i, /сын/i, /дочь/i,
      /ребен/i, /дет/i, /родит/i, /возраст/i, /стар/i, /молод/i, /рожд/i, /назвать/i, /звать/i,
      /имя/i, /фамили/i, /встреч/i, /разговор/i, /говор/i, /сказа/i, /сосед/i, /родствен/i
    ]
  },
  {
    id: 'travel',
    index: 2,
    titleRu: 'Путешествия, город и транспорт',
    titleTj: 'Сафар, шаҳр ва нақлиёт',
    titleEn: 'Travel, City & Navigation',
    icon: 'Plane',
    descriptionRu: 'Аэропорт, билеты, отель, направления, транспорт, улицы и ориентирование',
    descriptionTj: 'Фурудгоҳ, чиптаҳо, меҳмонхона, самтҳо, нақлиёт ва пайдо кардани роҳ',
    topPriority: [
      'airport', 'plane', 'airplane', 'flight', 'fly', 'ticket', 'passport', 'visa', 'hotel', 'room',
      'city', 'town', 'street', 'road', 'way', 'direction', 'map', 'car', 'bus', 'train',
      'station', 'taxi', 'arrive', 'arrival', 'depart', 'departure', 'leave', 'travel', 'trip', 'journey',
      'visit', 'tourist', 'tour', 'luggage', 'baggage', 'suitcase', 'pack', 'left', 'right', 'straight',
      'near', 'far', 'cross', 'bridge', 'stop', 'subway', 'metro', 'platform', 'fast', 'slow',
      'distance', 'lost', 'find', 'guide', 'abroad', 'foreign', 'border', 'customs', 'gate', 'seat'
    ],
    ruPatterns: [
      /путешеств/i, /аэропорт/i, /самолет/i, /билет/i, /паспорт/i, /виза/i, /отел/i, /гостиниц/i,
      /город/i, /улиц/i, /дорог/i, /маршрут/i, /направлен/i, /карт/i, /машин/i, /автобус/i, /поезд/i,
      /вокзал/i, /станци/i, /такси/i, /прибы/i, /отправ/i, /багаж/i, /чемодан/i, /турист/i, /поездк/i,
      /метро/i, /транспорт/i, /водитель/i, /пассажир/i, /рейс/i, /таможн/i, /границ/i
    ]
  },
  {
    id: 'food',
    index: 3,
    titleRu: 'Еда, супермаркет и кафе',
    titleTj: 'Ғизо, супермаркет ва қаҳвахона',
    titleEn: 'Food, Shopping & Dining',
    icon: 'ShoppingBag',
    descriptionRu: 'Супермаркет, продукты, кафе, заказ еды, меню, цены и покупки',
    descriptionTj: 'Супермаркет, маҳсулот, қаҳвахона, фармоиши хӯрок, меню ва харид',
    topPriority: [
      'food', 'eat', 'drink', 'water', 'bread', 'tea', 'coffee', 'milk', 'sugar', 'salt',
      'meat', 'chicken', 'beef', 'fish', 'fruit', 'apple', 'banana', 'orange', 'vegetable', 'potato',
      'tomato', 'rice', 'cheese', 'egg', 'butter', 'oil', 'soup', 'salad', 'sandwich', 'pizza',
      'cake', 'restaurant', 'cafe', 'menu', 'order', 'waiter', 'bill', 'check', 'pay', 'price',
      'cost', 'buy', 'sell', 'shop', 'store', 'market', 'supermarket', 'bag', 'cash', 'card',
      'money', 'cheap', 'expensive', 'fresh', 'delicious', 'taste', 'hungry', 'thirsty', 'breakfast', 'lunch'
    ],
    ruPatterns: [
      /ед[аы]/i, /пищ/i, /куша/i, /пить/i, /напиток/i, /вод[аы]/i, /хлеб/i, /чай/i, /кофе/i, /молок/i,
      /мяс/i, /рыб/i, /фрукт/i, /овощ/i, /ресторан/i, /кафе/i, /меню/i, /заказ/i, /счет/i, /плат/i,
      /цен[аы]/i, /стоимост/i, /купит/i, /покуп/i, /магазин/i, /рынок/i, /супермаркет/i, /завтрак/i,
      /обед/i, /ужин/i, /блюд/i, /вкус/i, /голод/i, /жажд/i, /сахар/i, /сол[ьи]/i, /яйц/i, /сыр/i
    ]
  },
  {
    id: 'daily_life',
    index: 4,
    titleRu: 'Дом, быт и каждый день',
    titleTj: 'Хона, рӯзгор ва реҷаи рӯз',
    titleEn: 'Home & Daily Routine',
    icon: 'Home',
    descriptionRu: 'Дом, квартира, уборка, одежда, распорядок дня и бытовые дела',
    descriptionTj: 'Хона, либос, реҷаи рӯз ва корҳои рӯзгор',
    topPriority: [
      'home', 'house', 'apartment', 'flat', 'room', 'door', 'window', 'wall', 'floor', 'roof',
      'key', 'lock', 'bedroom', 'kitchen', 'bathroom', 'toilet', 'bed', 'sleep', 'wake', 'wake up',
      'morning', 'evening', 'night', 'day', 'time', 'clock', 'watch', 'hour', 'minute', 'alarm',
      'wash', 'shower', 'bath', 'brush', 'clean', 'tidy', 'clothes', 'wear', 'put on', 'shirt',
      'pants', 'trousers', 'dress', 'shoes', 'jacket', 'coat', 'hat', 'socks', 'mirror', 'light',
      'lamp', 'furniture', 'table', 'chair', 'sofa', 'curtain', 'blanket', 'pillow', 'towel', 'trash'
    ],
    ruPatterns: [
      /дом/i, /квартир/i, /комнат/i, /двер/i, /окн/i, /кроват/i, /спать/i, /просыпа/i, /утро/i, /вечер/i,
      /ночь/i, /час/i, /минут/i, /умыва/i, /чистит/i, /мыть/i, /одежд/i, /носит/i, /одева/i, /рубашк/i,
      /брюк/i, /плать/i, /обув/i, /куртк/i, /пальто/i, /стол/i, /стул/i, /диван/i, /уборк/i, /быт/i
    ]
  },
  {
    id: 'work',
    index: 5,
    titleRu: 'Работа, карьера и бизнес',
    titleTj: 'Кор, касб ва тиҷорат',
    titleEn: 'Work, Career & Office',
    icon: 'Briefcase',
    descriptionRu: 'Профессия, офис, начальник, коллеги, проекты, звонки и задачи',
    descriptionTj: 'Касб, дафтар, роҳбар, ҳамкорон, лоиҳаҳо ва вазифаҳо',
    topPriority: [
      'work', 'job', 'career', 'office', 'company', 'boss', 'manager', 'worker', 'employee', 'employer',
      'colleague', 'team', 'meeting', 'project', 'task', 'duty', 'salary', 'wage', 'contract', 'deal',
      'client', 'customer', 'business', 'profession', 'interview', 'hire', 'fire', 'resume', 'cv', 'experience',
      'skill', 'plan', 'goal', 'target', 'success', 'successful', 'fail', 'problem', 'solve', 'solution',
      'decision', 'decide', 'report', 'email', 'letter', 'document', 'file', 'presentation', 'lead', 'leader'
    ],
    ruPatterns: [
      /работ/i, /професси/i, /карьер/i, /офис/i, /компан/i, /начальник/i, /менеджер/i, /сотрудник/i,
      /коллег/i, /команд/i, /проект/i, /задач/i, /зарплат/i, /договор/i, /контракт/i, /клиент/i,
      /бизнес/i, /интервью/i, /собеседован/i, /резюме/i, /опыт/i, /навык/i, /успех/i, /решен/i
    ]
  },
  {
    id: 'health',
    index: 6,
    titleRu: 'Здоровье, тело и самочувствие',
    titleTj: 'Саломатӣ, бадан ва вазъи ҷисмонӣ',
    titleEn: 'Health, Body & Medical',
    icon: 'Heart',
    descriptionRu: 'Части тела, симптомы, самочувствие, аптека, врач и лекарства',
    descriptionTj: 'Узвҳои бадан, аломатҳо, дорухона, табиб ва доруҳо',
    topPriority: [
      'health', 'healthy', 'sick', 'ill', 'illness', 'disease', 'body', 'head', 'eye', 'ear',
      'nose', 'mouth', 'tooth', 'teeth', 'throat', 'neck', 'shoulder', 'chest', 'back', 'stomach',
      'arm', 'hand', 'finger', 'leg', 'foot', 'feet', 'knee', 'skin', 'blood', 'heart',
      'brain', 'pain', 'headache', 'hurt', 'wound', 'injury', 'fever', 'temperature', 'cough', 'cold',
      'flu', 'doctor', 'nurse', 'hospital', 'clinic', 'pharmacy', 'chemist', 'medicine', 'pill', 'tablet'
    ],
    ruPatterns: [
      /здоров/i, /боле/i, /болезн/i, /тело/i, /голов/i, /глаз/i, /ухо/i, /уши/i, /нос/i, /рот/i,
      /зуб/i, /горло/i, /шея/i, /плеч/i, /груд/i, /спин/i, /живот/i, /рук/i, /палец/i, /ног/i,
      /стоп/i, /колен/i, /кожа/i, /кров/i, /сердц/i, /мозг/i, /боль/i, /ран/i, /травм/i, /температур/i,
      /кашел/i, /простуд/i, /грипп/i, /врач/i, /доктор/i, /медсестр/i, /больниц/i, /поликлиник/i, /аптек/i
    ]
  },
  {
    id: 'leisure',
    index: 7,
    titleRu: 'Хобби, спорт и отдых',
    titleTj: 'Истироҳат, варзиш ва маҳфилҳо',
    titleEn: 'Hobbies, Sports & Leisure',
    icon: 'Trophy',
    descriptionRu: 'Выходные, спорт, тренировки, кино, музыка, книги и увлечения',
    descriptionTj: 'Рӯзҳои истироҳат, варзиш, машқ, синамо, мусиқӣ ва маҳфилҳо',
    topPriority: [
      'hobby', 'leisure', 'free', 'weekend', 'holiday', 'vacation', 'rest', 'relax', 'game', 'play',
      'sport', 'sports', 'football', 'soccer', 'basketball', 'tennis', 'swimming', 'swim', 'pool', 'running',
      'run', 'gym', 'fitness', 'exercise', 'workout', 'train', 'training', 'match', 'player', 'win',
      'winner', 'lose', 'champion', 'music', 'song', 'sing', 'singer', 'dance', 'guitar', 'piano',
      'movie', 'film', 'cinema', 'theatre', 'book', 'read', 'photo', 'photography', 'camera', 'art'
    ],
    ruPatterns: [
      /хобби/i, /увлечен/i, /отдых/i, /выходн/i, /каникул/i, /отпуск/i, /игр/i, /спорт/i, /футбол/i,
      /баскетбол/i, /теннис/i, /плава/i, /бассейн/i, /бег/i, /трениров/i, /матч/i, /побед/i, /чемпион/i,
      /музык/i, /песн/i, /пет/i, /танец/i, /танц/i, /гитар/i, /пианино/i, /кино/i, /фильм/i, /театр/i
    ]
  },
  {
    id: 'tech',
    index: 8,
    titleRu: 'Технологии, связь и интернет',
    titleTj: 'Технология, интернет ва алоқа',
    titleEn: 'Tech, Gadgets & Digital',
    icon: 'Smartphone',
    descriptionRu: 'Телефон, компьютер, интернет, приложения, сообщения и социальные сети',
    descriptionTj: 'Телефон, компютер, интернет, барномаҳо ва шабакаҳои иҷтимоӣ',
    topPriority: [
      'computer', 'laptop', 'pc', 'phone', 'smartphone', 'mobile', 'screen', 'keyboard', 'mouse', 'internet',
      'web', 'website', 'online', 'offline', 'digital', 'network', 'wifi', 'connection', 'connect', 'app',
      'software', 'program', 'device', 'gadget', 'charger', 'battery', 'cable', 'button', 'click', 'press',
      'download', 'upload', 'install', 'update', 'send', 'receive', 'message', 'text', 'chat', 'email'
    ],
    ruPatterns: [
      /компьютер/i, /ноутбук/i, /телефон/i, /смартфон/i, /экран/i, /клавиатур/i, /мышь/i, /интернет/i,
      /сайт/i, /онлайн/i, /сеть/i, /вайфай/i, /подключ/i, /приложен/i, /программ/i, /устройств/i,
      /гаджет/i, /зарядк/i, /батаре/i, /кнопк/i, /скача/i, /загруз/i, /сообщен/i, /чат/i, /пароль/i
    ]
  },
  {
    id: 'emotions',
    index: 9,
    titleRu: 'Эмоции, характер и отношения',
    titleTj: 'Эҳсосот, хислат ва муносибатҳо',
    titleEn: 'Emotions & Relationships',
    icon: 'Sparkles',
    descriptionRu: 'Чувства, настроение, черты характера, дружба, доверие и мысли',
    descriptionTj: 'Эҳсосот, кайфият, хислатҳои инсонӣ ва боварӣ',
    topPriority: [
      'feel', 'feeling', 'emotion', 'mood', 'happy', 'happiness', 'joy', 'smile', 'laugh', 'sad',
      'cry', 'angry', 'anger', 'upset', 'afraid', 'fear', 'scared', 'worry', 'nervous', 'calm',
      'proud', 'love', 'like', 'hate', 'hope', 'wish', 'dream', 'trust', 'respect', 'honest',
      'truth', 'lie', 'kind', 'polite', 'rude', 'patient', 'lazy', 'smart', 'clever', 'stupid'
    ],
    ruPatterns: [
      /чувств/i, /эмоци/i, /настроен/i, /счаст/i, /радост/i, /улыбк/i, /сме/i, /груст/i, /плак/i,
      /слез/i, /зл[оы]/i, /гнев/i, /страх/i, /боя/i, /пережива/i, /волнова/i, /спокой/i, /горд/i,
      /люб/i, /ненавид/i, /надежд/i, /желан/i, /мечт/i, /довер/i, /уважен/i, /честн/i, /правд/i
    ]
  },
  {
    id: 'society',
    index: 10,
    titleRu: 'Общество, образование и мир',
    titleTj: 'Ҷомеа, маориф ва ҷаҳон',
    titleEn: 'Society, Nature & World',
    icon: 'Globe',
    descriptionRu: 'Природа, погода, мир, общество, правила, законы, школа и образование',
    descriptionTj: 'Табиат, обу ҳаво, ҷаҳон, ҷомеа, мактаб ва маориф',
    topPriority: [
      'world', 'earth', 'nature', 'environment', 'tree', 'forest', 'river', 'sea', 'ocean', 'lake',
      'mountain', 'sky', 'sun', 'moon', 'star', 'weather', 'rain', 'snow', 'wind', 'cloud',
      'warm', 'cold', 'hot', 'storm', 'season', 'spring', 'summer', 'autumn', 'winter', 'country',
      'nation', 'society', 'community', 'culture', 'history', 'future', 'past', 'law', 'rule', 'right',
      'freedom', 'peace', 'war', 'government', 'school', 'study', 'learn', 'student', 'teacher', 'university'
    ],
    ruPatterns: [
      /мир/i, /земл/i, /природ/i, /дерев/i, /лес/i, /рек/i, /мор/i, /океан/i, /озер/i, /гор[аы]/i,
      /небо/i, /солнц/i, /лун/i, /звезд/i, /погод/i, /дожд/i, /снег/i, /ветер/i, /облак/i, /тепл/i,
      /холод/i, /сезон/i, /весна/i, /лето/i, /осен/i, /зима/i, /стран/i, /наци/i, /обществ/i, /культур/i,
      /истори/i, /будущ/i, /прошл/i, /закон/i, /прав[оа]/i, /свобод/i, /школ/i, /учеб/i, /учит/i
    ]
  }
];

// Helper: Get CEFR level for a word
function getWordLevel(w) {
  const clean = w.cleanEn.toLowerCase();
  const direct = cefrMap[clean] || cefrMap[clean.split(' ')[0]];
  if (direct) return direct;

  // Fallbacks: common essential words are A1/A2
  if (clean.length <= 4) return 'A2';
  return 'B1';
}

// Attach levels to all words
words.forEach(w => {
  w.level = getWordLevel(w);
});

// Level rank for sorting: A1 = 1, A2 = 2, B1 = 3, B2 = 4, C1 = 5
const LEVEL_ORDER = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5 };

function scoreWordForCategory(word, catConfig) {
  let score = 0;
  const en = word.cleanEn.toLowerCase();
  const ru = (word.ru || '').toLowerCase();

  const topIdx = catConfig.topPriority.indexOf(en);
  if (topIdx !== -1) {
    return 10000 - topIdx;
  }

  for (let i = 0; i < catConfig.topPriority.length; i++) {
    const p = catConfig.topPriority[i];
    if (en === p || en.startsWith(p + ' ') || en.endsWith(' ' + p)) {
      return 5000 - i;
    }
  }

  for (const regex of catConfig.ruPatterns) {
    if (regex.test(ru)) {
      score += 60;
      break;
    }
  }

  return score;
}

// Score and bucket
const scoredWords = words.map(w => {
  const scores = CATEGORIES_CONFIG.map(cat => ({
    catId: cat.id,
    catIndex: cat.index,
    score: scoreWordForCategory(w, cat)
  }));
  scores.sort((a, b) => b.score - a.score);
  return {
    word: w,
    bestCatId: scores[0].score > 0 ? scores[0].catId : null,
    bestScore: scores[0].score
  };
});

const buckets = {};
CATEGORIES_CONFIG.forEach(c => { buckets[c.id] = []; });
const unassigned = [];

scoredWords.forEach(item => {
  if (item.bestCatId && item.bestScore > 0) {
    buckets[item.bestCatId].push(item);
  } else {
    unassigned.push(item);
  }
});

// Sort unassigned by level (A1 first, then A2, etc.)
unassigned.sort((a, b) => {
  const la = LEVEL_ORDER[a.word.level] || 3;
  const lb = LEVEL_ORDER[b.word.level] || 3;
  return la - lb;
});

// Distribute unassigned evenly
unassigned.forEach((item, idx) => {
  let minCat = CATEGORIES_CONFIG[0].id;
  let minCount = buckets[minCat].length;
  for (const c of CATEGORIES_CONFIG) {
    if (buckets[c.id].length < minCount) {
      minCat = c.id;
      minCount = buckets[c.id].length;
    }
  }
  buckets[minCat].push({
    word: item.word,
    bestCatId: minCat,
    bestScore: 0
  });
});

// SORT EACH BUCKET:
// 1. CEFR Level (A1 -> A2 -> B1 -> B2 -> C1)
// 2. Within the same level: bestScore descending (core thematic words first!)
CATEGORIES_CONFIG.forEach(c => {
  buckets[c.id].sort((a, b) => {
    const lvlA = LEVEL_ORDER[a.word.level] || 3;
    const lvlB = LEVEL_ORDER[b.word.level] || 3;
    if (lvlA !== lvlB) return lvlA - lvlB;
    return b.bestScore - a.bestScore;
  });

  // Deduplicate cleanEn
  const seen = new Set();
  const deduped = [];
  const dupes = [];
  buckets[c.id].forEach(item => {
    const key = item.word.cleanEn.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    } else {
      dupes.push(item);
    }
  });
  buckets[c.id] = [...deduped, ...dupes];
});

// Reconstruct words with categoryBatch (30 words per batch)
const wordsPerBatch = 30;
const finalWords = [];

CATEGORIES_CONFIG.forEach(cat => {
  const bucket = buckets[cat.id];
  bucket.forEach((item, index) => {
    const batchNum = Math.floor(index / wordsPerBatch) + 1;
    const wordIdxInBatch = (index % wordsPerBatch) + 1;
    const originalWord = item.word;

    const w = {
      ...originalWord,
      level: originalWord.level,
      categoryId: cat.id,
      categoryIndex: cat.index,
      categoryTitleRu: cat.titleRu,
      categoryBatch: batchNum,
      categoryWordIndex: wordIdxInBatch
    };

    finalWords.push(w);
  });
});

// Build categories summary with batch level tagging
const categoriesSummary = CATEGORIES_CONFIG.map(cat => {
  const catWords = finalWords.filter(w => w.categoryId === cat.id);
  const totalBatches = Math.ceil(catWords.length / wordsPerBatch);

  const batches = [];
  for (let b = 1; b <= totalBatches; b++) {
    const bWords = catWords.filter(w => w.categoryBatch === b);
    // Determine dominant level for the batch
    const levelCounts = {};
    bWords.forEach(w => {
      levelCounts[w.level] = (levelCounts[w.level] || 0) + 1;
    });
    let batchLevel = 'A1';
    let maxCount = 0;
    for (const [lvl, cnt] of Object.entries(levelCounts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        batchLevel = lvl;
      }
    }

    batches.push({
      batch: b,
      level: batchLevel,
      count: bWords.length,
      sample: bWords.slice(0, 3).map(w => w.cleanEn)
    });
  }

  // Preserve monologue
  const existingCategories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  const prevCat = existingCategories.find(c => c.id === cat.id);

  return {
    id: cat.id,
    index: cat.index,
    titleRu: cat.titleRu,
    titleTj: cat.titleTj,
    titleEn: cat.titleEn,
    icon: cat.icon,
    descriptionRu: cat.descriptionRu,
    descriptionTj: cat.descriptionTj,
    keywords: cat.topPriority.slice(0, 25),
    totalWords: catWords.length,
    totalBatches,
    batches,
    monologue: prevCat ? prevCat.monologue : null
  };
});

fs.writeFileSync(wordsPath, JSON.stringify(finalWords, null, 2), 'utf8');
fs.writeFileSync(categoriesPath, JSON.stringify(categoriesSummary, null, 2), 'utf8');

console.log('Successfully reorganized with CEFR levels!');
console.log('Meeting Category batches breakdown:');
const meetingCat = categoriesSummary.find(c => c.id === 'meeting');
meetingCat.batches.slice(0, 6).forEach(b => {
  console.log(`  Блок ${b.batch} [${b.level}]: ${b.count} слов (пример: ${b.sample.join(', ')})`);
});
