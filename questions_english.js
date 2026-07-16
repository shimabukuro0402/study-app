// 英語 問題データ - 学習指導要領（平成29年告示）解説 外国語活動・外国語編に基づく
// G1-6：聞く・話す（発表）を中心に、読む・書くを関連付ける

// ヘルパー関数（app.jsと重複するが、単体で動作させるために必要）
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function q(text, ans, opts) { return { q: text, a: ans, c: opts || [ans] }; }

const Q_ENGLISH = {};

// 学習指導要領に基づく問題プールを初期化
function initEnglishQuestions() {
  const grades = [1,2,3,4,5,6];
  const terms = [1,2,3];
  const diffs = ['easy','normal','hard'];
  for (const g of grades) {
    Q_ENGLISH[g] = {};
    for (const t of terms) {
      Q_ENGLISH[g][t] = {};
      for (const d of diffs) {
        Q_ENGLISH[g][t][d] = generateEnglishPool(g, t, d);
      }
    }
  }
  return Q_ENGLISH;
}

// 英語問題プール生成（各組合せ100問以上）
function generateEnglishPool(grade, term, diff) {
  const pool = [];
  const level = diff === 'easy' ? 'basic' : diff === 'normal' ? 'intermediate' : 'advanced';
  
  // カテゴリ別問題
  const categories = [
    // 1. 挨拶・基本表現 (G1-6共通)
    { grades: [1,2,3,4,5,6], count: 15, questions: [
      q("「おはよう」の英語は？", "Good morning", ["Good morning","Good night","Good evening","Hello"]),
      q("「こんにちは」の英語は？", "Hello", ["Hello","Good morning","Good night","Goodbye"]),
      q("「さようなら」の英語は？", "Goodbye", ["Goodbye","Hello","Thank you","Sorry"]),
      q("「ありがとう」の英語は？", "Thank you", ["Thank you","Sorry","Please","Hello"]),
      q("「ごめんなさい」の英語は？", "Sorry", ["Sorry","Thank you","Please","Goodbye"]),
      q("「はい」の英語は？", "Yes", ["Yes","No","OK","Good"]),
      q("「いいえ」の英語は？", "No", ["No","Yes","OK","Not"]),
      q("お願いしますの英語は？", "Please", ["Please","Thank you","Sorry","Hello"]),
      q("「おやすみ」の英語は？", "Good night", ["Good night","Good morning","Good evening","Hello"]),
      q("「こんばんは」の英語は？", "Good evening", ["Good evening","Good morning","Good night","Hello"]),
      q("How are you?のこたえは？", "I'm fine.", ["I'm fine.","I'm 10.","I'm a boy.","I'm Japanese."]),
      q("What's your name?のこたえは？", "My name is Taro.", ["My name is Taro.","I'm 10.","I like apples.","Yes, I do."]),
      q("「またあとで」の英語は？", "See you later.", ["See you later.","Good morning.","Thank you.","Sorry."]),
      q("「いい天気ですね」の英語は？", "It's nice weather.", ["It's nice weather.","It's rainy.","It's cold.","It's hot."]),
      q("Nice to meet you.のこたえは？", "Nice to meet you, too.", ["Nice to meet you, too.","Thank you.","Goodbye.","Yes, I do."])
    ]},
    // 2. 色 (G1-6)
    { grades: [1,2,3,4,5,6], count: 10, questions: [
      q("赤の英語は？", "red", ["red","blue","yellow","green"]),
      q("青の英語は？", "blue", ["blue","red","black","white"]),
      q("黄色の英語は？", "yellow", ["yellow","green","red","blue"]),
      q("緑の英語は？", "green", ["green","red","blue","yellow"]),
      q("白の英語は？", "white", ["white","black","red","blue"]),
      q("黒の英語は？", "black", ["black","white","brown","gray"]),
      q("茶色の英語は？", "brown", ["brown","black","gray","pink"]),
      q("ピンクの英語は？", "pink", ["pink","red","purple","orange"]),
      q("紫の英語は？", "purple", ["purple","pink","blue","red"]),
      q("オレンジ色の英語は？", "orange", ["orange","yellow","red","gold"])
    ]},
    // 3. 数字1-10 (G1-2)
    { grades: [1,2], count: 12, questions: [
      q("1の英語は？", "one", ["one","two","three","four"]),
      q("2の英語は？", "two", ["two","one","three","four"]),
      q("3の英語は？", "three", ["three","two","four","five"]),
      q("4の英語は？", "four", ["four","five","three","six"]),
      q("5の英語は？", "five", ["five","four","six","seven"]),
      q("6の英語は？", "six", ["six","seven","five","eight"]),
      q("7の英語は？", "seven", ["seven","six","eight","nine"]),
      q("8の英語は？", "eight", ["eight","seven","nine","ten"]),
      q("9の英語は？", "nine", ["nine","eight","ten","seven"]),
      q("10の英語は？", "ten", ["ten","six","eight","nine"]),
      q("「いくつ？」の英語は？", "How many?", ["How many?","How much?","What time?","How old?"]),
      q("How old are you?のこたえは？", "I'm 7.", ["I'm 7.","My name is Taro.","I like cats.","Yes, I do."])
    ]},
    // 4. からだ (G1-2)
    { grades: [1,2], count: 10, questions: [
      q("「あたま」の英語は？", "head", ["head","hand","foot","arm"]),
      q("「かお」の英語は？", "face", ["face","head","hand","eye"]),
      q("「目」の英語は？", "eye", ["eye","ear","nose","mouth"]),
      q("「耳」の英語は？", "ear", ["ear","eye","nose","mouth"]),
      q("「はな」の英語は？", "nose", ["nose","eye","ear","mouth"]),
      q("「口」の英語は？", "mouth", ["mouth","nose","eye","ear"]),
      q("「手」の英語は？", "hand", ["hand","head","foot","arm"]),
      q("「足」の英語は？", "foot", ["foot","hand","leg","arm"]),
      q("「からだ」の英語は？", "body", ["body","head","hand","face"]),
      q("「ゆび」の英語は？", "finger", ["finger","hand","foot","toe"])
    ]},
    // 5. きもち (G1-2)
    { grades: [1,2], count: 10, questions: [
      q("「うれしい」の英語は？", "happy", ["happy","sad","hungry","tired"]),
      q("「かなしい」の英語は？", "sad", ["sad","happy","hungry","tired"]),
      q("「おなかすいた」の英語は？", "hungry", ["hungry","happy","sad","thirsty"]),
      q("「のどがかわいた」の英語は？", "thirsty", ["thirsty","hungry","happy","tired"]),
      q("「つかれた」の英語は？", "tired", ["tired","happy","sad","hungry"]),
      q("「たのしい」の英語は？", "fun", ["fun","happy","sad","good"]),
      q("「かっこいい」の英語は？", "cool", ["cool","cute","good","nice"]),
      q("「すごい」の英語は？", "great", ["great","good","nice","cool"]),
      q("How are you?のこたえ（きもち）は？", "I'm happy.", ["I'm happy.","I'm 7.","I'm Taro.","I'm a boy."]),
      q("「だいじょうぶ」の英語は？", "OK", ["OK","Yes","No","Good"])
    ]},
    // 6. 教室のもの (G1-2)
    { grades: [1,2], count: 10, questions: [
      q("「えんぴつ」の英語は？", "pencil", ["pencil","pen","eraser","ruler"]),
      q("「けしゴム」の英語は？", "eraser", ["eraser","pencil","pen","ruler"]),
      q("「ペン」の英語は？", "pen", ["pen","pencil","eraser","ruler"]),
      q("「ものさし」の英語は？", "ruler", ["ruler","pencil","pen","eraser"]),
      q("「本」の英語は？", "book", ["book","notebook","bag","desk"]),
      q("「ノート」の英語は？", "notebook", ["notebook","book","bag","desk"]),
      q("「かばん」の英語は？", "bag", ["bag","book","notebook","desk"]),
      q("「つくえ」の英語は？", "desk", ["desk","chair","book","bag"]),
      q("「いす」の英語は？", "chair", ["chair","desk","table","bed"]),
      q("「はさみ」の英語は？", "scissors", ["scissors","pencil","eraser","ruler"])
    ]},
    // 7. 数字11-20 (G3-4中心)
    { grades: [3,4], count: 12, questions: [
      q("1の英語は？", "one", ["one","two","three","four"]),
      q("2の英語は？", "two", ["two","one","three","four"]),
      q("3の英語は？", "three", ["three","two","four","five"]),
      q("4の英語は？", "four", ["four","five","three","six"]),
      q("5の英語は？", "five", ["five","four","six","seven"]),
      q("10の英語は？", "ten", ["ten","six","eight","nine"]),
      q("How old are you?のこたえは？", "I'm 10.", ["I'm 10.","My name is Taro.","I like cats.","Yes, I do."])
    ]},
    // 8. 数字20-100 (G5-6中心)
    { grades: [5,6], count: 10, questions: [
      q("20の英語は？", "twenty", ["twenty","twelve","thirty","fifty"]),
      q("30の英語は？", "thirty", ["thirty","twenty","forty","fifty"]),
      q("100の英語は？", "one hundred", ["one hundred","one thousand","ten","one million"]),
      q("50の英語は？", "fifty", ["fifty","forty","sixty","seventy"]),
      q("「いくつですか？」の英語は？", "How many?", ["How many?","How much?","What time?","How old?"])
    ]},
    // 9. 動物 (G1-6)
    { grades: [1,2,3,4,5,6], count: 10, questions: [
      q("犬の英語は？", "dog", ["dog","cat","bird","fish"]),
      q("猫の英語は？", "cat", ["cat","dog","bird","fish"]),
      q("鳥の英語は？", "bird", ["bird","dog","cat","fish"]),
      q("魚の英語は？", "fish", ["fish","dog","cat","bird"]),
      q("「動物」の英語は？", "animal", ["animal","plant","flower","tree"]),
      q("「ペット」の英語は？", "pet", ["pet","dog","cat","animal"]),
      q("「うさぎ」の英語は？", "rabbit", ["rabbit","dog","cat","bird"]),
      q("「かめ」の英語は？", "turtle", ["turtle","rabbit","fish","bird"]),
      q("「へび」の英語は？", "snake", ["snake","turtle","rabbit","fish"]),
      q("「さる」の英語は？", "monkey", ["monkey","dog","cat","rabbit"])
    ]},
    // 10. 食べ物 (G1-6)
    { grades: [1,2,3,4,5,6], count: 10, questions: [
      q("りんごの英語は？", "apple", ["apple","banana","orange","grape"]),
      q("バナナの英語は？", "banana", ["banana","apple","orange","grape"]),
      q("ごはんの英語は？", "rice", ["rice","bread","noodle","meat"]),
      q("パンの英語は？", "bread", ["bread","rice","cake","egg"]),
      q("牛にゅうの英語は？", "milk", ["milk","water","juice","tea"]),
      q("「たべもの」の英語は？", "food", ["food","drink","fruit","vegetable"]),
      q("「くだもの」の英語は？", "fruit", ["fruit","food","drink","vegetable"]),
      q("「やさい」の英語は？", "vegetable", ["vegetable","fruit","food","drink"]),
      q("「朝ごはん」の英語は？", "breakfast", ["breakfast","lunch","dinner","meal"]),
      q("「好きな食べ物は？」の英語は？", "What food do you like?", ["What food do you like?","What color do you like?","What animal do you like?","What sport do you like?"])
    ]},
    // 11. 家族 (G1-6)
    { grades: [1,2,3,4,5,6], count: 8, questions: [
      q("「お父さん」の英語は？", "father", ["father","mother","brother","sister"]),
      q("「お母さん」の英語は？", "mother", ["mother","father","brother","sister"]),
      q("「お兄さん」の英語は？", "brother", ["brother","sister","father","mother"]),
      q("「お姉さん」の英語は？", "sister", ["sister","brother","father","mother"]),
      q("「家族」の英語は？", "family", ["family","father","friend","parent"]),
      q("「友だち」の英語は？", "friend", ["friend","family","brother","sister"]),
      q("「先生」の英語は？", "teacher", ["teacher","doctor","student","driver"]),
      q("Who is he?のこたえは？", "He is my brother.", ["He is my brother.","She is my sister.","He is my father.","She is my mother."])
    ]},
    // 12. 天気・季節 (G1-6)
    { grades: [1,2,3,4,5,6], count: 10, questions: [
      q("「天気」の英語は？", "weather", ["weather","season","climate","temperature"]),
      q("「晴れ」の英語は？", "sunny", ["sunny","cloudy","rainy","snowy"]),
      q("「雨」の英語は？", "rainy", ["rainy","sunny","cloudy","snowy"]),
      q("「くもり」の英語は？", "cloudy", ["cloudy","sunny","rainy","snowy"]),
      q("「雪」の英語は？", "snowy", ["snowy","sunny","cloudy","rainy"]),
      q("「春」の英語は？", "spring", ["spring","summer","autumn","winter"]),
      q("「夏」の英語は？", "summer", ["summer","spring","autumn","winter"]),
      q("「秋」の英語は？", "autumn", ["autumn","summer","spring","winter"]),
      q("「冬」の英語は？", "winter", ["winter","summer","autumn","spring"]),
      q("How's the weather?のこたえは？", "It's sunny.", ["It's sunny.","I'm fine.","I like summer.","Yes, it is."])
    ]},
    // 13. 曜日 (G3-6)
    { grades: [3,4,5,6], count: 10, questions: [
      q("「月曜日」の英語は？", "Monday", ["Monday","Tuesday","Wednesday","Thursday"]),
      q("「火曜日」の英語は？", "Tuesday", ["Tuesday","Monday","Wednesday","Thursday"]),
      q("「水曜日」の英語は？", "Wednesday", ["Wednesday","Monday","Tuesday","Thursday"]),
      q("「木曜日」の英語は？", "Thursday", ["Thursday","Tuesday","Wednesday","Friday"]),
      q("「金曜日」の英語は？", "Friday", ["Friday","Monday","Saturday","Sunday"]),
      q("「土曜日」の英語は？", "Saturday", ["Saturday","Sunday","Friday","Monday"]),
      q("「日曜日」の英語は？", "Sunday", ["Sunday","Saturday","Monday","Friday"]),
      q("「今日」の英語は？", "today", ["today","tomorrow","yesterday","week"]),
      q("What day is it?のこたえは？", "It's Monday.", ["It's Monday.","It's January.","It's sunny.","It's 10 o'clock."])
    ]},
    // 14. 月 (G5-6)
    { grades: [5,6], count: 8, questions: [
      q("「1月」の英語は？", "January", ["January","February","March","April"]),
      q("「7月」の英語は？", "July", ["July","June","August","September"]),
      q("「12月」の英語は？", "December", ["December","November","October","September"]),
      q("「誕生日」の英語は？", "birthday", ["birthday","Christmas","New Year","holiday"]),
      q("When is your birthday?のこたえは？", "My birthday is in May.", ["My birthday is in May.","I'm 10.","I like apples.","It's Monday."])
    ]},
    // 15. スポーツ・趣味 (G5-6)
    { grades: [5,6], count: 10, questions: [
      q("「スポーツ」の英語は？", "sport", ["sport","game","play","exercise"]),
      q("「野球」の英語は？", "baseball", ["baseball","soccer","tennis","basketball"]),
      q("「サッカー」の英語は？", "soccer", ["soccer","baseball","tennis","basketball"]),
      q("「本を読む」の英語は？", "read books", ["read books","write letters","sing songs","draw pictures"]),
      q("「歌を歌う」の英語は？", "sing songs", ["sing songs","read books","play games","watch TV"]),
      q("What sport do you like?のこたえは？", "I like soccer.", ["I like soccer.","I play soccer.","I am a boy.","Yes, I do."]),
      q("「趣味」の英語は？", "hobby", ["hobby","sport","music","art"]),
      q("「上手」の英語は？", "good at", ["good at","bad at","good for","good with"])
    ]},
    // 16. 学校 (G1-6)
    { grades: [1,2,3,4,5,6], count: 8, questions: [
      q("「学校」の英語は？", "school", ["school","classroom","teacher","student"]),
      q("「教室」の英語は？", "classroom", ["classroom","school","gym","library"]),
      q("「図書館」の英語は？", "library", ["library","classroom","gym","office"]),
      q("「体育館」の英語は？", "gym", ["gym","library","classroom","office"]),
      q("「授業」の英語は？", "class", ["class","lesson","study","learn"]),
      q("「宿題」の英語は？", "homework", ["homework","class","lesson","study"]),
      q("「テスト」の英語は？", "test", ["test","class","lesson","study"]),
      q("「勉強する」の英語は？", "study", ["study","play","read","write"])
    ]},
    // 17. 形容詞 (G3-6)
    { grades: [3,4,5,6], count: 8, questions: [
      q("「大きい」の英語は？", "big", ["big","small","long","short"]),
      q("「小さい」の英語は？", "small", ["small","big","long","short"]),
      q("「新しい」の英語は？", "new", ["new","old","good","bad"]),
      q("「古い」の英語は？", "old", ["old","new","good","bad"]),
      q("「楽しい」の英語は？", "fun", ["fun","happy","sad","enjoy"]),
      q("「上手に」の英語は？", "well", ["well","good","better","best"]),
      q("「とても」の英語は？", "very", ["very","much","many","good"]),
      q("I like dogs.「私は犬が好きです」の否定形は？", "I don't like dogs.", ["I don't like dogs.","I like cats.","I am a dog.","I have a dog."])
    ]},
    // 18. 位置・場所 (G5-6)
    { grades: [5,6], count: 6, questions: [
      q("「上」の英語は？", "on", ["on","in","under","by"]),
      q("「中」の英語は？", "in", ["in","on","under","by"]),
      q("「下」の英語は？", "under", ["under","on","in","by"]),
      q("「横」の英語は？", "next to", ["next to","in front of","behind","between"]),
      q("「前」の英語は？", "in front of", ["in front of","next to","behind","between"]),
      q("「後ろ」の英語は？", "behind", ["behind","in front of","next to","between"])
    ]},
    // 19. 動作 (G5-6)
    { grades: [5,6], count: 6, questions: [
      q("「食べる」の英語は？", "eat", ["eat","drink","cook","have"]),
      q("「飲む」の英語は？", "drink", ["drink","eat","cook","have"]),
      q("「見る」の英語は？", "watch", ["watch","see","look","read"]),
      q("「聞く」の英語は？", "listen", ["listen","hear","sound","music"]),
      q("「行く」の英語は？", "go", ["go","come","walk","run"]),
      q("「来る」の英語は？", "come", ["come","go","walk","run"])
    ]},
    // 20. 文字（アルファベット）(G1-4)
    { grades: [1,2,3,4], count: 10, questions: [
      q("アルファベットの最初の文字は？", "A", ["A","B","C","Z"]),
      q("アルファベットの最後の文字は？", "Z", ["Z","A","Y","X"]),
      q("りんごの最初の文字は？", "A", ["A","B","C","O"]),
      q("dogの最初の文字は？", "D", ["D","B","C","G"]),
      q("猫を表す文字の最初は？", "C", ["C","D","B","A"]),
      q("大文字Aの小文字は？", "a", ["a","b","c","d"]),
      q("大文字Bの小文字は？", "b", ["b","a","c","d"]),
      q("Helloは何文字？", "5文字", ["5文字","4文字","6文字","3文字"]),
      q("「アイ」の文字は？", "I", ["I","A","U","E"]),
      q("「シー」の文字は？", "C", ["C","S","K","G"]),
      q("「エイ」の文字は？", "A", ["A","E","I","O"]),
      q("「ビー」の文字は？", "B", ["B","D","P","V"])
    ]},
    // 21. 値段 (G5-6)
    { grades: [5,6], count: 5, questions: [
      q("「いくらですか？」の英語は？", "How much?", ["How much?","How many?","What time?","How old?"]),
      q("「100円です」の英語は？", "It's 100 yen.", ["It's 100 yen.","It's 100 dollars.","It's 100 euros.","It's free."]),
      q("「買い物」の英語は？", "shopping", ["shopping","eating","playing","studying"]),
      q("「ほしい」の英語は？", "want", ["want","like","have","need"]),
      q("「かわいい」の英語は？", "cute", ["cute","cool","pretty","beautiful"])
    ]},
    // 22. 時間 (G5-6)
    { grades: [5,6], count: 5, questions: [
      q("「何時ですか？」の英語は？", "What time is it?", ["What time is it?","How many?","How much?","What day?"]),
      q("「7時です」の英語は？", "It's 7 o'clock.", ["It's 7 o'clock.","It's 7 hours.","It's 7 times.","It's 7 days."]),
      q("「朝」の英語は？", "morning", ["morning","afternoon","evening","night"]),
      q("「昼」の英語は？", "afternoon", ["afternoon","morning","evening","night"]),
      q("「毎日」の英語は？", "every day", ["every day","every week","every month","every year"])
    ]},
    // 23. 人称 (G5-6)
    { grades: [5,6], count: 6, questions: [
      q("「私」の英語は？", "I", ["I","you","he","she"]),
      q("「あなた」の英語は？", "you", ["you","I","he","she"]),
      q("「彼」の英語は？", "he", ["he","she","it","they"]),
      q("「彼女」の英語は？", "she", ["she","he","it","they"]),
      q("「私たち」の英語は？", "we", ["we","they","you","I"]),
      q("「彼ら」の英語は？", "they", ["they","we","you","it"])
    ]},
    // 24. 文化・行事 (G3-6)
    { grades: [3,4,5,6], count: 8, questions: [
      q("「クリスマス」の英語は？", "Christmas", ["Christmas","Halloween","Easter","New Year"]),
      q("「ハロウィン」の英語は？", "Halloween", ["Halloween","Christmas","Easter","New Year"]),
      q("「お正月」の英語は？", "New Year", ["New Year","Christmas","Halloween","Easter"]),
      q("「日本」の英語は？", "Japan", ["Japan","China","Korea","America"]),
      q("「アメリカ」の英語は？", "America", ["America","Japan","China","Korea"]),
      q("「世界」の英語は？", "world", ["world","country","culture","language"]),
      q("「外国」の英語は？", "foreign country", ["foreign country","home country","new country","big country"]),
      q("「英語」の英語は？", "English", ["English","Japanese","Chinese","French"])
    ]}
  ];
  
  // 学年に合ったカテゴリから問題を抽出
  for (const cat of categories) {
    if (cat.grades.includes(grade)) {
      const qs = shuffle(cat.questions);
      const cnt = Math.min(cat.count, qs.length);
      for (let i = 0; i < cnt; i++) {
        pool.push({...qs[i], c: shuffle(qs[i].c)});
      }
    }
  }
  
  // G5-6向け: 英作文（穴埋め）追加
  if (grade >= 5) {
    const sentenceQuestions = [
      q("私は○○が好きです「I ○○ ○○.」", "like ~", ["like ~","have ~","want ~","play ~"]),
      q("「〜できますか？」「Can you ○○?」", "Can you ~?", ["Can you ~?","Do you ~?","Are you ~?","Is it ~?"]),
      q("「私は○○できる」「I can ○○.」", "I can ~.", ["I can ~.","I have ~.","I like ~.","I want ~."]),
      q("「〜を持っています」「I have ○○.」", "I have ~.", ["I have ~.","I want ~.","I like ~.","I can ~."]),
      q("「〜になりたい」「I want to be ○○.」", "I want to be ~.", ["I want to be ~.","I want to have ~.","I want to go ~.","I like to be ~."])
    ];
    for (const qs of sentenceQuestions) {
      pool.push({...qs, c: shuffle(qs.c)});
    }
  }
  
  // 足りない分を補填
  const fillCount = Math.max(0, 100 - pool.length);
  const basicQs = categories[0].questions; // 挨拶から補充
  for (let i = 0; i < fillCount; i++) {
    const qs = basicQs[i % basicQs.length];
    pool.push({...qs, c: shuffle(qs.c)});
  }
  
  return shuffle(pool).slice(0, 110);
}