// 算数 問題データ - 学習指導要領（平成29年告示）解説 算数編に基づく
// 領域：A 数と計算、B 図形、C 測定（G1-3）/ 変化と関係（G4-6）、D データの活用

// ヘルパー関数（app.jsと重複するが、単体で動作させるために必要）
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function q(text, ans, opts) { return { q: text, a: ans, c: opts || [ans] }; }

const Q_MATH = {};

// 学習指導要領に基づく問題プールを初期化
function initMathQuestions() {
  const grades = [1,2,3,4,5,6];
  const terms = [1,2,3];
  const diffs = ['easy','normal','hard'];
  for (const g of grades) {
    Q_MATH[g] = {};
    for (const t of terms) {
      Q_MATH[g][t] = {};
      for (const d of diffs) {
        Q_MATH[g][t][d] = generateMathPool(g, t, d);
      }
    }
  }
  return Q_MATH;
}

// ===== 算数問題生成関数 =====
function generateMathPool(grade, term, diff) {
  const pool = [];
  const level = diff === 'easy' ? 0 : diff === 'normal' ? 1 : 2;
  
  // 学年・難易度に応じた数値範囲
  const ranges = mathGetMathRanges(grade, term, diff);
  
  // カテゴリ1: 加減算（全学年）
  if (grade === 1) {
    // 1年生：10までの数の計算
    for (let i = 0; i < 30; i++) {
      const a = randInt(1, 9);
      const b = randInt(0, 10 - a);
      pool.push(q(`${a} + ${b} = ?`, String(a + b)));
    }
    for (let i = 0; i < 20; i++) {
      const a = randInt(1, 10);
      const b = randInt(0, a);
      pool.push(q(`${a} - ${b} = ?`, String(a - b)));
    }
  } else if (grade === 2) {
    // 2年生：100までの数の計算
    for (let i = 0; i < 25; i++) {
      const a = randInt(10, 99);
      const b = randInt(0, 99);
      pool.push(q(`${a} + ${b} = ?`, String(a + b)));
    }
    for (let i = 0; i < 25; i++) {
      const a = randInt(10, 99);
      const b = randInt(0, a);
      pool.push(q(`${a} - ${b} = ?`, String(a - b)));
    }
  } else {
    // 3年生以上：大きな数
    for (let i = 0; i < 20; i++) {
      const a = randInt(ranges.add[0], ranges.add[1]);
      const b = randInt(ranges.add[0], ranges.add[1]);
      pool.push(q(`${a} + ${b} = ?`, String(a + b)));
    }
    for (let i = 0; i < 20; i++) {
      const a = randInt(ranges.add[0], ranges.add[1]);
      const b = randInt(ranges.sub[0], Math.min(ranges.sub[1], a));
      pool.push(q(`${a} - ${b} = ?`, String(a - b)));
    }
  }
  
  // カテゴリ2: 乗除算（G2-6）
  if (grade >= 2) {
    for (let i = 0; i < 15; i++) {
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      pool.push(q(`${a} × ${b} = ?`, String(a * b)));
    }
  }
  if (grade >= 3) {
    for (let i = 0; i < 15; i++) {
      const b = randInt(2, 9);
      const a = b * randInt(2, 12);
      pool.push(q(`${a} ÷ ${b} = ?`, String(a / b)));
    }
  }
  if (grade >= 4) {
    for (let i = 0; i < 10; i++) {
      const b = randInt(2, 12);
      const a = b * randInt(10, 99);
      pool.push(q(`${a} ÷ ${b} = ?`, String(a / b)));
    }
  }
  if (grade >= 5) {
    for (let i = 0; i < 10; i++) {
      const b = randInt(2, 20);
      const a = b * randInt(10, 999);
      pool.push(q(`${a} ÷ ${b} = ?`, String(a / b)));
    }
  }
  if (grade >= 6) {
    for (let i = 0; i < 10; i++) {
      const b = randInt(2, 30);
      const a = b * randInt(10, 9999);
      pool.push(q(`${a} ÷ ${b} = ?`, String(a / b)));
    }
  }
  
  // カテゴリ3: 小数（G3-6）
  if (grade >= 3) {
    for (let i = 0; i < 10; i++) {
      const a = randInt(1, 99);
      const b = randInt(1, 9);
      if (diff === 'easy') {
        pool.push(q(`${b} ÷ 10 は?`, (b / 10).toFixed(1)));
      } else if (diff === 'normal') {
        pool.push(q(`${a} ÷ 100 は?`, (a / 100).toFixed(2)));
      } else {
        const c = randInt(1, 9);
        pool.push(q(`${a}.${c} × 10 は?`, String(a * 10 + c)));
      }
    }
  }
  if (grade >= 4) {
    for (let i = 0; i < 10; i++) {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      const c = randInt(1, 9);
      if (diff === 'easy') {
        pool.push(q(`${a}.${b} + ${c}.${b} = ?`, String(a + c) + '.' + b));
      } else if (diff === 'normal') {
        pool.push(q(`${a}.${b} + ${c}.${randInt(1, 9)} = ?`, String((a + c) + '.' + b)));
      } else {
        pool.push(q(`${a}.${b} × ${c} = ?`, String((a * c) + '.' + (b * c))));
      }
    }
  }
  if (grade >= 5) {
    for (let i = 0; i < 10; i++) {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      const c = randInt(1, 9);
      if (diff === 'easy') {
        pool.push(q(`${a}.${b} ÷ ${c} = ?`, (a / c).toFixed(1)));
      } else if (diff === 'normal') {
        pool.push(q(`${a}.${b * 10} ÷ ${c} = ?`, ((a * 10 + b) / c).toFixed(1)));
      } else {
        pool.push(q(`${a}.${b} × ${c}.${randInt(1, 9)} = ?`, String((a * c) + '.' + (b * c))));
      }
    }
  }
  
  // カテゴリ4: 分数（G3-6）
  if (grade >= 3) {
    for (let i = 0; i < 8; i++) {
      const denom = pick([2, 3, 4, 5, 6, 8, 10]);
      const numer = randInt(1, denom - 1);
      pool.push(q(`分数 ${numer}/${denom} は?`, `${numer}/${denom}`, [`${numer}/${denom}`, `${denom}/${numer}`, `${numer}/${denom + 1}`, `${numer + 1}/${denom}`]));
    }
  }
  if (grade >= 4) {
    for (let i = 0; i < 8; i++) {
      const denom = pick([2, 3, 4, 5, 6, 8, 10, 12]);
      const numer = randInt(1, denom - 1);
      pool.push(q(`仮分数 ${numer}/${denom} は?`, `${numer}/${denom}`, [`${numer}/${denom}`, `${denom}/${numer}`, `${numer}/${denom + 1}`, `${numer + 1}/${denom}`]));
    }
  }
  if (grade >= 5) {
    for (let i = 0; i < 8; i++) {
      const a = randInt(1, 5);
      const b = randInt(1, 5);
      const c = randInt(1, 5);
      const d = randInt(1, 5);
      pool.push(q(`${a}/${b} + ${c}/${d} = ?`, `${(a * d + c * b)}/${b * d}`, [`${(a * d + c * b)}/${b * d}`, `${(a + c)}/${(b + d)}`, `${(a * d)}/${(b * d)}`, `${(c * b)}/${(d * b)}`]));
    }
  }
  
  // カテゴリ5: 図形（全学年）
  if (grade === 1) {
    const shapes = [
      {q: '三角形は何ぼんの辺がある?', a: '3', c: ['3', '4', '5', '6']},
      {q: '四角形は何ぼんの辺がある?', a: '4', c: ['3', '4', '5', '6']},
      {q: '五角形は何ぼんの辺がある?', a: '5', c: ['4', '5', '6', '7']},
      {q: '円は何ぼんの辺がある?', a: '0', c: ['0', '1', '2', '3']},
      {q: '長方形の特徴は?', a: '向かい合う辺が等しい', c: ['向かい合う辺が等しい', '4つの辺が全部等しい', '3つの辺がある', '丸い']},
      {q: '正方形の特徴は?', a: '4つの辺が全部等しい', c: ['4つの辺が全部等しい', '向かい合う辺が等しい', '3つの辺がある', '丸い']}
    ];
    for (const item of shapes) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 2) {
    const shapes = [
      {q: '三角形の角は何こ?', a: '3', c: ['3', '4', '5', '6']},
      {q: '四角形の角は何こ?', a: '4', c: ['3', '4', '5', '6']},
      {q: '正三角形の特徴は?', a: '3つの辺と角が全部等しい', c: ['3つの辺と角が全部等しい', '4つの辺が等しい', '丸い', '2つの辺がある']},
      {q: '正方形の面積の求め方は?', a: '辺の長さ × 辺の長さ', c: ['辺の長さ × 辺の長さ', '縦 × 横 ÷ 2', '底 × 高さ ÷ 2', '半径 × 半径 × 3.14']},
      {q: '長方形の面積の求め方は?', a: '縦 × 横', c: ['縦 × 横', '縦 × 横 ÷ 2', '底 × 高さ ÷ 2', '半径 × 半径 × 3.14']}
    ];
    for (const item of shapes) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 3) {
    const shapes = [
      {q: '三角形の面積の求め方は?', a: '底 × 高さ ÷ 2', c: ['底 × 高さ ÷ 2', '底 × 高さ', '縦 × 横', '半径 × 半径 × 3.14']},
      {q: '平行四辺形の面積の求め方は?', a: '底 × 高さ', c: ['底 × 高さ', '底 × 高さ ÷ 2', '縦 × 横', '半径 × 半径 × 3.14']},
      {q: '円の周の長さの求め方は?', a: '直径 × 3.14', c: ['直径 × 3.14', '半径 × 半径 × 3.14', '直径 ÷ 3.14', '半径 × 2 × 3.14']},
      {q: '円の面積の求め方は?', a: '半径 × 半径 × 3.14', c: ['半径 × 半径 × 3.14', '直径 × 3.14', '半径 × 2 × 3.14', '直径 × 直径 × 3.14']}
    ];
    for (const item of shapes) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 4) {
    const shapes = [
      {q: '角が90度の三角形を何という?', a: '直角三角形', c: ['直角三角形', '二等辺三角形', '正三角形', '钝角三角形']},
      {q: '2つの辺の長さが等しい三角形を何という?', a: '二等辺三角形', c: ['二等辺三角形', '正三角形', '直角三角形', '钝角三角形']},
      {q: '3つの辺と角が全部等しい三角形を何という?', a: '正三角形', c: ['正三角形', '二等辺三角形', '直角三角形', '钝角三角形']},
      {q: '平行四辺形の特徴は?', a: '向かい合う辺が平行', c: ['向かい合う辺が平行', '4つの角が全部90度', '4つの辺が全部等しい', '丸い']},
      {q: 'ひし形の特徴は?', a: '4つの辺が全部等しい', c: ['4つの辺が全部等しい', '向かい合う辺が平行', '4つの角が全部90度', '丸い']}
    ];
    for (const item of shapes) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 5) {
    const shapes = [
      {q: '多角形の内角の和は?', a: '(辺の数 - 2) × 180度', c: ['(辺の数 - 2) × 180度', '辺の数 × 180度', '辺の数 × 90度', '360度']},
      {q: '五角形の内角の和は?', a: '540度', c: ['540度', '360度', '720度', '180度']},
      {q: '六角形の内角の和は?', a: '720度', c: ['720度', '540度', '360度', '900度']},
      {q: '円周率はおよそ?', a: '3.14', c: ['3.14', '3.41', '2.14', '4.13']},
      {q: '直径が10cmの円の周の長さは?', a: '31.4cm', c: ['31.4cm', '314cm', '3.14cm', '62.8cm']}
    ];
    for (const item of shapes) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 6) {
    const shapes = [
      {q: '角が90度の四角形を何という?', a: '長方形', c: ['長方形', '平行四辺形', 'ひし形', '台形']},
      {q: '4つの辺が全部等しい四角形を何という?', a: 'ひし形', c: ['ひし形', '長方形', '正方形', '平行四辺形']},
      {q: '一組の向かい合う辺が平行な四角形を何という?', a: '台形', c: ['台形', '平行四辺形', 'ひし形', '長方形']},
      {q: '立方体の面は何こ?', a: '6', c: ['6', '4', '8', '12']},
      {q: '立方体の辺は何本?', a: '12', c: ['12', '6', '8', '4']},
      {q: '直方体の面は何こ?', a: '6', c: ['6', '4', '8', '12']}
    ];
    for (const item of shapes) pool.push(q(item.q, item.a, item.c));
  }
  
  // カテゴリ6: 測定（G1-6）
  if (grade === 1) {
    const measures = [
      {q: '長い方を何という?', a: '長い', c: ['長い', '短い', '高い', '低い']},
      {q: '短い方を何という?', a: '短い', c: ['短い', '長い', '高い', '低い']},
      {q: '1メートルは何センチ?', a: '100', c: ['100', '10', '1000', '50']},
      {q: '1センチは何ミリ?', a: '10', c: ['10', '100', '1000', '5']}
    ];
    for (const item of measures) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 2) {
    const measures = [
      {q: '1キログラムは何グラム?', a: '1000', c: ['1000', '100', '10', '10000']},
      {q: '1リットルは何ミリリットル?', a: '1000', c: ['1000', '100', '10', '10000']},
      {q: '1時間は何分?', a: '60', c: ['60', '30', '100', '24']},
      {q: '1分は何秒?', a: '60', c: ['60', '30', '100', '24']}
    ];
    for (const item of measures) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 3) {
    const measures = [
      {q: '1デシリットルは何リットル?', a: '0.1', c: ['0.1', '0.01', '1', '10']},
      {q: '1センチメートルは何ミリメートル?', a: '10', c: ['10', '100', '1000', '1']},
      {q: '1平方センチメートルは?', a: '1cm × 1cm', c: ['1cm × 1cm', '10cm × 10cm', '1cm × 10cm', '10cm × 1cm']},
      {q: '1平方デシメートルは?', a: '1dm × 1dm', c: ['1dm × 1dm', '10cm × 10cm', '1cm × 1cm', '10dm × 10dm']}
    ];
    for (const item of measures) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 4) {
    const measures = [
      {q: '1平方メートルは何平方センチメートル?', a: '10000', c: ['10000', '1000', '100', '100000']},
      {q: '1立方センチメートルは何ミリリットル?', a: '1', c: ['1', '10', '100', '1000']},
      {q: '1リットルは何立方デシメートル?', a: '1', c: ['1', '10', '100', '1000']},
      {q: '1キログラムは何ニュートン?', a: '9.8', c: ['9.8', '10', '1', '100']}
    ];
    for (const item of measures) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 5) {
    const measures = [
      {q: '1平方キロメートルは何ヘクタール?', a: '100', c: ['100', '1000', '10', '10000']},
      {q: '1ヘクタールは何アール?', a: '100', c: ['100', '1000', '10', '10000']},
      {q: '1アールは何平方メートル?', a: '100', c: ['100', '10', '1000', '1']},
      {q: '1キロリットルは何リットル?', a: '1000', c: ['1000', '100', '10', '10000']}
    ];
    for (const item of measures) pool.push(q(item.q, item.a, item.c));
  } else if (grade === 6) {
    const measures = [
      {q: '1立方メートルは何立方デシメートル?', a: '1000', c: ['1000', '100', '10', '10000']},
      {q: '1立方メートルは何リットル?', a: '1000', c: ['1000', '100', '10', '10000']},
      {q: '速度の単位は?', a: 'm/秒', c: ['m/秒', 'm', '秒', 'kg']},
      {q: '速さの求め方は?', a: '道のり ÷ 時間', c: ['道のり ÷ 時間', '時間 ÷ 道のり', '道のり × 時間', '時間 + 道のり']}
    ];
    for (const item of measures) pool.push(q(item.q, item.a, item.c));
  }
  
  // カテゴリ7: 変化と関係（G4-6）
  if (grade >= 4) {
    for (let i = 0; i < 10; i++) {
      const a = randInt(2, 9);
      const b = randInt(1, 9);
      pool.push(q(`y = ${a}x のとき、x = ${b} のyは?`, String(a * b)));
    }
  }
  if (grade >= 5) {
    for (let i = 0; i < 10; i++) {
      const a = randInt(2, 9);
      const b = randInt(1, 9);
      const c = randInt(1, 9);
      pool.push(q(`y = ${a}x + ${b} のとき、x = ${c} のyは?`, String(a * c + b)));
    }
  }
  if (grade === 6) {
    for (let i = 0; i < 10; i++) {
      const a = randInt(2, 5);
      const b = randInt(1, 5);
      pool.push(q(`y = ${a}x² のとき、x = ${b} のyは?`, String(a * b * b)));
    }
  }
  
  // カテゴリ8: データの活用（全学年）
  if (grade === 1 || grade === 2) {
    for (let i = 0; i < 10; i++) {
      const a = randInt(1, 10);
      const b = randInt(1, 10);
      const c = randInt(1, 10);
      pool.push(q(`${a}、${b}、${c} の平均は?`, String(Math.round((a + b + c) / 3))));
    }
  } else if (grade === 3 || grade === 4) {
    for (let i = 0; i < 10; i++) {
      const a = randInt(10, 100);
      const b = randInt(10, 100);
      const c = randInt(10, 100);
      pool.push(q(`${a}、${b}、${c} の平均は?`, String(Math.round((a + b + c) / 3))));
    }
  } else {
    for (let i = 0; i < 10; i++) {
      const a = randInt(100, 1000);
      const b = randInt(100, 1000);
      const c = randInt(100, 1000);
      pool.push(q(`${a}、${b}、${c} の平均は?`, String(Math.round((a + b + c) / 3))));
    }
  }
  
  // カテゴリ9: 文章題（全学年）
  const wordProblems = mathGetWordProblems(grade, diff);
  for (const item of wordProblems) {
    pool.push(q(item.q, item.a, item.c));
  }
  
  // 足りない分を補填
  const fillCount = Math.max(0, 100 - pool.length);
  for (let i = 0; i < fillCount; i++) {
    const a = randInt(ranges.add[0], ranges.add[1]);
    const b = randInt(ranges.sub[0], Math.min(ranges.sub[1], a));
    pool.push(q(`りんご${a}こ、みかん${b}こ。ぜんぶで?`, String(a + b)));
  }
  
  return shuffle(pool).slice(0, 110);
}

function mathGetMathRanges(grade, term, diff) {
  const l = diff === 'easy' ? 0 : diff === 'normal' ? 1 : 2;
  if (grade === 1) return { add: [1, 10], sub: [0, 10] };
  if (grade === 2) return { add: [10, 99], sub: [0, 99] };
  if (grade === 3) return l === 0 ? { add: [100, 500], sub: [0, 500] } : l === 1 ? { add: [100, 1000], sub: [0, 1000] } : { add: [1000, 9999], sub: [0, 9999] };
  if (grade === 4) return l === 0 ? { add: [1000, 9999], sub: [0, 9999] } : l === 1 ? { add: [10000, 99999], sub: [0, 99999] } : { add: [100000, 999999], sub: [0, 999999] };
  if (grade === 5) return l === 0 ? { add: [10000, 99999], sub: [0, 99999] } : l === 1 ? { add: [100000, 999999], sub: [0, 999999] } : { add: [1000000, 9999999], sub: [0, 9999999] };
  if (grade === 6) return l === 0 ? { add: [100000, 999999], sub: [0, 999999] } : l === 1 ? { add: [1000000, 9999999], sub: [0, 9999999] } : { add: [10000000, 99999999], sub: [0, 99999999] };
  return { add: [1, 10], sub: [0, 10] };
}

function mathGetWordProblems(grade, diff) {
  const problems = [];
  
  if (grade === 1) {
    problems.push(
      {q: 'りんごが3こ、みかんが2こあります。ぜんぶで何こ?', a: '5', c: ['5', '6', '7', '4']},
      {q: 'がっこうに5にんいました。2にんきました。ぜんぶで何にん?', a: '7', c: ['7', '8', '9', '6']},
      {q: '10このあめを3こもらいました。のこりは何こ?', a: '7', c: ['7', '8', '6', '9']},
      {q: '1だいのバスに6にんのりました。さらに4にんのりました。ぜんぶで何にん?', a: '10', c: ['10', '11', '12', '9']}
    );
  } else if (grade === 2) {
    problems.push(
      {q: '1せん円のノートを3さつ買いました。ぜんぶで何円?', a: '300', c: ['300', '400', '500', '200']},
      {q: '50円のジュースを2本買いました。お金は100円出しました。おつりは?', a: '0', c: ['0', '50', '100', '150']},
      {q: '1か月に30ページずつよみます。3か月で何ページ?', a: '90', c: ['90', '60', '120', '100']},
      {q: '100円のケーキを2こ、50円のジュースを1こ買いました。ぜんぶで何円?', a: '250', c: ['250', '200', '300', '150']}
    );
  } else if (grade === 3) {
    problems.push(
      {q: '1じかんに80mあるきます。30ぷんで何m?', a: '40', c: ['40', '80', '120', '160']},
      {q: '1こ120円のりんごを6こ買いました。ぜんぶで何円?', a: '720', c: ['720', '600', '840', '480']},
      {q: '840円の本を買いました。1000円出しました。おつりは?', a: '160', c: ['160', '260', '60', '360']},
      {q: '1週間に5ページずつよみます。4週間で何ページ?', a: '20', c: ['20', '25', '30', '15']}
    );
  } else if (grade === 4) {
    problems.push(
      {q: '1Lのジュースを3人で同じ数ずつわけると1人何mL?', a: '333', c: ['333', '300', '400', '250']},
      {q: '時計の長い針が1回転すると何分?', a: '60', c: ['60', '30', '12', '24']},
      {q: '1時間に60km進む車が2時間で進む距離は?', a: '120', c: ['120', '60', '180', '30']},
      {q: '500円のノートを4さつ買いました。1000円出しました。おつりは?', a: '0', c: ['0', '500', '1000', '200']}
    );
  } else if (grade === 5) {
    problems.push(
      {q: '1Lの水を0.2Lずつコップに注ぐと何杯できる?', a: '5', c: ['5', '4', '6', '3']},
      {q: '1時間に5km進むと、3時間で何km?', a: '15', c: ['15', '10', '20', '8']},
      {q: '1000円の品物が3割引のときの値段は?', a: '700', c: ['700', '300', '800', '600']},
      {q: '面積が120平方メートルの四角形で、横が10mのとき縦は?', a: '12', c: ['12', '10', '8', '15']}
    );
  } else if (grade === 6) {
    problems.push(
      {q: '速さが60km/時で2時間30分進むと何km?', a: '150', c: ['150', '120', '180', '90']},
      {q: '1000円の品物が2割引のときの値段は?', a: '800', c: ['800', '200', '600', '1000']},
      {q: '1立方メートルの水は何L?', a: '1000', c: ['1000', '100', '10', '10000']},
      {q: '半径5cmの円の面積は?', a: '78.5', c: ['78.5', '31.4', '15.7', '157']}
    );
  }
  
  return problems;
}

// グローバルスコープに公開
window.Q_MATH = Q_MATH;
window.generateMathPool = generateMathPool;
window.mathGetMathRanges = mathGetMathRanges;
window.mathGetWordProblems = mathGetWordProblems;
