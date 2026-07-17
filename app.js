// ===== Supabase 設定 =====
const SUPABASE_URL = "https://pzdqplvkceyqulltoorf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SCk3uMUl2uvlO3kMV9eJXQ_ALuLwOhg";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// HTMLエスケープ関数
function escapeHtml(str){
  const d=document.createElement("div");
  d.textContent=str;
  return d.innerHTML;
}

// SHA-256 ハッシュ関数
async function sha256(str){
  const buf=new TextEncoder().encode(str);
  const hash=await crypto.subtle.digest("SHA-256",buf);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

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
let st=null; // state object (current user data - child only)
let cu=null; // current child user {id, name}
let authUser=null; // authenticated user (admin/parent) {id, role, email}
let bt={subject:"math",difficulty:"easy",playerHP:100,maxPlayerHP:100,enemyHP:200,maxEnemyHP:200,recentQ:[],curAns:"",busy:false};

function changeScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const t=document.getElementById("screen-"+id);
  if(t)t.classList.add("active");
}

// ===== Supabase Auth 操作 =====

// Google OAuth ログイン
async function loginWithGoogle(){
  try{
    // 末尾にスラッシュを確保
    let redirectUrl=window.location.origin;
    if(!redirectUrl.endsWith("/")){
      redirectUrl+="/";
    }
    // パスが含まれている場合はindex.htmlを追加
    if(window.location.pathname && window.location.pathname!=="/"){
      redirectUrl+="index.html";
    }
    
    console.log("Google OAuth redirect URL:",redirectUrl);
    const {data,error}=await sb.auth.signInWithOAuth({
      provider:"google",
      options:{redirectTo:redirectUrl}
    });
    if(error)throw error;
  }catch(e){
    console.error("Google login error:",e);
    alert("Googleログインに失敗しました: "+e.message+"\n\nSupabaseダッシュボードでリダイレクトURLが正しく設定されているか確認してください。");
  }
}

// OAuthコールバック処理
async function handleAuthCallback(){
  const {data:{session},error}=await sb.auth.getSession();
  if(error){console.error("getSession error:",error);return false}
  if(!session)return false;
  
  const authId=session.user.id;
  const email=session.user.email;
  
  // usersテーブルからauth_uidで検索
  let {data:users}=await sb.from("users").select("*").eq("auth_uid",authId);
  
  if(!users||users.length===0){
    // auth_uidで見つからない場合、emailで検索（保護者アカウント作成後の初回ログイン）
    if(email){
      const {data:emailUsers}=await sb.from("users").select("*").eq("email",email).eq("role","parent");
      if(emailUsers&&emailUsers.length>0){
        // メールアドレスで保護者アカウントが見つかった場合、auth_uidをリンク
        const user=emailUsers[0];
        await sb.from("users").update({auth_uid:authId}).eq("id",user.id);
        console.log("Linked Google OAuth to parent account:",user.id);
        users=[user];
      }
    }
  }
  
  if(users&&users.length>0){
    const user=users[0];
    authUser={id:user.id,role:user.role,email:user.email};
    
    if(user.role==="admin"){
      await showAdminScreen();
    }else if(user.role==="parent"){
      await showParentScreen();
    }else{
      showLogin();
    }
    // パスキー未登録なら提案
    showPasskeyIfNeeded();
    return true;
  }else{
    // 未登録ユーザー → エラー
    console.error("User not found in database for auth_uid:",authId,"email:",email);
    alert("このGoogleアカウントは登録されていません。\n管理者に連絡してアカウントを作成してもらってください。");
    await sb.auth.signOut();
    showLogin();
    return false;
  }
}

// パスキー登録モーダル
function showPasskeyIfNeeded(){
  const hasPasskey=localStorage.getItem("passkey_creds");
  if(!hasPasskey||JSON.parse(hasPasskey).length===0){
    setTimeout(function(){showPasskeyModal()},1000);
  }
}

function showPasskeyModal(){
  document.getElementById("passkey-modal").style.display="flex";
}

function dismissPasskeyModal(){
  document.getElementById("passkey-modal").style.display="none";
}

async function registerPasskey(){
  dismissPasskeyModal();
  try{
    if(!window.PublicKeyCredential){
      alert("お使いのブラウザはパスキーに対応していません");
      return;
    }
    
    // ドメインチェック（パスキーはlocalhostまたはHTTPSでのみ動作）
    const hostname=window.location.hostname;
    const isLocalhost=hostname==="localhost"||hostname==="127.0.0.1"||hostname==="[::1]";
    const isHTTPS=window.location.protocol==="https:";
    
    if(!isLocalhost&&!isHTTPS){
      alert("パスキー登録は、localhostまたはHTTPS環境でのみ可能です。\n\n現在の環境: "+window.location.origin+"\n\n開発環境では localhost:5500 を使用してください。");
      return;
    }
    
    // rp.id の設定（localhostの場合は明示的に設定）
    let rpId=hostname;
    if(isLocalhost){
      rpId="localhost";  // localhostの場合は明示的に設定
    }
    
    const challenge=new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const {data:{session}}=await sb.auth.getSession();
    if(!session){alert("ログインが必要です");return}
    
    console.log("Registering passkey for domain:",rpId);
    
    const credential=await navigator.credentials.create({
      publicKey:{
        challenge:challenge,
        rp:{name:"がくしゅうクエスト",id:rpId},
        user:{id:new TextEncoder().encode(session.user.id),name:session.user.email||session.user.id,displayName:session.user.email||"ユーザー"},
        // ES256とRS256の両方をサポート
        pubKeyCredParams:[
          {alg:-7,type:"public-key"},   // ES256
          {alg:-257,type:"public-key"}  // RS256
        ],
        authenticatorSelection:{authenticatorAttachment:"platform",requireResidentKey:true,residentKey:"required"},
        timeout:60000
      }
    });
    
    if(credential){
      const creds=JSON.parse(localStorage.getItem("passkey_creds")||"[]");
      creds.push({id:credential.id,rawId:arrayBufferToBase64(credential.rawId),type:credential.type});
      localStorage.setItem("passkey_creds",JSON.stringify(creds));
      alert("パスキーを登録しました！次回からパスキーでログインできます。");
    }
  }catch(e){
    if(e.name!=="AbortError"&&e.name!=="NotAllowedError"){
      console.error("Passkey registration error:",e);
      let errorMsg="パスキー登録に失敗しました。\n\n";
      
      if(e.name==="SecurityError"){
        errorMsg+="ドメインエラーが発生しました。\n";
        errorMsg+="パスキーは localhost または HTTPS でのみ使用可能です。\n\n";
        errorMsg+="現在のドメイン: "+window.location.origin+"\n\n";
        errorMsg+="【解決方法】\n";
        errorMsg+="1. localhost:5500 でアクセスしていることを確認\n";
        errorMsg+="2. VS CodeのLive Serverなどで起動していることを確認\n";
        errorMsg+="3. IPアドレスではなく localhost を使用";
      }else if(e.name==="NotSupportedError"){
        errorMsg+="お使いのブラウザまたはデバイスがパスキーに対応していません。";
      }else{
        errorMsg+="エラー詳細: "+e.message;
      }
      
      alert(errorMsg);
    }
  }
}

function arrayBufferToBase64(buf){
  const bytes=new Uint8Array(buf);
  let binary="";
  for(let i=0;i<bytes.byteLength;i++)binary+=String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function loginWithPasskey(){
  try{
    if(!window.PublicKeyCredential){alert("お使いのブラウザはパスキーに対応していません");return}
    const creds=JSON.parse(localStorage.getItem("passkey_creds")||"[]");
    if(creds.length===0){alert("パスキーが登録されていません。先にGoogleログインを行ってください。");return}
    const challenge=new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const credential=await navigator.credentials.get({
      publicKey:{
        challenge:challenge,
        rpId:window.location.hostname,
        allowCredentials:creds.map(c=>({id:Uint8Array.from(atob(c.rawId),c=>c.charCodeAt(0)),type:c.type})),
        userVerification:"required",timeout:60000
      }
    });
    if(credential){
      const {data:{session}}=await sb.auth.getSession();
      if(session){await handleAuthCallback()}
      else{alert("セッションが切れています。Googleログインからやり直してください。")}
    }
  }catch(e){
    if(e.name!=="AbortError"&&e.name!=="NotAllowedError"){
      console.error("Passkey login error:",e);
      alert("パスキーログインに失敗しました");
    }
  }
}

// ===== Supabase データ操作 =====

// 全ユーザー一覧を取得
async function fetchUsers(){
  const {data,error}=await sb.from("users").select("*").order("created_at",{ascending:true});
  if(error){console.error("fetchUsers error:",error);return[]}
  return data||[];
}

// ユーザーのプロフィールデータを取得
async function fetchProfile(userId){
  const {data,error}=await sb.from("user_profiles").select("*").eq("user_id",userId).single();
  if(error){console.error("fetchProfile error:",error);return null}
  return data;
}

// 保護者-子供関係
async function getChildrenByParent(parentId){
  const {data,error}=await sb.from("parent_child_relationships").select("child_id").eq("parent_id",parentId);
  if(error){console.error("getChildrenByParent error:",error);return[]}
  return data.map(r=>r.child_id)||[];
}

async function getParentsByChild(childId){
  const {data,error}=await sb.from("parent_child_relationships").select("parent_id").eq("child_id",childId);
  if(error){console.error("getParentsByChild error:",error);return[]}
  return data.map(r=>r.parent_id)||[];
}

async function addRelationship(parentId,childId){
  const {error}=await sb.from("parent_child_relationships").insert({parent_id:parentId,child_id:childId});
  if(error&&error.code!=="23505"){console.error("addRelationship error:",error);return false}
  return true;
}

async function removeRelationship(parentId,childId){
  const {error}=await sb.from("parent_child_relationships").delete().eq("parent_id",parentId).eq("child_id",childId);
  if(error){console.error("removeRelationship error:",error);return false}
  return true;
}

async function getAllRelationships(){
  const {data,error}=await sb.from("parent_child_relationships").select("*");
  if(error){console.error("getAllRelationships error:",error);return[]}
  return data||[];
}

// 新規ユーザー作成
let createDefaultDifficulty="easy";
let createDefaultTheme="pokemon";

function selectCreateDifficulty(d){
  createDefaultDifficulty=d;
  document.querySelectorAll("#create-difficulty-selector .difficulty-btn").forEach(b=>b.classList.toggle("active",b.dataset.diff===d));
}

function selectCreateTheme(t){
  createDefaultTheme=t;
  document.querySelectorAll("#create-theme-selector .theme-btn").forEach(b=>b.classList.toggle("active",b.dataset.theme===t));
}

async function createUser(name,pinRaw,admissionDate,role,defaultDifficulty,defaultTheme,email){
  let pinHash=null;
  if(role==="child"&&pinRaw){pinHash=await sha256(pinRaw)}
  
  const userDataToInsert={
    name:name,
    role:role||"child",
    pin_hash:pinHash,
    auth_uid:null,
    email:email||null
  };
  
  const {data:userData,error:userError}=await sb.from("users").insert(userDataToInsert).select().single();
  if(userError){console.error("createUser error:",userError);alert("ユーザー作成に失敗しました");return null}
  
  const {error:profileError}=await sb.from("user_profiles").insert({
    user_id:userData.id,
    admission_date:role==="child"?admissionDate:null,
    level:1,score:0,current_difficulty:defaultDifficulty||"easy",theme:defaultTheme||"pokemon",
    stats_math:0,stats_japanese:0,stats_english:0,stats_life:0,stats_science:0,stats_social:0,stats_moral:0
  });
  if(profileError){console.error("createProfile error:",profileError);alert("プロフィール作成に失敗しました");return null}
  
  return userData;
}

// プロフィールを更新（子供）
async function updateProfile(){
  if(!cu||!st)return;
  const {error}=await sb.from("user_profiles").update({
    level:st.level,score:st.score,current_difficulty:st.currentDifficulty,theme:st.theme,admission_date:st.admissionDate,
    stats_math:st.stats.math||0,stats_japanese:st.stats.japanese||0,stats_english:st.stats.english||0,
    stats_life:st.stats.life||0,stats_science:st.stats.science||0,stats_social:st.stats.social||0,stats_moral:st.stats.moral||0
  }).eq("user_id",cu.id);
  if(error)console.error("updateProfile error:",error);
}

// ユーザー削除
async function deleteUser(userId){
  const {error}=await sb.from("users").delete().eq("id",userId);
  if(error){console.error("deleteUser error:",error);return false}
  return true;
}

// ===== 画面ロジック =====

// ログイン画面表示
function showLogin(){
  document.getElementById("child-login-name").value="";
  document.getElementById("child-login-pin").value="";
  document.getElementById("child-login-error").textContent="";
  changeScreen("login");
}

// 子供ログイン（ID+PIN）
async function childLogin(){
  const name=document.getElementById("child-login-name").value.trim();
  const pin=document.getElementById("child-login-pin").value.trim();
  
  if(!name){document.getElementById("child-login-error").textContent="なまえを入力してください";return}
  if(pin.length!==4){document.getElementById("child-login-error").textContent="パスコードは4桁で入力してください";return}
  
  // 名前で子供ユーザーを検索
  const {data:users}=await sb.from("users").select("*").eq("name",name).eq("role","child");
  if(!users||users.length===0){
    document.getElementById("child-login-error").textContent="ユーザーが見つかりません";
    return;
  }
  
  // PIN照合
  const inputHash=await sha256(pin);
  let matched=false;
  for(const user of users){
    if(user.pin_hash===inputHash){
      matched=true;
      await selectChild(user);
      // 入力クリア
      document.getElementById("child-login-name").value="";
      document.getElementById("child-login-pin").value="";
      document.getElementById("child-login-error").textContent="";
      return;
    }
  }
  if(!matched){
    document.getElementById("child-login-error").textContent="パスコードがちがいます";
  }
}

// 子供ユーザー選択完了 → メニュー画面へ
async function selectChild(user){
  cu=user;
  const profile=await fetchProfile(user.id);
  if(!profile){
    alert("ユーザーデータの読み込みに失敗しました");
    return;
  }
  st={
    userId:user.id,admissionDate:profile.admission_date,
    level:profile.level,score:profile.score,
    stats:{
      math:profile.stats_math||0,japanese:profile.stats_japanese||0,english:profile.stats_english||0,
      life:profile.stats_life||0,science:profile.stats_science||0,social:profile.stats_social||0,moral:profile.stats_moral||0
    },
    currentDifficulty:profile.current_difficulty||"easy",theme:profile.theme||"pokemon"
  };
  changeScreen("menu");
  updateMenuInfo();
  applyTheme();
  document.getElementById("menu-user-name").textContent=user.name;
  document.querySelectorAll("#difficulty-selector .difficulty-btn").forEach(b=>b.classList.toggle("active",b.dataset.diff===st.currentDifficulty));
  document.querySelectorAll("#theme-selector .theme-btn").forEach(b=>b.classList.toggle("active",b.dataset.theme===st.theme));
}

// ===== ユーザー作成 =====

function showCreateUserAdmin(){
  // 管理者が保護者を作成
  document.getElementById("create-user-name").value="";
  document.getElementById("create-user-email").value="";
  document.getElementById("create-user-passcode").value="";
  document.getElementById("create-user-date").value="2026-04-01";
  document.getElementById("create-user-role").value="parent";
  document.getElementById("create-user-role-group").style.display="block";
  document.getElementById("create-user-date-group").style.display="none";
  document.getElementById("create-user-passcode-group").style.display="none";
  document.getElementById("create-user-parent-group").style.display="none";
  document.getElementById("create-user-email-group").style.display="block";
  changeScreen("create-user");
}

function showCreateUserChild(){
  // 保護者（または管理者）が子供を作成
  document.getElementById("create-user-name").value="";
  document.getElementById("create-user-passcode").value="";
  document.getElementById("create-user-date").value="2026-04-01";
  document.getElementById("create-user-role-group").style.display="none";
  document.getElementById("create-user-date-group").style.display="block";
  document.getElementById("create-user-passcode-group").style.display="block";
  
  // 保護者選択ドロップダウン（管理者の場合は全保護者から選択、保護者の場合は自分）
  const parentSelect=document.getElementById("create-user-parent-select");
  parentSelect.innerHTML="<option value=''>選択してください</option>";
  
  if(authUser&&authUser.role==="parent"){
    // 保護者自身が作成 → 自動紐づけ
    document.getElementById("create-user-parent-group").style.display="none";
  }else if(authUser&&authUser.role==="admin"){
    // 管理者が作成 → 紐づけ先保護者を選択可能
    document.getElementById("create-user-parent-group").style.display="block";
    fetchUsers().then(users=>{
      users.filter(u=>u.role==="parent").forEach(p=>{
        const opt=document.createElement("option");
        opt.value=p.id;
        opt.textContent=p.name+" ("+(p.email||"-")+")";
        parentSelect.appendChild(opt);
      });
    });
  }
  
  changeScreen("create-user");
}

async function createUserFromForm(){
  const name=document.getElementById("create-user-name").value.trim();
  const email=document.getElementById("create-user-email").value.trim();
  const passcode=document.getElementById("create-user-passcode").value.trim();
  const role=document.getElementById("create-user-role").value;
  const parentId=document.getElementById("create-user-parent-select").value;
  
  if(!name){alert("ユーザー名を入力してください");return}
  
  // 保護者アカウントの場合はメールアドレス必須
  if(role==="parent"&&!email){
    alert("保護者アカウントにはメールアドレスが必要です。\nGoogleログイン用のメールアドレスを入力してください。");
    return;
  }
  
  let admissionDate=null;
  if(role==="child"){
    if(passcode.length!==4||!/^\d{4}$/.test(passcode)){alert("パスコードは数字4桁で入力してください");return}
    admissionDate=document.getElementById("create-user-date").value;
    if(!admissionDate){alert("入学年月日を選択してください");return}
  }
  
  const user=await createUser(name,passcode,admissionDate,role,createDefaultDifficulty,createDefaultTheme,email);
  if(user){
    if(role==="child"){
      // 紐づけ処理
      if(authUser&&authUser.role==="parent"){
        // 保護者が作成 → 自動紐づけ
        await addRelationship(authUser.id,user.id);
      }else if(parentId){
        // 管理者が作成 → 選択された保護者に紐づけ
        await addRelationship(parentId,user.id);
      }
    }
    alert("ユーザー「"+name+"」を作成しました！");
    if(authUser&&authUser.role==="admin"){await showAdminScreen()}
    else if(authUser&&authUser.role==="parent"){await showParentScreen()}
    else{showLogin()}
  }
}

function goBackFromCreateUser(){
  if(authUser&&authUser.role==="admin"){showAdminScreen()}
  else if(authUser&&authUser.role==="parent"){showParentScreen()}
  else{showLogin()}
}

// ===== メニュー画面（子供） =====

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
  themeBgmMap:{pokemon:"bgm/ポケモン.wav",bluelock:"bgm/ブルーロック.mp3"},
  play(theme){this.stop();const src=this.themeBgmMap[theme];if(!src)return;this.audio=new Audio(src);this.audio.loop=true;this.audio.volume=0.5;this.audio.play().catch(function(e){console.log("BGM play failed:",e)})},
  stop(){if(this.audio){this.audio.pause();this.audio.currentTime=0;this.audio=null}}
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

// ===== 管理者画面 =====
async function showAdminScreen(){
  if(!authUser||authUser.role!=="admin"){showLogin();return}
  
  const users=await fetchUsers();
  const container=document.getElementById("admin-users-container");
  container.innerHTML="";
  
  if(users.length===0){
    container.innerHTML='<p style="color:#aaa;text-align:center;">ユーザーがいません。</p>';
  }else{
    for(const u of users){
      const div=document.createElement("div");
      div.className="parent-user-card";
      
      const profile=await fetchProfile(u.id);
      const p=profile||{};
      const statsHtml=u.role==="child"?Object.keys(SUBJECT_DEFS).map(function(k){
        return '<span class="parent-user-stat">'+SUBJECT_DEFS[k].label+':'+(p["stats_"+k]||0)+'</span>';
      }).join(" "):"";
      
      const roleBadge={'admin':'<span class="parent-user-badge" style="background:#e94560;">管理者</span>','parent':'<span class="parent-user-badge" style="background:#533483;">保護者</span>','child':'<span class="parent-user-badge" style="background:#27ae60;">子供</span>'}[u.role]||'';
      const detailInfo=u.role==="child"?'スコア: '+(p.score||0)+' | レベル: '+(p.level||1)+' | 入学: '+(p.admission_date||"-"):'メール: '+(u.email||"-");
      
      div.innerHTML=`
        <div class="parent-user-header">
          <span class="parent-user-name">${escapeHtml(u.name)} ${roleBadge}</span>
        </div>
        <div class="parent-user-stats">${statsHtml}</div>
        <div class="parent-user-detail">${detailInfo}</div>
        <div class="parent-user-actions">
          <button class="btn btn-small btn-primary" onclick="adminEditUser('${u.id}')">編集</button>
          <button class="btn btn-small btn-danger" onclick="adminDeleteUser('${u.id}','${escapeHtml(u.name)}')">削除</button>
        </div>
      `;
      container.appendChild(div);
    }
  }
  
  // 紐づけ管理UIの更新
  await updateRelationshipUI();
  changeScreen("admin-screen");
}

async function adminDeleteUser(userId,userName){
  if(!confirm("ユーザー「"+userName+"」を削除します。よろしいですか？"))return;
  const ok=await deleteUser(userId);
  if(ok){await showAdminScreen()}
  else{alert("削除に失敗しました")}
}

// 紐づけ管理UI
async function updateRelationshipUI(){
  const parentSelect=document.getElementById("admin-relation-parent");
  const childSelect=document.getElementById("admin-relation-child");
  const listDiv=document.getElementById("admin-relation-list");
  
  const users=await fetchUsers();
  const parents=users.filter(u=>u.role==="parent");
  const children=users.filter(u=>u.role==="child");
  
  parentSelect.innerHTML="<option value=''>保護者を選択</option>";
  parents.forEach(p=>{
    const opt=document.createElement("option");
    opt.value=p.id;opt.textContent=p.name+(p.email?" ("+p.email+")":"");
    parentSelect.appendChild(opt);
  });
  
  childSelect.innerHTML="<option value=''>子供を選択</option>";
  children.forEach(c=>{
    const opt=document.createElement("option");
    opt.value=c.id;opt.textContent=c.name;
    childSelect.appendChild(opt);
  });
  
  // 現在の紐づけ一覧を表示
  const rels=await getAllRelationships();
  const userMap={};
  users.forEach(u=>userMap[u.id]=u);
  
  if(rels.length===0){
    listDiv.innerHTML='<p style="color:#888;">紐づけはありません</p>';
  }else{
    let html="<div style='display:flex;flex-direction:column;gap:6px;'>";
    for(const r of rels){
      const pName=userMap[r.parent_id]?userMap[r.parent_id].name:"?";
      const cName=userMap[r.child_id]?userMap[r.child_id].name:"?";
      html+=`<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(22,33,62,0.8);border-radius:6px;padding:6px 10px;">
        <span>${escapeHtml(pName)}  →  ${escapeHtml(cName)}</span>
        <button class="btn btn-small btn-danger" onclick="removeRelationship('${r.parent_id}','${r.child_id}')" style="padding:4px 8px;font-size:11px;">削除</button>
      </div>`;
    }
    html+="</div>";
    listDiv.innerHTML=html;
  }
}

async function addRelationship(){
  const parentId=document.getElementById("admin-relation-parent").value;
  const childId=document.getElementById("admin-relation-child").value;
  if(!parentId||!childId){alert("保護者と子供を選択してください");return}
  const ok=await addRelationship(parentId,childId);
  if(ok){
    await updateRelationshipUI();
  }else{
    alert("すでに紐づけられているか、エラーが発生しました");
  }
}

// ===== 保護者画面 =====
async function showParentScreen(){
  if(!authUser||authUser.role!=="parent"){showLogin();return}
  
  const users=await fetchUsers();
  const childIds=await getChildrenByParent(authUser.id);
  const container=document.getElementById("parent-users-container");
  container.innerHTML="";
  
  if(childIds.length===0){
    container.innerHTML='<p style="color:#aaa;text-align:center;">子供アカウントがありません。「子供を作成」から作成してください。</p>';
  }else{
    for(const childId of childIds){
      const user=users.find(u=>u.id===childId);
      if(!user)continue;
      const div=document.createElement("div");
      div.className="parent-user-card";
      
      const profile=await fetchProfile(childId);
      const p=profile||{};
      const statsHtml=Object.keys(SUBJECT_DEFS).map(function(k){
        return '<span class="parent-user-stat">'+SUBJECT_DEFS[k].label+':'+(p["stats_"+k]||0)+'</span>';
      }).join(" ");
      
      div.innerHTML=`
        <div class="parent-user-header">
          <span class="parent-user-name">${escapeHtml(user.name)}</span>
        </div>
        <div class="parent-user-stats">${statsHtml}</div>
        <div class="parent-user-detail">スコア: ${p.score||0} | レベル: ${p.level||1} | 入学: ${p.admission_date||"-"}</div>
        <div class="parent-user-actions">
          <button class="btn btn-small btn-primary" onclick="adminEditUser('${user.id}')">編集</button>
          <button class="btn btn-small btn-danger" onclick="adminDeleteUser('${user.id}','${escapeHtml(user.name)}')">削除</button>
        </div>
      `;
      container.appendChild(div);
    }
  }
  changeScreen("parent-screen");
}

// ===== ユーザー編集（管理者・保護者共用） =====
let editingUserId=null;
let userEditDifficulty="easy";
let userEditTheme="pokemon";

function userEditSelectDifficulty(d){
  userEditDifficulty=d;
  document.querySelectorAll("#user-edit-difficulty-selector .difficulty-btn").forEach(b=>b.classList.toggle("active",b.dataset.diff===d));
}

function userEditSelectTheme(t){
  userEditTheme=t;
  document.querySelectorAll("#user-edit-theme-selector .theme-btn").forEach(b=>b.classList.toggle("active",b.dataset.theme===t));
}

async function adminEditUser(userId){
  editingUserId=userId;
  const profile=await fetchProfile(userId);
  if(!profile){alert("データ取得エラー");return}
  
  userEditDifficulty=profile.current_difficulty||"easy";
  userEditTheme=profile.theme||"pokemon";
  
  document.getElementById("user-edit-name").value="";
  document.getElementById("user-edit-passcode").value="";
  document.getElementById("user-edit-date").value=profile.admission_date||"2026-04-01";
  document.getElementById("user-edit-score").value=profile.score;
  document.getElementById("user-edit-level").value=profile.level;
  
  document.querySelectorAll("#user-edit-difficulty-selector .difficulty-btn").forEach(b=>b.classList.toggle("active",b.dataset.diff===userEditDifficulty));
  document.querySelectorAll("#user-edit-theme-selector .theme-btn").forEach(b=>b.classList.toggle("active",b.dataset.theme===userEditTheme));
  
  const {data:userData}=await sb.from("users").select("*").eq("id",userId).single();
  if(userData){
    document.getElementById("user-edit-name").value=userData.name;
    document.getElementById("user-edit-passcode").value="";
    
    const isChild=userData.role==="child";
    const isAdmin=authUser&&authUser.role==="admin";
    
    document.getElementById("user-edit-date-group").style.display=isChild?"block":"none";
    document.getElementById("user-edit-score-group").style.display=isChild?"block":"none";
    document.getElementById("user-edit-level-group").style.display=isChild?"block":"none";
    document.getElementById("user-edit-difficulty-group").style.display=isChild?"block":"none";
    document.getElementById("user-edit-theme-group").style.display=isChild?"block":"none";
    document.getElementById("user-edit-role-group").style.display=isAdmin?"block":"none";
    if(isAdmin){
      document.getElementById("user-edit-role").value=userData.role;
    }
  }
  changeScreen("user-edit");
}

async function userEditSave(){
  const userId=editingUserId;
  const name=document.getElementById("user-edit-name").value.trim();
  const passcode=document.getElementById("user-edit-passcode").value.trim();
  const date=document.getElementById("user-edit-date").value;
  const score=parseInt(document.getElementById("user-edit-score").value)||0;
  const level=parseInt(document.getElementById("user-edit-level").value)||1;
  
  if(!name){alert("ユーザー名を入力してください");return}
  
  const userUpdate={name:name};
  if(passcode.length===4&&/^\d{4}$/.test(passcode)){
    userUpdate.pin_hash=await sha256(passcode);
  }
  if(authUser&&authUser.role==="admin"){
    const newRole=document.getElementById("user-edit-role").value;
    userUpdate.role=newRole;
  }
  
  const {error:nameErr}=await sb.from("users").update(userUpdate).eq("id",userId);
  if(nameErr){alert("ユーザー情報の更新に失敗しました");return}
  
  const {data:userData}=await sb.from("users").select("role").eq("id",userId).single();
  if(userData&&userData.role==="child"){
    const profUpdate={};
    if(date)profUpdate.admission_date=date;
    profUpdate.score=score;
    profUpdate.level=level;
    profUpdate.current_difficulty=userEditDifficulty;
    profUpdate.theme=userEditTheme;
    
    const {error:profErr}=await sb.from("user_profiles").update(profUpdate).eq("user_id",userId);
    if(profErr){alert("プロフィールの更新に失敗しました");return}
    
    if(cu&&cu.id===userId){
      st.admissionDate=date;
      st.score=score;
      st.level=level;
      cu.name=name;
      document.getElementById("menu-user-name").textContent=name;
    }
  }
  
  alert("保存しました");
  if(authUser&&authUser.role==="admin"){await showAdminScreen()}
  else{await showParentScreen()}
}

function userEditCancel(){
  if(authUser&&authUser.role==="admin"){showAdminScreen()}
  else{showParentScreen()}
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
      b.textContent=sh[i];b.disabled=false;b.className="choice-btn";b.dataset.choiceValue=sh[i];
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
    bt.enemyHP=Math.max(0,bt.enemyHP-25);updateBattleHP();
    var eu=document.getElementById("enemy-unit");eu.classList.remove("damage-flash");void eu.offsetWidth;eu.classList.add("damage-flash");
    st.stats[bt.subject]=(st.stats[bt.subject]||0)+1;updateProfile();
  }else{
    cb.classList.add("wrong");
    bts.forEach(function(b){if(b.dataset.choiceValue===bt.curAns)b.classList.add("correct")});
    var dmg=bt.difficulty==="easy"?3:(bt.difficulty==="normal"?12:25);
    bt.playerHP=Math.max(0,bt.playerHP-dmg);updateBattleHP();
    var pu=document.getElementById("player-unit");pu.classList.remove("damage-flash");void pu.offsetWidth;pu.classList.add("damage-flash");
  }
  if(bt.enemyHP<=0){setTimeout(function(){showBattleResult("win")},600);return}
  if(bt.playerHP<=0){setTimeout(function(){showBattleResult("lose")},600);return}
  setTimeout(function(){nextQuestion()},800);
}

function updateBattleHP(){
  document.getElementById("player-hp-bar").style.width=Math.max(0,(bt.playerHP/bt.maxPlayerHP)*100)+"%";
  document.getElementById("enemy-hp-bar").style.width=Math.max(0,(bt.enemyHP/bt.maxEnemyHP)*100)+"%";
  document.getElementById("player-hp-text").textContent="HP: "+bt.playerHP;
  document.getElementById("enemy-hp-text").textContent="HP: "+bt.enemyHP;
}

function showBattleResult(type){
  var o=document.getElementById("battle-result-overlay"),e=document.getElementById("result-emoji"),t=document.getElementById("result-text"),s=document.getElementById("result-sub-text");
  if(type==="win"){
    e.textContent="";t.textContent=" しょうり！おめでとう！";
    st.score=(st.score||0)+10;
    var old=st.level,nl=Math.floor(st.score/100)+1;
    if(nl>old){st.level=nl;s.textContent=" レベルアップ！ レベル "+old+" "+nl+" "}
    else{s.textContent="スコア+10（あと"+(100-(st.score%100||100))+"でレベルアップ！）"}
    updateProfile();
  }else{e.textContent="";t.textContent=" まけちゃった... がんぼろう！";s.textContent="つぎはきっとかてるよ！"}
  o.classList.add("show");
}

function backToMenu(){
  document.getElementById("battle-result-overlay").classList.remove("show");
  changeScreen("menu");updateMenuInfo();
}

function logoutUser(){
  cu=null;st=null;authUser=null;BGM.stop();
  sb.auth.signOut().catch(function(){});
  showLogin();
}

// ===== 初期化 =====
window.onload=async function(){
  try{
    if(typeof window.supabase==="undefined"||!window.supabase){
      throw new Error("Supabaseクライアントライブラリが読み込まれていません");
    }
    if(!SUPABASE_URL||!SUPABASE_ANON_KEY||SUPABASE_URL.indexOf("your-project-id")>=0||SUPABASE_ANON_KEY.indexOf("your-anon-key")>=0){
      throw new Error("SUPABASE_URL または SUPABASE_ANON_KEY が設定されていません");
    }
    
    const {data:{session}}=await sb.auth.getSession();
    if(session){
      const handled=await handleAuthCallback();
      if(handled)return;
    }
    showLogin();
  }catch(e){
    console.error("初期化エラー:",e);
    document.body.innerHTML='<div style="padding:40px;text-align:center;font-size:18px;color:#fff;background:#1a1a2e;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;">'+
      '<h1 style="color:#e94560;margin-bottom:16px;">⚠️ エラー</h1>'+
      '<p style="color:#aaa;margin-bottom:12px;">'+escapeHtml(e.message)+'</p>'+
      '<p style="color:#888;font-size:14px;margin-bottom:20px;">画面をリロードしてください。</p>'+
      '<button class="btn btn-primary" onclick="location.reload()" style="min-width:160px;">リロード</button>'+
      '</div>';
  }
};