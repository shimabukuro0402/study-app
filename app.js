// ===== Supabase 設定 =====
// TODO: 自分のSupabaseプロジェクトのURLとanonキーに書き換えてください
const SUPABASE_URL = "https://pzdqplvkceyqulltoorf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SCk3uMUl2uvlO3kMV9eJXQ_ALuLwOhg";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    if(typeof generateMathPool==='function')return generateMathPool(grade,term,diff); 
    return []; 
  },
  japanese: function(grade,term,diff){ 
    if(typeof generateJapanesePool==='function')return generateJapanesePool(grade,term,diff); 
    return []; 
  },
  english: function(grade,term,diff){ 
    if(typeof generateEnglishPool==='function')return generateEnglishPool(grade,term,diff); 
    return []; 
  },
  life: function(grade,term,diff){ 
    if(typeof generateLifePool==='function')return generateLifePool(grade,term,diff); 
    return []; 
  },
  science: function(grade,term,diff){ 
    if(typeof generateSciencePool==='function')return generateSciencePool(grade,term,diff); 
    return []; 
  },
  social: function(grade,term,diff){ 
    if(typeof generateSocialPool==='function')return generateSocialPool(grade,term,diff); 
    return []; 
  },
  moral: function(grade,term,diff){ 
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
let st=null; // state object (current user data)
let cu=null; // current user {id, name}
let bt={subject:"math",difficulty:"easy",playerHP:100,maxPlayerHP:100,enemyHP:200,maxEnemyHP:200,recentQ:[],curAns:"",busy:false};

function changeScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const t=document.getElementById("screen-"+id);
  if(t)t.classList.add("active");
}

// ===== Supabase データ操作 =====

// 全ユーザー一覧を取得
async function fetchUsers(){
  const {data,error}=await supabase.from("users").select("id,name,passcode,created_at").order("created_at",{ascending:true});
  if(error){console.error("fetchUsers error:",error);return[]}
  return data||[];
}

// ユーザーのプロフィールデータを取得
async function fetchProfile(userId){
  const {data,error}=await supabase.from("user_profiles").select("*").eq("user_id",userId).single();
  if(error){console.error("fetchProfile error:",error);return null}
  return data;
}

// 新規ユーザー作成
async function createUser(name,passcode,admissionDate){
  // users テーブルに挿入
  const {data:userData,error:userError}=await supabase.from("users").insert({
    name:name,passcode:passcode
  }).select().single();
  if(userError){console.error("createUser error:",userError);alert("ユーザー作成に失敗しました");return null}
  
  // user_profiles テーブルに挿入
  const {error:profileError}=await supabase.from("user_profiles").insert({
    user_id:userData.id,
    admission_date:admissionDate,
    level:1,
    score:0,
    current_difficulty:"easy",
    theme:"pokemon",
    stats_math:0,
    stats_japanese:0,
    stats_english:0,
    stats_life:0,
    stats_science:0,
    stats_social:0,
    stats_moral:0
  });
  if(profileError){console.error("createProfile error:",profileError);alert("プロフィール作成に失敗しました");return null}
  
  return userData;
}

// プロフィールを更新
async function updateProfile(){
  if(!cu||!st)return;
  const {error}=await supabase.from("user_profiles").update({
    level:st.level,
    score:st.score,
    current_difficulty:st.currentDifficulty,
    theme:st.theme,
    admission_date:st.admissionDate,
    stats_math:st.stats.math||0,
    stats_japanese:st.stats.japanese||0,
    stats_english:st.stats.english||0,
    stats_life:st.stats.life||0,
    stats_science:st.stats.science||0,
    stats_social:st.stats.social||0,
    stats_moral:st.stats.moral||0
  }).eq("user_id",cu.id);
  if(error)console.error("updateProfile error:",error);
}

// パスコードを更新
async function updatePasscodeInDb(userId,newPasscode){
  const {error}=await supabase.from("users").update({passcode:newPasscode}).eq("id",userId);
  if(error){console.error("updatePasscode error:",error);return false}
  return true;
}

// admission_date を更新
async function updateAdmissionDateInDb(userId,newDate){
  const {error}=await supabase.from("user_profiles").update({admission_date:newDate}).eq("user_id",userId);
  if(error){console.error("updateAdmissionDate error:",error);return false}
  return true;
}

// ユーザー削除
async function deleteUser(userId){
  // user_profiles は ON DELETE CASCADE なので users 削除で自動削除
  const {error}=await supabase.from("users").delete().eq("id",userId);
  if(error){console.error("deleteUser error:",error);return false}
  return true;
}

// 全ユーザー削除（リセット）
async function resetAllUsers(){
  const {error}=await supabase.from("user_profiles").delete().neq("user_id","00000000-0000-0000-0000-000000000000");
  if(error){console.error("reset profiles error:",error);return false}
  const {error:err2}=await supabase.from("users").delete().neq("id","00000000-0000-0000-0000-000000000000");
  if(err2){console.error("reset users error:",err2);return false}
  return true;
}

// ===== 画面ロジック =====

// ユーザー選択画面を表示
async function showUserSelect(){
  const users=await fetchUsers();
  const container=document.getElementById("user-list-container");
  container.innerHTML="";
  
  if(users.length===0){
    container.innerHTML='<p style="color:#aaa;text-align:center;padding:20px;">ユーザーがいません。新しく作成してください。</p>';
  }else{
    users.forEach(u=>{
      const div=document.createElement("div");
      div.className="user-card";
      const dateStr=u.created_at?new Date(u.created_at).toLocaleDateString("ja-JP"):"";
      div.innerHTML='<div class="user-card-name">'+escapeHtml(u.name)+'</div><div class="user-card-date">作成日: '+dateStr+'</div>';
      div.onclick=function(){selectUser(u)};
      container.appendChild(div);
    });
  }
  changeScreen("user-select");
}

function escapeHtml(str){
  const d=document.createElement("div");
  d.textContent=str;
  return d.innerHTML;
}

// ユーザー選択時の処理
async function selectUser(user){
  cu=user;
  const profile=await fetchProfile(user.id);
  if(!profile){
    alert("ユーザーデータの読み込みに失敗しました");
    return;
  }
  st={
    userId:user.id,
    admissionDate:profile.admission_date,
    passcode:user.passcode,
    level:profile.level,
    score:profile.score,
    stats:{
      math:profile.stats_math||0,
      japanese:profile.stats_japanese||0,
      english:profile.stats_english||0,
      life:profile.stats_life||0,
      science:profile.stats_science||0,
      social:profile.stats_social||0,
      moral:profile.stats_moral||0
    },
    currentDifficulty:profile.current_difficulty||"easy",
    theme:profile.theme||"pokemon"
  };
  changeScreen("menu");
  updateMenuInfo();
  applyTheme();
  // selected user name display
  document.getElementById("menu-user-name").textContent=user.name;
}

// ユーザー作成画面を表示
function showCreateUser(){
  document.getElementById("create-user-name").value="";
  document.getElementById("create-user-passcode").value="";
  document.getElementById("create-user-date").value="2026-04-01";
  changeScreen("create-user");
}

// ユーザー作成実行
async function createUserFromForm(){
  const name=document.getElementById("create-user-name").value.trim();
  const passcode=document.getElementById("create-user-passcode").value.trim();
  const admissionDate=document.getElementById("create-user-date").value;
  
  if(!name){alert("ユーザー名を入力してください");return}
  if(passcode.length!==4||!/^\d{4}$/.test(passcode)){alert("パスコードは数字4桁で入力してください");return}
  if(!admissionDate){alert("入学年月日を選択してください");return}
  
  const user=await createUser(name,passcode,admissionDate);
  if(user){
    await selectUser(user);
  }
}

// メニュー画面の更新
function updateMenuInfo(){
  if(!st)return;
  const c=judgeCurriculum();
  document.getElementById("menu-grade-info").textContent=" "+c.label;
  document.getElementById("menu-level-info").innerHTML="".repeat(Math.min(st.level,10))+" レベル "+st.level;
  buildSubjectButtons();
}

function judgeCurriculum(){
  const n=new Date();
  const p=st.admissionDate.split("-");
  const a=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));
  let d=(n.getFullYear()-a.getFullYear())*12+(n.getMonth()-a.getMonth());
  let g=Math.floor(d/12)+1;
  const m=n.getMonth()+1;
  if(m>=1&&m<=3){const x=d+12;g=Math.floor(x/12);if(g<1)g=1}
  if(g<1)g=1;if(g>6)g=6;
  let t=1;
  if(m>=4&&m<=7)t=1;
  else if(m>=8&&m<=12)t=2;
  else t=3;
  return{grade:g,term:t,label:{1:"小学1年生",2:"小学2年生",3:"小学3年生",4:"小学4年生",5:"小学5年生",6:"小学6年生"}[g]+" "+{1:"1学期",2:"2学期",3:"3学期"}[t]};
}

function buildSubjectButtons(){
  const c=judgeCurriculum();
  const g=c.grade;
  const ct=document.getElementById("menu-subjects-container");
  ct.innerHTML="";
  Object.keys(SUBJECT_DEFS).forEach(k=>{
    const d=SUBJECT_DEFS[k];
    if(d.grades.includes(g)){
      const b=document.createElement("button");
      b.className="subject-btn "+d.color;
      b.innerHTML=d.emoji+" "+d.label;
      b.onclick=function(){startBattle(k)};
      ct.appendChild(b);
    }
  });
}

function selectDifficulty(d){
  st.currentDifficulty=d;
  updateProfile();
  getPool.cache={};
  document.querySelectorAll(".difficulty-btn").forEach(b=>b.classList.toggle("active",b.dataset.diff===d));
}

function selectTheme(t){
  st.theme=t;
  updateProfile();
  applyTheme();
  document.querySelectorAll(".theme-btn").forEach(b=>b.classList.toggle("active",b.dataset.theme===t));
}

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

function applyTheme(){
  if(!st)return;
  const t=st.theme;
  const th=THEMES[t]||THEMES.pokemon;
  document.body.style.backgroundImage=th.bg;
  document.body.className=th.bodyClass;
  const imgs=document.querySelectorAll(".char-img");
  imgs.forEach(function(img){img.style.display="block"});
  setRandomChar("player-img",t);
  setRandomChar("enemy-img",t);
  document.querySelectorAll(".theme-btn").forEach(b=>b.classList.toggle("active",b.dataset.theme===t));
  BGM.play(t);
}

function setRandomChar(imgId,theme){
  var img=document.getElementById(imgId);
  if(!img)return;
  var prefix=theme==="bluelock"?"image/ブルーロック_キャラクター":"image/ポケモン_キャラクター";
  var num=randInt(1,12);
  img.src=prefix+num+".png?"+Date.now();
  img.style.display="block";
  img.onerror=function(){img.style.display="none"};
}

// ===== 保護者モード =====
let parentPin="";
function parentShowGate(){
  parentPin="";
  updateParentPinDisplay();
  document.getElementById("parent-pin-error").textContent="";
  changeScreen("parent-gate");
}

function parentPinInput(d){
  if(parentPin.length>=4)return;
  parentPin+=d;
  updateParentPinDisplay();
  if(parentPin.length===4)parentCheckPin();
}

function parentPinDelete(){
  if(parentPin.length>0){parentPin=parentPin.slice(0,-1);updateParentPinDisplay()}
}

function parentPinClear(){
  parentPin="";
  updateParentPinDisplay();
  document.getElementById("parent-pin-error").textContent="";
}

function updateParentPinDisplay(){
  for(let i=0;i<4;i++){
    const e=document.getElementById("parent-pin-"+i);
    if(i<parentPin.length){e.textContent="*";e.classList.add("filled")}else{e.textContent="";e.classList.remove("filled")}
  }
}

async function parentCheckPin(){
  // ユーザーのパスコードと一致するかチェック（全ユーザー対象）
  const users=await fetchUsers();
  const matched=users.find(u=>u.passcode===parentPin);
  if(matched){
    parentPin="";
    updateParentPinDisplay();
    document.getElementById("parent-pin-error").textContent="";
    await showParentScreen();
  }else{
    document.getElementById("parent-pin-error").textContent=" パスコードがちがいます";
    setTimeout(function(){parentPin="";updateParentPinDisplay()},500);
  }
}

async function showParentScreen(){
  const users=await fetchUsers();
  const container=document.getElementById("parent-users-container");
  container.innerHTML="";
  
  if(users.length===0){
    container.innerHTML='<p style="color:#aaa;text-align:center;">ユーザーがいません。</p>';
  }else{
    users.forEach(u=>{
      const div=document.createElement("div");
      div.className="parent-user-card";
      
      // 各ユーザーのstatsを取得するためにプロフィールを取得
      supabase.from("user_profiles").select("*").eq("user_id",u.id).single().then(function(profile){
        if(profile.data){
          const p=profile.data;
          const statsHtml=Object.keys(SUBJECT_DEFS).map(function(k){
            const stKey="stats_"+k;
            return '<span class="parent-user-stat">'+SUBJECT_DEFS[k].label+':'+(p[stKey]||0)+'</span>';
          }).join(" ");
          div.innerHTML=`
            <div class="parent-user-header">
              <span class="parent-user-name">${escapeHtml(u.name)}</span>
              <span class="parent-user-pass">パスコード: ${u.passcode}</span>
            </div>
            <div class="parent-user-stats">${statsHtml}</div>
            <div class="parent-user-detail">
              スコア: ${p.score} | レベル: ${p.level} | 入学: ${p.admission_date} | テーマ: ${p.theme}
            </div>
            <div class="parent-user-actions">
              <button class="btn btn-small btn-primary" onclick="parentEditUser('${u.id}')">編集</button>
              <button class="btn btn-small btn-danger" onclick="parentDeleteUser('${u.id}','${escapeHtml(u.name)}')">削除</button>
            </div>
          `;
        }
      });
      container.appendChild(div);
    });
  }
  changeScreen("parent-screen");
}

async function parentDeleteUser(userId,userName){
  if(!confirm("ユーザー「"+userName+"」を削除します。よろしいですか？"))return;
  const ok=await deleteUser(userId);
  if(ok){
    await showParentScreen();
  }else{
    alert("削除に失敗しました");
  }
}

let parentEditingUserId=null;
async function parentEditUser(userId){
  parentEditingUserId=userId;
  const profile=await fetchProfile(userId);
  if(!profile){alert("データ取得エラー");return}
  
  document.getElementById("parent-edit-name").value="";
  document.getElementById("parent-edit-passcode").value="";
  document.getElementById("parent-edit-date").value=profile.admission_date;
  document.getElementById("parent-edit-score").value=profile.score;
  document.getElementById("parent-edit-level").value=profile.level;
  // ユーザー名・パスコード取得
  const {data:userData}=await supabase.from("users").select("name,passcode").eq("id",userId).single();
  if(userData){
    document.getElementById("parent-edit-name").value=userData.name;
    document.getElementById("parent-edit-passcode").value=userData.passcode;
  }
  changeScreen("parent-edit");
}

async function parentSaveEdit(){
  const userId=parentEditingUserId;
  const name=document.getElementById("parent-edit-name").value.trim();
  const passcode=document.getElementById("parent-edit-passcode").value.trim();
  const date=document.getElementById("parent-edit-date").value;
  const score=parseInt(document.getElementById("parent-edit-score").value)||0;
  const level=parseInt(document.getElementById("parent-edit-level").value)||1;
  
  if(!name){alert("ユーザー名を入力してください");return}
  if(passcode.length!==4||!/^\d{4}$/.test(passcode)){alert("パスコードは数字4桁です");return}
  if(!date){alert("日付を選択してください");return}
  if(level<1)level=1;
  if(score<0)score=0;
  
  // ユーザー名更新
  const {error:nameErr}=await supabase.from("users").update({name:name,passcode:passcode}).eq("id",userId);
  if(nameErr){alert("ユーザー情報の更新に失敗しました");return}
  
  // プロフィール更新
  const {error:profErr}=await supabase.from("user_profiles").update({
    admission_date:date,
    score:score,
    level:level
  }).eq("user_id",userId);
  if(profErr){alert("プロフィールの更新に失敗しました");return}
  
  // 現在選択中のユーザーならstも更新
  if(cu&&cu.id===userId){
    st.admissionDate=date;
    st.score=score;
    st.level=level;
    st.passcode=passcode;
    cu.name=name;
    document.getElementById("menu-user-name").textContent=name;
  }
  
  alert("保存しました");
  await showParentScreen();
}

function parentCancelEdit(){
  changeScreen("parent-screen");
}

// ===== バトル関連 =====

function startBattle(subject){
  const labels={math:"さんすう",japanese:"こくご",english:"えいご",life:"せいかつ",science:"りか",social:"しゃかい",moral:"どうとく"};
  bt={subject:subject,difficulty:st.currentDifficulty,playerHP:100,maxPlayerHP:100,enemyHP:200,maxEnemyHP:200,recentQ:[],curAns:"",busy:false};
  document.getElementById("battle-subject-label").textContent=" "+labels[subject];
  updateBattleHP();
  changeScreen("battle");
  nextQuestion();
  applyTheme();
}

function nextQuestion(){
  const c=judgeCurriculum();
  let g=c.grade,t=c.term;
  const pool=getPool(g,t,bt.subject,bt.difficulty);
  if(!pool||pool.length===0){
    document.getElementById("battle-question-text").textContent="もんだいがありません...";
    return;
  }
  let f=pool.filter(function(q){return bt.recentQ.indexOf(q.q)===-1});
  if(f.length===0){bt.recentQ=[];f=pool}
  const idx=Math.floor(Math.random()*f.length);
  const q=f[idx];
  bt.recentQ.push(q.q);
  if(bt.recentQ.length>5)bt.recentQ.shift();
  const sh=shuffle([...q.c]);
  bt.curAns=q.a;
  document.getElementById("battle-question-text").textContent=q.q;
  const bts=document.querySelectorAll(".choice-btn");
  bts.forEach(function(b,i){
    if(i<sh.length){
      b.textContent=sh[i];
      b.disabled=false;
      b.className="choice-btn";
      b.dataset.choiceValue=sh[i];
    }
  });
  bt.busy=false;
}

function selectAnswer(ci){
  if(bt.busy)return;
  bt.busy=true;
  const bts=document.querySelectorAll(".choice-btn");
  const cb=bts[ci];
  if(!cb){bt.busy=false;return}
  const cv=cb.dataset.choiceValue;
  const ok=cv===bt.curAns;
  bts.forEach(function(b){b.disabled=true});
  if(ok){
    bts.forEach(function(b){if(b.dataset.choiceValue===bt.curAns)b.classList.add("correct")});
    bt.enemyHP=Math.max(0,bt.enemyHP-25);
    updateBattleHP();
    var eu=document.getElementById("enemy-unit");
    eu.classList.remove("damage-flash");
    void eu.offsetWidth;
    eu.classList.add("damage-flash");
    st.stats[bt.subject]=(st.stats[bt.subject]||0)+1;
    updateProfile();
  }else{
    cb.classList.add("wrong");
    bts.forEach(function(b){if(b.dataset.choiceValue===bt.curAns)b.classList.add("correct")});
    var dmg=bt.difficulty==="easy"?3:(bt.difficulty==="normal"?12:25);
    bt.playerHP=Math.max(0,bt.playerHP-dmg);
    updateBattleHP();
    var pu=document.getElementById("player-unit");
    pu.classList.remove("damage-flash");
    void pu.offsetWidth;
    pu.classList.add("damage-flash");
  }
  if(bt.enemyHP<=0){setTimeout(function(){showBattleResult("win")},600);return}
  if(bt.playerHP<=0){setTimeout(function(){showBattleResult("lose")},600);return}
  setTimeout(function(){nextQuestion()},800);
}

function updateBattleHP(){
  const pp=Math.max(0,(bt.playerHP/bt.maxPlayerHP)*100);
  const ep=Math.max(0,(bt.enemyHP/bt.maxEnemyHP)*100);
  document.getElementById("player-hp-bar").style.width=pp+"%";
  document.getElementById("enemy-hp-bar").style.width=ep+"%";
  document.getElementById("player-hp-text").textContent="HP: "+bt.playerHP;
  document.getElementById("enemy-hp-text").textContent="HP: "+bt.enemyHP;
}

function showBattleResult(type){
  var o=document.getElementById("battle-result-overlay");
  var e=document.getElementById("result-emoji");
  var t=document.getElementById("result-text");
  var s=document.getElementById("result-sub-text");
  if(type==="win"){
    e.textContent="";
    t.textContent=" しょうり！おめでとう！";
    st.score=(st.score||0)+10;
    var old=st.level;
    var nl=Math.floor(st.score/100)+1;
    if(nl>old){st.level=nl;s.textContent=" レベルアップ！ レベル "+old+" "+nl+" "}
    else{s.textContent="スコア+10（あと"+(100-(st.score%100||100))+"でレベルアップ！）"}
    updateProfile();
  }else{
    e.textContent="";
    t.textContent=" まけちゃった... がんばろう！";
    s.textContent="つぎはきっとかてるよ！";
  }
  o.classList.add("show");
}

function backToMenu(){
  document.getElementById("battle-result-overlay").classList.remove("show");
  changeScreen("menu");
  updateMenuInfo();
}

function logoutUser(){
  cu=null;
  st=null;
  BGM.stop();
  showUserSelect();
}

// ===== 初期化 =====
window.onload=async function(){
  try{
    // Supabase が正しく読み込まれているか確認
    if(typeof window.supabase==="undefined"||!window.supabase){
      throw new Error("Supabaseクライアントライブラリが読み込まれていません");
    }
    if(!SUPABASE_URL||!SUPABASE_ANON_KEY||SUPABASE_URL.indexOf("your-project-id")>=0||SUPABASE_ANON_KEY.indexOf("your-anon-key")>=0){
      throw new Error("SUPABASE_URL または SUPABASE_ANON_KEY が設定されていません");
    }
    // 接続テスト（usersテーブルにアクセスできるか確認）
    const {error:testErr}=await supabase.from("users").select("count",{count:"exact",head:true});
    if(testErr){
      console.error("Supabase接続テスト失敗:",testErr);
      throw new Error("Supabaseに接続できません: "+testErr.message);
    }
    await showUserSelect();
  }catch(e){
    console.error("初期化エラー:",e);
    document.body.innerHTML='<div style="padding:40px;text-align:center;font-size:18px;color:#fff;background:#1a1a2e;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;">'+
      '<h1 style="color:#e94560;margin-bottom:16px;">⚠️ エラー</h1>'+
      '<p style="color:#aaa;margin-bottom:12px;">'+escapeHtml(e.message)+'</p>'+
      '<p style="color:#888;font-size:14px;margin-bottom:20px;">app.js の Supabase設定を確認するか、画面をリロードしてください。</p>'+
      '<button class="btn btn-primary" onclick="location.reload()" style="min-width:160px;">リロード</button>'+
      '</div>';
  }
};
