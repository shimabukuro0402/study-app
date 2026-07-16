// ===== テーマ定義 =====
const THEMES={pokemon:{name:"ポケモン",bg:"url('image/ポケモン_背景.png')",bodyClass:"theme-pokemon"},bluelock:{name:"ブルーロック",bg:"url('image/ブルーロック_背景.png')",bodyClass:"theme-bluelock"}};
const SUBJECT_DEFS={math:{label:"さんすう",labelKanji:"算数",emoji:"",color:"subject-math",grades:[1,2,3,4,5,6]},japanese:{label:"こくご",labelKanji:"国語",emoji:"",color:"subject-japanese",grades:[1,2,3,4,5,6]},english:{label:"えいご",labelKanji:"英語",emoji:"",color:"subject-english",grades:[1,2,3,4,5,6]},life:{label:"せいかつ",labelKanji:"生活",emoji:"",color:"subject-life",grades:[1,2]},science:{label:"りか",labelKanji:"理科",emoji:"",color:"subject-science",grades:[3,4,5,6]},social:{label:"しゃかい",labelKanji:"社会",emoji:"",color:"subject-social",grades:[3,4,5,6]},moral:{label:"どうとく",labelKanji:"道徳",emoji:"",color:"subject-math",grades:[1,2,3,4,5,6]}};

// 基本関数
function q(text,ans,opts){return {q:text,a:ans,c:opts||makeChoices(ans,genWrongs(ans,3,5).map(x=>String(x)))}}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function makeChoices(correct,wrongs){return shuffle([correct,...wrongs])}
function genWrongs(ans,cnt,range){const ws=[];while(ws.length<cnt){const w=ans+randInt(-range,range);if(w!==ans&&w>0&&!ws.includes(w))ws.push(w)}return ws}
function pick(arr){return arr[randInt(0,arr.length-1)]}

// ===== 教科別問題ジェネレーター（各JSファイルへの委譲） =====
const SUBJECT_GENERATORS = {
  math: function(grade,term,diff){ 
    console.log('Math generator called, generateMathPool:', typeof generateMathPool); 
    if(typeof generateMathPool==='function')return generateMathPool(grade,term,diff); 
    return []; 
  },
  japanese: function(grade,term,diff){ 
    console.log('Japanese generator called, generateJapanesePool:', typeof generateJapanesePool); 
    if(typeof generateJapanesePool==='function')return generateJapanesePool(grade,term,diff); 
    return []; 
  },
  english: function(grade,term,diff){ 
    console.log('English generator called, generateEnglishPool:', typeof generateEnglishPool); 
    if(typeof generateEnglishPool==='function')return generateEnglishPool(grade,term,diff); 
    return []; 
  },
  life: function(grade,term,diff){ 
    console.log('Life generator called, generateLifePool:', typeof generateLifePool); 
    if(typeof generateLifePool==='function')return generateLifePool(grade,term,diff); 
    return []; 
  },
  science: function(grade,term,diff){ 
    console.log('Science generator called, generateSciencePool:', typeof generateSciencePool); 
    if(typeof generateSciencePool==='function')return generateSciencePool(grade,term,diff); 
    return []; 
  },
  social: function(grade,term,diff){ 
    console.log('Social generator called, generateSocialPool:', typeof generateSocialPool); 
    if(typeof generateSocialPool==='function')return generateSocialPool(grade,term,diff); 
    return []; 
  },
  moral: function(grade,term,diff){ 
    console.log('Moral generator called, generateMoralPool:', typeof generateMoralPool); 
    if(typeof generateMoralPool==='function')return generateMoralPool(grade,term,diff); 
    return []; 
  }
};

function getPool(grade,term,subject,diff){
  const gen=SUBJECT_GENERATORS[subject];
  if(!gen)return[];
  const key=grade+'-'+term+'-'+subject+'-'+diff;
  if(getPool.cache&&getPool.cache[key])return getPool.cache[key];
  if(!getPool.cache)getPool.cache={};
  const pool=gen(grade,term,diff);
  getPool.cache[key]=pool;
  return pool;
}

// ===== アプリ状態管理 =====
let st=null;
let bt={subject:"math",difficulty:"easy",playerHP:100,maxPlayerHP:100,enemyHP:200,maxEnemyHP:200,recentQ:[],curAns:"",busy:false};

function loadData(){try{const r=localStorage.getItem("learning_quest_data");if(r){const p=JSON.parse(r);if(p&&p.admissionDate&&p.passcode){st=p;if(!st.stats)st.stats={math:0,japanese:0,english:0,life:0,science:0,social:0,moral:0};if(!st.level)st.level=1;if(!st.score)st.score=0;if(!st.currentDifficulty)st.currentDifficulty="easy";if(!st.theme||st.theme==="default")st.theme="pokemon";return true}}}catch(e){}return false}
function saveData(){localStorage.setItem("learning_quest_data",JSON.stringify(st))}
function changeScreen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));const t=document.getElementById("screen-"+id);if(t)t.classList.add("active")}
function judgeCurriculum(){const n=new Date();const p=st.admissionDate.split("-");const a=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));let d=(n.getFullYear()-a.getFullYear())*12+(n.getMonth()-a.getMonth());let g=Math.floor(d/12)+1;const m=n.getMonth()+1;if(m>=1&&m<=3){const x=d+12;g=Math.floor(x/12);if(g<1)g=1}if(g<1)g=1;if(g>6)g=6;let t=1;if(m>=4&&m<=7)t=1;else if(m>=8&&m<=12)t=2;else t=3;return{grade:g,term:t,label:{1:"小学1年生",2:"小学2年生",3:"小学3年生",4:"小学4年生",5:"小学5年生",6:"小学6年生"}[g]+" "+{1:"1学期",2:"2学期",3:"3学期"}[t]}}
function buildSubjectButtons(){const c=judgeCurriculum();const g=c.grade;const ct=document.getElementById("menu-subjects-container");ct.innerHTML="";Object.keys(SUBJECT_DEFS).forEach(k=>{const d=SUBJECT_DEFS[k];if(d.grades.includes(g)){const b=document.createElement("button");b.className="subject-btn "+d.color;b.innerHTML=d.emoji+" "+d.label;b.onclick=function(){startBattle(k)};ct.appendChild(b)}})}
function saveSetup(){const dv=document.getElementById("setup-date").value;const pv=document.getElementById("setup-passcode").value.trim();if(!dv){alert("入学年月日をえらんでね！");return}if(pv.length!==4||!/^\d{4}$/.test(pv)){alert("パスコードはすうじ4桁でにゅうりょくしてね！");return}st={admissionDate:dv,passcode:pv,level:1,score:0,stats:{math:0,japanese:0,english:0,life:0,science:0,social:0,moral:0},currentDifficulty:"easy",theme:"pokemon"};saveData();changeScreen("menu");updateMenuInfo();applyTheme()}
function updateMenuInfo(){const c=judgeCurriculum();document.getElementById("menu-grade-info").textContent=" "+c.label;document.getElementById("menu-level-info").innerHTML="".repeat(Math.min(st.level,10))+" レベル "+st.level;buildSubjectButtons()}
function selectDifficulty(d){st.currentDifficulty=d;saveData();getPool.cache={};document.querySelectorAll(".difficulty-btn").forEach(b=>b.classList.toggle("active",b.dataset.diff===d))}
function selectTheme(t){st.theme=t;saveData();applyTheme();document.querySelectorAll(".theme-btn").forEach(b=>b.classList.toggle("active",b.dataset.theme===t))}
const BGM = {
  audio: null,
  themeBgmMap: {
    pokemon: "bgm/ポケモン.wav",
    bluelock: "bgm/ブルーロック.mp3"
  },
  play(theme){
    this.stop();
    const src=this.themeBgmMap[theme];
    if(!src)return;
    this.audio=new Audio(src);
    this.audio.loop=true;
    this.audio.volume=0.5;
    this.audio.play().catch(function(e){console.log("BGM play failed:",e)});
  },
  stop(){
    if(this.audio){this.audio.pause();this.audio.currentTime=0;this.audio=null}
  }
};
function applyTheme(){const t=st?st.theme:"pokemon";const th=THEMES[t]||THEMES.pokemon;document.body.style.backgroundImage=th.bg;document.body.className=th.bodyClass;const imgs=document.querySelectorAll(".char-img");if(t==="pokemon"||t==="bluelock"){imgs.forEach(function(img){img.style.display="block"});setRandomChar("player-img",t);setRandomChar("enemy-img",t)}else{imgs.forEach(function(img){img.style.display="none"})}document.querySelectorAll(".theme-btn").forEach(b=>b.classList.toggle("active",b.dataset.theme===t));BGM.play(t)}
function setRandomChar(imgId,theme){var img=document.getElementById(imgId);if(!img)return;var prefix=theme==="bluelock"?"image/ブルーロック_キャラクター":"image/ポケモン_キャラクター";var num=randInt(1,12);img.src=prefix+num+".png?"+Date.now();img.style.display="block";img.onerror=function(){img.style.display="none"}}
let pin="";
function pinInput(d){if(pin.length>=4)return;pin+=d;updatePinDisplay();if(pin.length===4)checkPin()}
function pinDelete(){if(pin.length>0){pin=pin.slice(0,-1);updatePinDisplay()}}
function pinClear(){pin="";updatePinDisplay();document.getElementById("pin-error").textContent=""}
function updatePinDisplay(){for(let i=0;i<4;i++){const e=document.getElementById("pin-"+i);if(i<pin.length){e.textContent="*";e.classList.add("filled")}else{e.textContent="";e.classList.remove("filled")}}}
function checkPin(){if(pin===st.passcode){pin="";updatePinDisplay();document.getElementById("pin-error").textContent="";changeScreen("parent");updateParentScreen()}else{document.getElementById("pin-error").textContent=" パスコードがちがいます";setTimeout(function(){pin="";updatePinDisplay()},500)}}
function updateParentScreen(){const h=Object.keys(SUBJECT_DEFS).map(function(k){var d=SUBJECT_DEFS[k];var v=st.stats[k]||0;return '<div class="stat-row"><span class="stat-label">'+d.emoji+' '+d.labelKanji+'</span><span class="stat-value">'+v+'</span></div>'}).join("");document.getElementById("parent-stats-container").innerHTML=h;document.getElementById("stat-score").textContent=st.score;document.getElementById("stat-level").textContent=st.level;document.getElementById("parent-admission-date").value=st.admissionDate;document.getElementById("parent-new-passcode").value=""}
function updateAdmissionDate(){const v=document.getElementById("parent-admission-date").value;if(!v){alert("日付をえらんでね");return}st.admissionDate=v;saveData();alert("入学年月日をこうしんしました！");updateMenuInfo()}
function updatePasscode(){const v=document.getElementById("parent-new-passcode").value.trim();if(v.length!==4||!/^\d{4}$/.test(v)){alert("パスコードはすうじ4桁でにゅうりょくしてね！");return}st.passcode=v;saveData();document.getElementById("parent-new-passcode").value="";alert("パスコードをこうしんしました！")}
function resetAllData(){if(!confirm("すべてのデータをリセットします。よろしいですか？"))return;if(!confirm("ほんとうにけしてもいいですか？"))return;localStorage.removeItem("learning_quest_data");st=null;changeScreen("setup")}
function startBattle(subject){const labels={math:"さんすう",japanese:"こくご",english:"えいご",life:"せいかつ",science:"りか",social:"しゃかい",moral:"どうとく"};bt={subject:subject,difficulty:st.currentDifficulty,playerHP:100,maxPlayerHP:100,enemyHP:200,maxEnemyHP:200,recentQ:[],curAns:"",busy:false};document.getElementById("battle-subject-label").textContent=" "+labels[subject];updateBattleHP();changeScreen("battle");nextQuestion();applyTheme()}
function nextQuestion(){const c=judgeCurriculum();let g=c.grade,t=c.term;const pool=getPool(g,t,bt.subject,bt.difficulty);if(!pool||pool.length===0){document.getElementById("battle-question-text").textContent="もんだいがありません...";return}let f=pool.filter(function(q){return bt.recentQ.indexOf(q.q)===-1});if(f.length===0){bt.recentQ=[];f=pool}const idx=Math.floor(Math.random()*f.length);const q=f[idx];bt.recentQ.push(q.q);if(bt.recentQ.length>5)bt.recentQ.shift();const sh=shuffle([...q.c]);bt.curAns=q.a;document.getElementById("battle-question-text").textContent=q.q;const bts=document.querySelectorAll(".choice-btn");bts.forEach(function(b,i){if(i<sh.length){b.textContent=sh[i];b.disabled=false;b.className="choice-btn";b.dataset.choiceValue=sh[i]}});bt.busy=false}
function selectAnswer(ci){if(bt.busy)return;bt.busy=true;const bts=document.querySelectorAll(".choice-btn");const cb=bts[ci];if(!cb){bt.busy=false;return}const cv=cb.dataset.choiceValue;const ok=cv===bt.curAns;bts.forEach(function(b){b.disabled=true});if(ok){bts.forEach(function(b){if(b.dataset.choiceValue===bt.curAns)b.classList.add("correct")});bt.enemyHP=Math.max(0,bt.enemyHP-25);updateBattleHP();var eu=document.getElementById("enemy-unit");eu.classList.remove("damage-flash");void eu.offsetWidth;eu.classList.add("damage-flash");st.stats[bt.subject]=(st.stats[bt.subject]||0)+1;saveData()}else{cb.classList.add("wrong");bts.forEach(function(b){if(b.dataset.choiceValue===bt.curAns)b.classList.add("correct")});var dmg=bt.difficulty==="easy"?3:(bt.difficulty==="normal"?12:25);bt.playerHP=Math.max(0,bt.playerHP-dmg);updateBattleHP();var pu=document.getElementById("player-unit");pu.classList.remove("damage-flash");void pu.offsetWidth;pu.classList.add("damage-flash")}if(bt.enemyHP<=0){setTimeout(function(){showBattleResult("win")},600);return}if(bt.playerHP<=0){setTimeout(function(){showBattleResult("lose")},600);return}setTimeout(function(){nextQuestion()},800)}
function updateBattleHP(){const pp=Math.max(0,(bt.playerHP/bt.maxPlayerHP)*100);const ep=Math.max(0,(bt.enemyHP/bt.maxEnemyHP)*100);document.getElementById("player-hp-bar").style.width=pp+"%";document.getElementById("enemy-hp-bar").style.width=ep+"%";document.getElementById("player-hp-text").textContent="HP: "+bt.playerHP;document.getElementById("enemy-hp-text").textContent="HP: "+bt.enemyHP}
function showBattleResult(type){var o=document.getElementById("battle-result-overlay");var e=document.getElementById("result-emoji");var t=document.getElementById("result-text");var s=document.getElementById("result-sub-text");if(type==="win"){e.textContent="";t.textContent=" しょうり！おめでとう！";st.score=(st.score||0)+10;var old=st.level;var nl=Math.floor(st.score/100)+1;if(nl>old){st.level=nl;s.textContent=" レベルアップ！ レベル "+old+" "+nl+" "}else{s.textContent="スコア+10（あと"+(100-(st.score%100||100))+"でレベルアップ！）"}saveData()}else{e.textContent="";t.textContent=" まけちゃった... がんばろう！";s.textContent="つぎはきっとかてるよ！"}o.classList.add("show")}
function backToMenu(){document.getElementById("battle-result-overlay").classList.remove("show");changeScreen("menu");updateMenuInfo()}
window.onload=function(){if(loadData()){document.querySelectorAll(".difficulty-btn").forEach(function(b){return b.classList.toggle("active",b.dataset.diff===st.currentDifficulty)});document.querySelectorAll(".theme-btn").forEach(function(b){return b.classList.toggle("active",b.dataset.theme===st.theme)});changeScreen("menu");updateMenuInfo();applyTheme()}else{changeScreen("setup")}};
