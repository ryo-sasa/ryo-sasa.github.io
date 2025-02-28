// 科目ごとの詳細科目
const subjectDetails = {
    "外国語": ["英語", "その他"],
    "国語": [], // 詳細科目なし
    "数学": [], // 詳細科目なし
    "理科": ["物理", "化学", "生物", "地学"],
    "地歴公民": ["世界史", "日本史", "地理", "公民"],
    "小論文": [], // 詳細科目なし
    "その他": ["総合問題", "英語資格/検定試験", "調査書", "実技", "その他"],
    "受験なし": [] // 詳細科目なし
};

// サブ科目と得点入力欄を表示する関数
function updateSubSubject(mainSelect) {
    const subSelect = mainSelect.parentElement.nextElementSibling.children[0];
    const scoreInput = subSelect.parentElement.nextElementSibling.children[0];
    const selectedValue = mainSelect.value;

    // サブ科目リセット
    subSelect.innerHTML = '<option value="">--選択してください--</option>';
    if (selectedValue && subjectDetails[selectedValue].length > 0) {
    subjectDetails[selectedValue].forEach(sub => {
        const option = document.createElement("option");
        option.value = sub;
        option.textContent = sub;
        subSelect.appendChild(option);
    });
    subSelect.style.display = "block";
    scoreInput.style.display = "block";
    } else {
    subSelect.style.display = "none";
    subSelect.value = "";
    scoreInput.style.display = selectedValue === "受験なし" ? "none" : "block";
    }

    // 最後の行であれば、新しい行を追加
    addRowIfLast(mainSelect.parentElement.parentElement);
}

// 最初の行にイベントリスナーを追加する関数
function addEventListenersToFirstRow() {
    const firstMainSubjectSelect = document.querySelector('#second-test-body .main-subject');
    if (firstMainSubjectSelect) {
    firstMainSubjectSelect.addEventListener('change', function() {
        updateSubSubject(this);
    });
    }
}

// 最終行に新しい行を追加する関数
function addRowIfLast(row) {
    const tableBody = document.getElementById("second-test-body");
    if (row.nextElementSibling === null) {
    const newRow = row.cloneNode(true);
    newRow.querySelectorAll("select, input").forEach(el => {
        el.value = "";
        if (el.classList.contains("main-subject")) {
        el.style.display = "block";
        el.addEventListener('change', function() {
            updateSubSubject(this);
        });
        } else {
        el.style.display = "none";
        }
    });
    tableBody.appendChild(newRow);
    }
}

// 初期化処理 (ページ読み込み時に実行)
document.addEventListener('DOMContentLoaded', function() {
    addEventListenersToFirstRow();
});

// 得点が0未満の場合は0に修正し、頭の0を削除
function validateScoreInput(inputElement) {
    // 0未満の場合は0にする
    if (inputElement.value < 0) {
    inputElement.value = 0;
    }

    // 先頭の不要な0を削除 (ただし「0」そのものは削除しない)
    inputElement.value = inputElement.value.replace(/^0+(\d+)/, '$1');
}

// 初期化処理 (ページ読み込み時に実行)
document.addEventListener('DOMContentLoaded', function() {
    addEventListenersToFirstRow();

    // 最初の得点入力欄にもバリデーションを追加
    document.querySelectorAll('.score-input').forEach(input => {
    input.addEventListener('input', function() {
        validateScoreInput(input);
    });
    });
});

// プルダウン選択時の動作
document.getElementById('introducer_select').addEventListener('change', function () {
const introducerInput = document.getElementById('introducer');
const introducerNote = document.getElementById('introducer_note');
if (this.value === 'other') {
    introducerInput.style.display = 'block'; // テキストボックスを表示
    introducerNote.style.display = 'block'; // 注意書きを表示
} else {
    introducerInput.style.display = 'none';  // テキストボックスを非表示
    introducerInput.value = ''; // 非表示時に値をリセット
    introducerNote.style.display = 'none'; // 注意書きを非表示
}
});

// 電話番号の全角数字と全角ハイフンを半角に変換
document.getElementById('tel_home')?.addEventListener('input', function () {
    this.value = this.value
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/－/g, '-'); // 全角ハイフンを半角ハイフンに変換
});



//郵便番号について

document.addEventListener("DOMContentLoaded", function () {
    // 郵便番号の全角数字を半角に変換
    document.getElementById('address_num').addEventListener('input', function () {
        this.value = this.value.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    });

    // 郵便番号検索ボタンのクリックイベント
    document.getElementById("searchButton").addEventListener("click", function () {
        const postalCode = document.getElementById("address_num").value.trim();

        // 郵便番号のフォーマットチェック（半角数字7桁）
        if (!/^\d{7}$/.test(postalCode)) {
            alert("郵便番号は半角数字7桁で入力してください。");
            return;
        }

        // 郵便番号検索APIを使用
        const url = `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    document.getElementById("address_str").value = `${result.address1}${result.address2}${result.address3}`;
                } else {
                    alert("該当する住所が見つかりませんでした。");
                    document.getElementById("address_str").value = "";
                }
            })
            .catch(error => {
                console.error("エラーが発生しました:", error);
                alert("住所検索に失敗しました。時間をおいて再度お試しください。");
            });
    });
});

//一次試験について

const testOptions = {
    center: {
    foreign_language: ["英語(筆記)", "英語(リスニング)", "ドイツ語", "フランス語", "中国語", "韓国語", "受験なし"],
    japanese: ["現代文", "古文", "漢文", "受験なし"],
    math_1: ["数学Ⅰ", "数学Ⅰ・A", "受験なし"],
    math_2: ["数学Ⅱ", "数学Ⅱ・B", "簿記・会計", "情報関係基礎", "受験なし"],
    social_studies: ["世界史A", "世界史B", "日本史A", "日本史B", "地理A", "地理B", "現代社会", "倫理", "政治・経済", "倫理，政治・経済", "受験なし"],
    science_1: ["物理基礎", "化学基礎", "生物基礎", "地学基礎", "受験なし"],
    science_2: ["物理", "化学", "生物", "地学", "受験なし"],
    information: ["受験なし"]
    },
    common_2024: {
    foreign_language: ["英語リーディング", "英語リスニング", "ドイツ語", "フランス語", "中国語", "韓国語", "受験なし"],
    japanese: ["現代文", "古文", "漢文", "受験なし"],
    math_1: ["数学Ⅰ", "数学Ⅰ・A", "受験なし"],
    math_2: ["数学Ⅱ", "数学Ⅱ・B", "簿記・会計", "情報関係基礎", "受験なし"],
    social_studies: ["世界史A", "世界史B", "日本史A", "日本史B", "地理A", "地理B", "現代社会", "倫理", "政治・経済", "倫理，政治・経済", "受験なし"],
    science_1: ["物理基礎", "化学基礎", "生物基礎", "地学基礎", "受験なし"],
    science_2: ["物理", "化学", "生物", "地学", "受験なし"],
    information: ["受験なし"]
    },
    common_2025: {
    foreign_language: ["英語リーディング", "英語リスニング", "ドイツ語", "フランス語", "中国語", "韓国語", "受験なし"],
    japanese: ["現代文", "古文", "漢文", "受験なし"],
    math_1: ["数学Ⅰ", "数学Ⅰ・A", "受験なし"],
    math_2: ["数学Ⅱ", "数学Ⅱ・B", "数学Ⅱ・B・C", "受験なし"],
    social_studies: ["歴史総合，世界史探求", "歴史総合，日本史探求", "地理総合，地理探求", "公共，倫理", "公共，政治・経済", "受験なし"],
    science_1: ["物理基礎", "化学基礎", "生物基礎", "地学基礎", "受験なし"],
    science_2: ["物理", "化学", "生物", "地学", "受験なし"],
    information: ["情報Ⅰ", "受験なし"]
    }
};

function updateSubjects() {
    const examType = document.getElementById("exam_type").value;
    if (!testOptions[examType]) return;

    Object.keys(testOptions[examType]).forEach((key) => {
    const selects = document.querySelectorAll(`select[name^="${key}"]`);
    selects.forEach((select) => {
        select.innerHTML = `<option value="">--選択してください--</option>`;
        testOptions[examType][key].forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
        });
    });
    });
}

function toggleScoreInput(select, inputId) {
    const input = document.getElementById(inputId);
    input.style.display = select.value && select.value !== "受験なし" ? "block" : "none";
}

function validateScoreInput(inputElement) {

    // 0未満の場合は0にする
    if (inputElement.value < 0) {
    inputElement.value = 0;
    }

    // 先頭の不要な0を削除(ただし「0」そのものは削除しない)
    inputElement.value = inputElement.value.replace(/^0+(\d+)/, '$1');
}

// 全スコア入力欄のchangeイベントでvalidateScoreInputを実行
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener("change", function () {
    validateScoreInput(input);
    });
});

// 全ての入力フィールドにイベントリスナーを追加
document.querySelectorAll('input, select').forEach(field => {
    // 入力が完了したら "completed" クラスを追加
    field.addEventListener('input', () => {
    if (field.value.trim() !== '') {
        field.classList.add('completed'); // 入力済みの場合
    } else {
        field.classList.remove('completed'); // 未入力の場合
    }
    });
});

//名前入力について

function toHalfWidthKana(str) {
// 1. ひらがなを全角カタカナに変換する
//   （Unicode上で「ひらがな」(3040-309F)を「カタカナ」(30A0-30FF)へシフト）
str = str.replace(/[\u3041-\u3096]/g, function(match) {
    // ひらがなのコードポイントをカタカナのコードポイントにシフト
    const code = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(code);
});

// 2. 全角カタカナを半角カタカナに変換するマッピング
const kanaMap = {
    'ガ': 'ｶﾞ', 'ギ': 'ｷﾞ', 'グ': 'ｸﾞ', 'ゲ': 'ｹﾞ', 'ゴ': 'ｺﾞ',
    'ザ': 'ｻﾞ', 'ジ': 'ｼﾞ', 'ズ': 'ｽﾞ', 'ゼ': 'ｾﾞ', 'ゾ': 'ｿﾞ',
    'ダ': 'ﾀﾞ', 'ヂ': 'ﾁﾞ', 'ヅ': 'ﾂﾞ', 'デ': 'ﾃﾞ', 'ド': 'ﾄﾞ',
    'バ': 'ﾊﾞ', 'ビ': 'ﾋﾞ', 'ブ': 'ﾌﾞ', 'ベ': 'ﾍﾞ', 'ボ': 'ﾎﾞ',
    'パ': 'ﾊﾟ', 'ピ': 'ﾋﾟ', 'プ': 'ﾌﾟ', 'ペ': 'ﾍﾟ', 'ポ': 'ﾎﾟ',
    'ヴ': 'ｳﾞ', 'ッ': 'ｯ', 'ャ': 'ｬ', 'ュ': 'ｭ', 'ョ': 'ｮ',
    'ァ': 'ｧ', 'ィ': 'ｨ', 'ゥ': 'ｩ', 'ェ': 'ｪ', 'ォ': 'ｫ',
    'ー': 'ｰ', '。': '｡', '、': '､', '「': '｢', '」': '｣',
    'ヲ': 'ｦ', 'ン': 'ﾝ', 'カ': 'ｶ', 'キ': 'ｷ', 'ク': 'ｸ', 
    'ケ': 'ｹ', 'コ': 'ｺ', 'サ': 'ｻ', 'シ': 'ｼ', 'ス': 'ｽ', 
    'セ': 'ｾ', 'ソ': 'ｿ', 'タ': 'ﾀ', 'チ': 'ﾁ', 'ツ': 'ﾂ', 
    'テ': 'ﾃ', 'ト': 'ﾄ', 'ナ': 'ﾅ', 'ニ': 'ﾆ', 'ヌ': 'ﾇ', 
    'ネ': 'ﾈ', 'ノ': 'ﾉ', 'ハ': 'ﾊ', 'ヒ': 'ﾋ', 'フ': 'ﾌ', 
    'ヘ': 'ﾍ', 'ホ': 'ﾎ', 'マ': 'ﾏ', 'ミ': 'ﾐ', 'ム': 'ﾑ', 
    'メ': 'ﾒ', 'モ': 'ﾓ', 'ヤ': 'ﾔ', 'ユ': 'ﾕ', 'ヨ': 'ﾖ', 
    'ラ': 'ﾗ', 'リ': 'ﾘ', 'ル': 'ﾙ', 'レ': 'ﾚ', 'ロ': 'ﾛ', 
    'ワ': 'ﾜ', 'ヰ': 'ｲ', 'ヱ': 'ｴ', 'ヮ': 'ﾜ', 'ア': 'ｱ', 
    'イ': 'ｲ', 'ウ': 'ｳ', 'エ': 'ｴ', 'オ': 'ｵ'
};

// 3. 全角カタカナを半角カタカナに置換
return str.replace(/[\u30A1-\u30FF]/g, function(match) {
    return kanaMap[match] || match; // 対応する変換があれば変換
});
}
