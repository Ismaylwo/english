const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '..', 'src', 'data', 'words.json');
const categoriesPath = path.join(__dirname, '..', 'src', 'data', 'categories.json');

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
console.log(`Loaded ${words.length} words.`);

// 1. Define the 10 Life Spheres with priority seeds and regex matchers
const CATEGORIES_CONFIG = [
  {
    id: 'meeting',
    index: 1,
    titleRu: 'Знакомство, люди и о себе',
    titleTj: 'Шиносоӣ, одамон ва нақл дар бораи худ',
    titleEn: 'Meeting People & Self',
    icon: 'Users',
    descriptionRu: 'Приветствия, имя, семья, люди, возраст, внешность и базовые глаголы общения',
    descriptionTj: 'Салом додан, ном, оила, синну сол, намуди зоҳирӣ ва феълҳои асосии муошират',
    // Exact priority order for first batches
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
      'distance', 'lost', 'find', 'guide', 'abroad', 'foreign', 'border', 'customs', 'gate', 'seat',
      'passenger', 'driver', 'drive', 'ride', 'walk', 'route', 'destination', 'traffic', 'ship', 'boat'
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
      'money', 'cheap', 'expensive', 'fresh', 'delicious', 'taste', 'hungry', 'thirsty', 'breakfast', 'lunch',
      'dinner', 'meal', 'cook', 'kitchen', 'plate', 'cup', 'glass', 'bottle', 'fork', 'spoon',
      'knife', 'sweet', 'sour', 'bitter', 'spicy', 'hot', 'cold', 'dessert', 'snack', 'bake'
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
      'lamp', 'furniture', 'table', 'chair', 'sofa', 'curtain', 'blanket', 'pillow', 'towel', 'trash',
      'rubbish', 'daily', 'routine', 'habit', 'usually', 'always', 'often', 'sometimes', 'never', 'early',
      'late', 'start', 'begin', 'finish', 'end', 'open', 'close', 'iron', 'sweep', 'vacuum'
    ],
    ruPatterns: [
      /дом/i, /квартир/i, /комнат/i, /двер/i, /окн/i, /кроват/i, /спать/i, /просыпа/i, /утро/i, /вечер/i,
      /ночь/i, /час/i, /минут/i, /умыва/i, /чистит/i, /мыть/i, /одежд/i, /носит/i, /одева/i, /рубашк/i,
      /брюк/i, /плать/i, /обув/i, /куртк/i, /пальто/i, /стол/i, /стул/i, /диван/i, /уборк/i, /быт/i,
      /привычк/i, /посуд/i, /полотенц/i, /зеркал/i, /лампа/i, /ключ/i
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
      'decision', 'decide', 'report', 'email', 'letter', 'document', 'file', 'presentation', 'lead', 'leader',
      'busy', 'deadline', 'schedule', 'promotion', 'responsible', 'organization', 'department', 'manage', 'firm', 'earn'
    ],
    ruPatterns: [
      /работ/i, /професси/i, /карьер/i, /офис/i, /компан/i, /начальник/i, /менеджер/i, /сотрудник/i,
      /коллег/i, /команд/i, /проект/i, /задач/i, /зарплат/i, /договор/i, /контракт/i, /клиент/i,
      /бизнес/i, /интервью/i, /собеседован/i, /резюме/i, /опыт/i, /навык/i, /успех/i, /решен/i,
      /отчет/i, /документ/i, /руковод/i, /занят/i, /дедлайн/i, /уволь/i, /нанима/i
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
      'flu', 'doctor', 'nurse', 'hospital', 'clinic', 'pharmacy', 'chemist', 'medicine', 'pill', 'tablet',
      'drug', 'prescription', 'bandage', 'injection', 'rest', 'recover', 'care', 'breathe', 'diet', 'weight',
      'tired', 'weak', 'strong', 'fit', 'energy', 'patient', 'treat', 'treatment', 'cure', 'allergy'
    ],
    ruPatterns: [
      /здоров/i, /боле/i, /болезн/i, /тело/i, /голов/i, /глаз/i, /ухо/i, /уши/i, /нос/i, /рот/i,
      /зуб/i, /горло/i, /шея/i, /плеч/i, /груд/i, /спин/i, /живот/i, /рук/i, /палец/i, /ног/i,
      /стоп/i, /колен/i, /кожа/i, /кров/i, /сердц/i, /мозг/i, /боль/i, /ран/i, /травм/i, /температур/i,
      /кашел/i, /простуд/i, /грипп/i, /врач/i, /доктор/i, /медсестр/i, /больниц/i, /поликлиник/i, /аптек/i,
      /лекарств/i, /таблетк/i, /рецепт/i, /лечен/i, /пациент/i
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
      'movie', 'film', 'cinema', 'theatre', 'book', 'read', 'photo', 'photography', 'camera', 'art',
      'paint', 'painting', 'draw', 'drawing', 'fun', 'enjoy', 'party', 'festival', 'camp', 'fish'
    ],
    ruPatterns: [
      /хобби/i, /увлечен/i, /отдых/i, /выходн/i, /каникул/i, /отпуск/i, /игр/i, /спорт/i, /футбол/i,
      /баскетбол/i, /теннис/i, /плава/i, /бассейн/i, /бег/i, /трениров/i, /матч/i, /побед/i, /чемпион/i,
      /музык/i, /песн/i, /пет/i, /танец/i, /танц/i, /гитар/i, /пианино/i, /кино/i, /фильм/i, /театр/i,
      /книг/i, /чита/i, /фото/i, /искусств/i, /рисоват/i, /вечеринк/i, /праздник/i
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
      'download', 'upload', 'install', 'update', 'send', 'receive', 'message', 'text', 'chat', 'email',
      'video', 'audio', 'file', 'folder', 'data', 'information', 'search', 'account', 'profile', 'password',
      'login', 'security', 'code', 'link', 'browser', 'page', 'technology', 'system', 'tech', 'smart'
    ],
    ruPatterns: [
      /компьютер/i, /ноутбук/i, /телефон/i, /смартфон/i, /экран/i, /клавиатур/i, /мышь/i, /интернет/i,
      /сайт/i, /онлайн/i, /сеть/i, /вайфай/i, /подключ/i, /приложен/i, /программ/i, /устройств/i,
      /гаджет/i, /зарядк/i, /батаре/i, /кнопк/i, /скача/i, /загруз/i, /сообщен/i, /чат/i, /пароль/i,
      /аккаунт/i, /технолог/i, /цифров/i, /электрон/i
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
      'truth', 'lie', 'kind', 'polite', 'rude', 'patient', 'lazy', 'smart', 'clever', 'stupid',
      'funny', 'serious', 'strange', 'curious', 'shy', 'brave', 'generous', 'think', 'thought', 'believe',
      'agree', 'disagree', 'opinion', 'idea', 'soul', 'heart', 'care', 'passion', 'forgive', 'sorry'
    ],
    ruPatterns: [
      /чувств/i, /эмоци/i, /настроен/i, /счаст/i, /радост/i, /улыбк/i, /сме/i, /груст/i, /плак/i,
      /слез/i, /зл[оы]/i, /гнев/i, /страх/i, /боя/i, /пережива/i, /волнова/i, /спокой/i, /горд/i,
      /люб/i, /ненавид/i, /надежд/i, /желан/i, /мечт/i, /довер/i, /уважен/i, /честн/i, /правд/i,
      /ложь/i, /добр/i, /вежлив/i, /груб/i, /терпен/i, /умн/i, /глуп/i, /смешн/i, /серьезн/i,
      /дум/i, /мысл/i, /верит/i, /соглас/i, /мнен/i
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
      'freedom', 'peace', 'war', 'government', 'school', 'study', 'learn', 'student', 'teacher', 'university',
      'college', 'lesson', 'class', 'exam', 'test', 'knowledge', 'science', 'education', 'book', 'truth'
    ],
    ruPatterns: [
      /мир/i, /земл/i, /природ/i, /дерев/i, /лес/i, /рек/i, /мор/i, /океан/i, /озер/i, /гор[аы]/i,
      /небо/i, /солнц/i, /лун/i, /звезд/i, /погод/i, /дожд/i, /снег/i, /ветер/i, /облак/i, /тепл/i,
      /холод/i, /сезон/i, /весна/i, /лето/i, /осен/i, /зима/i, /стран/i, /наци/i, /обществ/i, /культур/i,
      /истори/i, /будущ/i, /прошл/i, /закон/i, /прав[оа]/i, /свобод/i, /школ/i, /учеб/i, /учит/i,
      /студент/i, /учител/i, /университет/i, /урок/i, /экзамен/i, /знани/i, /наук/i, /образован/i
    ]
  }
];

// Helper to check match score
function scoreWordForCategory(word, catConfig) {
  let score = 0;
  const en = word.cleanEn.toLowerCase();
  const ru = (word.ru || '').toLowerCase();

  // Top priority exact match
  const topIdx = catConfig.topPriority.indexOf(en);
  if (topIdx !== -1) {
    // 10000 points minus index so priority order is strictly preserved!
    return 10000 - topIdx;
  }

  // Priority sub-string or variant
  for (let i = 0; i < catConfig.topPriority.length; i++) {
    const p = catConfig.topPriority[i];
    if (en === p || en.startsWith(p + ' ') || en.endsWith(' ' + p)) {
      return 5000 - i;
    }
  }

  // Regex on Russian translation
  for (const regex of catConfig.ruPatterns) {
    if (regex.test(ru)) {
      score += 50;
      break;
    }
  }

  return score;
}

// 2. Score every word against all categories
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
    bestScore: scores[0].score,
    scores
  };
});

// Group by assigned category
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

console.log('Direct semantic assignments:');
CATEGORIES_CONFIG.forEach(c => {
  console.log(`  ${c.id}: ${buckets[c.id].length} words`);
});
console.log(`Unassigned remaining: ${unassigned.length}`);

// Sort each bucket by score descending (so top priority words are FIRST!)
CATEGORIES_CONFIG.forEach(c => {
  buckets[c.id].sort((a, b) => b.bestScore - a.bestScore);
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

// Distribute unassigned words evenly across categories based on general usefulness
// unassigned are sorted alphabetically or by original frequency
unassigned.forEach((item, idx) => {
  // Distribute to the category with fewest words
  let minCat = CATEGORIES_CONFIG[0].id;
  let minCount = buckets[minCat].length;
  for (const c of CATEGORIES_CONFIG) {
    if (buckets[c.id].length < minCount) {
      minCat = c.id;
      minCount = buckets[c.id].length;
    }
  }
  // Add to end of bucket (lower priority than matched words)
  buckets[minCat].push({
    word: item.word,
    bestCatId: minCat,
    bestScore: 0,
    scores: []
  });
});

console.log('Final counts per category:');
CATEGORIES_CONFIG.forEach(c => {
  console.log(`  ${c.id}: ${buckets[c.id].length} words`);
});

// 3. Perfect example sentences for the top priority meeting words
const CURATED_MEETING_EXAMPLES = {
  hello: {
    en: "Hello, how are you today?",
    ru: "Привет, как ты сегодня?",
    tj: "Салом, имрӯз аҳволат чӣ хел аст?",
    prefix: "", suffix: ", how are you today?", target: "Hello"
  },
  hi: {
    en: "Hi! It is great to see you again.",
    ru: "Привет! Очень рад снова тебя видеть.",
    tj: "Салом! Аз дидори дубораат хеле шодам.",
    prefix: "", suffix: "! It is great to see you again.", target: "Hi"
  },
  name: {
    en: "What is your name?",
    ru: "Как тебя зовут?",
    tj: "Номи ту чист?",
    prefix: "What is your ", suffix: "?", target: "name"
  },
  meet: {
    en: "Nice to meet you.",
    ru: "Приятно познакомиться.",
    tj: "Аз шиносоӣ бо шумо шодам.",
    prefix: "Nice to ", suffix: " you.", target: "meet"
  },
  nice: {
    en: "It is a nice day to meet new people.",
    ru: "Хороший день, чтобы познакомиться с новыми людьми.",
    tj: "Рӯзи хуб аст барои шиносоӣ бо одамони нав.",
    prefix: "It is a ", suffix: " day to meet new people.", target: "nice"
  },
  friend: {
    en: "He is my best friend from school.",
    ru: "Он мой лучший друг со школы.",
    tj: "Вай беҳтарин дӯсти ман аз мактаб аст.",
    prefix: "He is my best ", suffix: " from school.", target: "friend"
  },
  person: {
    en: "She is a very friendly person.",
    ru: "Она очень дружелюбный человек.",
    tj: "Вай як шахси хеле меҳрубон аст.",
    prefix: "She is a very friendly ", suffix: ".", target: "person"
  },
  people: {
    en: "Many people live in this beautiful town.",
    ru: "Многие люди живут в этом красивом городе.",
    tj: "Одамони зиёд дар ин шаҳри зебо зиндагӣ мекунанд.",
    prefix: "Many ", suffix: " live in this beautiful town.", target: "people"
  },
  man: {
    en: "That man is our new English teacher.",
    ru: "Тот мужчина — наш новый учитель английского.",
    tj: "Он мард муаллими нави забони англисии мост.",
    prefix: "That ", suffix: " is our new English teacher.", target: "man"
  },
  woman: {
    en: "The woman smiled and said hello.",
    ru: "Женщина улыбнулась и поздоровалась.",
    tj: "Зан табассум кард ва салом дод.",
    prefix: "The ", suffix: " smiled and said hello.", target: "woman"
  },
  boy: {
    en: "The boy introduced himself politely.",
    ru: "Мальчик вежливо представился.",
    tj: "Писарбача худро боодоб муаррифӣ кард.",
    prefix: "The ", suffix: " introduced himself politely.", target: "boy"
  },
  girl: {
    en: "The girl is my younger sister.",
    ru: "Эта девочка — моя младшая сестра.",
    tj: "Ин духтарча хоҳари хурдии ман аст.",
    prefix: "The ", suffix: " is my younger sister.", target: "girl"
  },
  family: {
    en: "I have a large and warm family.",
    ru: "У меня большая и дружная семья.",
    tj: "Ман оилаи калон ва тифлона дорам.",
    prefix: "I have a large and warm ", suffix: ".", target: "family"
  },
  live: {
    en: "Where do you live right now?",
    ru: "Где ты сейчас живешь?",
    tj: "Ту ҳоло дар куҷо зиндагӣ мекунӣ?",
    prefix: "Where do you ", suffix: " right now?", target: "live"
  },
  speak: {
    en: "Do you speak English or Russian?",
    ru: "Ты говоришь по-английски или по-русски?",
    tj: "Оё ту бо забони англисӣ ё русӣ гап мезанӣ?",
    prefix: "Do you ", suffix: " English or Russian?", target: "speak"
  },
  talk: {
    en: "We can talk about our hobbies.",
    ru: "Мы можем поговорить о наших увлечениях.",
    tj: "Мо метавонем дар бораи маҳфилҳоямон сӯҳбат кунем.",
    prefix: "We can ", suffix: " about our hobbies.", target: "talk"
  },
  call: {
    en: "You can call me Alex.",
    ru: "Ты можешь называть меня Алекс.",
    tj: "Ту метавонӣ маро Алекс номбар кунӣ.",
    prefix: "You can ", suffix: " me Alex.", target: "call"
  },
  mother: {
    en: "My mother is a doctor at the hospital.",
    ru: "Моя мама — врач в больнице.",
    tj: "Модари ман дар бемористон табиб аст.",
    prefix: "My ", suffix: " is a doctor at the hospital.", target: "mother"
  },
  father: {
    en: "My father taught me how to drive.",
    ru: "Мой папа научил меня водить машину.",
    tj: "Падарам ба ман рондани мошинро ёд дод.",
    prefix: "My ", suffix: " taught me how to drive.", target: "father"
  },
  brother: {
    en: "My brother is two years older than me.",
    ru: "Мой брат на два года старше меня.",
    tj: "Бародари ман ду сол аз ман калонтар аст.",
    prefix: "My ", suffix: " is two years older than me.", target: "brother"
  },
  sister: {
    en: "My sister loves learning new languages.",
    ru: "Моя сестра любит учить новые языки.",
    tj: "Хоҳари ман омӯхтани забонҳои навро дӯст медорад.",
    prefix: "My ", suffix: " loves learning new languages.", target: "sister"
  },
  introduce: {
    en: "Allow me to introduce my colleague.",
    ru: "Позвольте мне представить моего коллегу.",
    tj: "Иҷозат диҳед ҳамкорамро муаррифӣ кунам.",
    prefix: "Allow me to ", suffix: " my colleague.", target: "introduce"
  },
  welcome: {
    en: "Welcome to our city!",
    ru: "Добро пожаловать в наш город!",
    tj: "Ба шаҳри мо хуш омадед!",
    prefix: "", suffix: " to our city!", target: "Welcome"
  },
  good: {
    en: "It is good to meet you here.",
    ru: "Хорошо, что мы встретились здесь.",
    tj: "Хуб аст, ки мо дар ин ҷо вохӯрдем.",
    prefix: "It is ", suffix: " to meet you here.", target: "good"
  },
  glad: {
    en: "I am very glad to meet you.",
    ru: "Я очень рад познакомиться с тобой.",
    tj: "Ман хеле шодам, ки бо шумо шинос шудам.",
    prefix: "I am very ", suffix: " to meet you.", target: "glad"
  }
};

// 4. Reconstruct words with categoryBatch (25 words per batch)
const wordsPerBatch = 25;
const finalWords = [];

CATEGORIES_CONFIG.forEach(cat => {
  const bucket = buckets[cat.id];
  bucket.forEach((item, index) => {
    const batchNum = Math.floor(index / wordsPerBatch) + 1;
    const wordIdxInBatch = (index % wordsPerBatch) + 1;
    const originalWord = item.word;

    const w = {
      ...originalWord,
      categoryId: cat.id,
      categoryIndex: cat.index,
      categoryTitleRu: cat.titleRu,
      categoryBatch: batchNum,
      categoryWordIndex: wordIdxInBatch
    };

    // If we have a curated contextual example for this word in Meeting, use it!
    const cleanLower = w.cleanEn.toLowerCase();
    if (cat.id === 'meeting' && CURATED_MEETING_EXAMPLES[cleanLower]) {
      w.example = CURATED_MEETING_EXAMPLES[cleanLower];
    }

    finalWords.push(w);
  });
});

// 5. Build categories summary
const categoriesSummary = CATEGORIES_CONFIG.map(cat => {
  const catWords = finalWords.filter(w => w.categoryId === cat.id);
  const totalBatches = Math.ceil(catWords.length / wordsPerBatch);

  const batches = [];
  for (let b = 1; b <= totalBatches; b++) {
    const bWords = catWords.filter(w => w.categoryBatch === b);
    batches.push({
      batch: b,
      count: bWords.length,
      sample: bWords.slice(0, 3).map(w => w.cleanEn)
    });
  }

  // Preserve existing monologue if available
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

// Save updated files
fs.writeFileSync(wordsPath, JSON.stringify(finalWords, null, 2), 'utf8');
fs.writeFileSync(categoriesPath, JSON.stringify(categoriesSummary, null, 2), 'utf8');

console.log('Successfully written updated words.json and categories.json!');
console.log('Meeting Category Batch 1 sample:');
const meetingB1 = finalWords.filter(w => w.categoryId === 'meeting' && w.categoryBatch === 1);
meetingB1.forEach((w, i) => {
  console.log(`  ${i+1}. ${w.cleanEn} - ${w.ru}`);
});
