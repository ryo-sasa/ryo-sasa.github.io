/* =========================================================================
   Hilton Roulette — マスターデータ
   -------------------------------------------------------------------------
   日本国内のヒルトン系列ホテル（9ブランド）。
   ブランド階層はヒルトン公式のポートフォリオ区分に準拠。
   運営元（直営 / フランチャイズ）は公開情報ベースの参考値です。
   ========================================================================= */

/* ---------- 地方 ---------- */
const REGIONS = [
  { id: 'hokkaido', label: '北海道' },
  { id: 'tohoku', label: '東北' },
  { id: 'kanto', label: '関東' },
  { id: 'chubu', label: '中部' },
  { id: 'kinki', label: '近畿' },
  { id: 'chugoku', label: '中国・四国' },
  { id: 'kyushu', label: '九州・沖縄' },
];

/* ---------- ブランド（tier はヒルトン公式のポートフォリオ区分） ---------- */
const BRANDS = [
  { id: 'waldorf',    label: 'ウォルドーフ・アストリア', en: 'Waldorf Astoria',   tier: 'luxury' },
  { id: 'lxr',        label: 'LXR',                     en: 'LXR Hotels & Resorts', tier: 'luxury' },
  { id: 'conrad',     label: 'コンラッド',               en: 'Conrad',            tier: 'luxury' },
  { id: 'curio',      label: 'キュリオ・コレクション',    en: 'Curio Collection',  tier: 'lifestyle' },
  { id: 'tapestry',   label: 'タペストリー コレクション', en: 'Tapestry Collection', tier: 'lifestyle' },
  { id: 'canopy',     label: 'キャノピー',               en: 'Canopy',            tier: 'lifestyle' },
  { id: 'motto',      label: 'モットー',                 en: 'Motto',             tier: 'lifestyle' },
  { id: 'hilton',     label: 'ヒルトン',                 en: 'Hilton',            tier: 'full' },
  { id: 'doubletree', label: 'ダブルツリー',             en: 'DoubleTree',        tier: 'full' },
  { id: 'hgi',        label: 'ヒルトン・ガーデン・イン',  en: 'Hilton Garden Inn', tier: 'focused' },
];

const TIERS = {
  luxury:    { label: 'ラグジュアリー',     en: 'LUXURY' },
  lifestyle: { label: 'ライフスタイル',     en: 'LIFESTYLE' },
  full:      { label: 'フルサービス',       en: 'FULL SERVICE' },
  focused:   { label: 'フォーカストサービス', en: 'FOCUSED SERVICE' },
};

/* ---------- 運営元 ---------- */
const OPERATORS = [
  { id: 'hilton-direct', label: 'ヒルトン直営',                 fc: false },
  { id: 'tokyu',         label: '東急リゾーツ&ステイ',           fc: true },
  { id: 'ytl',           label: 'YTLホテルズ',                  fc: true },
  { id: 'hmj',           label: 'ホテルマネージメントジャパン',   fc: true },
  { id: 'narita-kosuge', label: 'ナリタコスゲ・オペレーションズ', fc: true },
  { id: 'ken',           label: 'ケン・コーポレーション系',       fc: true },
  { id: 'graba',         label: 'グラバーヒル（松藤グループ）',   fc: true },
  { id: 'unknown',       label: '非公表',                       fc: null },
];

/* ---------- ホテル（開業済み 36 軒） ----------
   n: 正式名 / s: ホイール表示用の短縮名 / b: ブランド / r: 地方
   p: 都道府県 / c: 市区町村 / t: city|resort / o: 運営元 id           */
const HOTELS = [
  /* ===== 北海道 ===== */
  { n: 'ヒルトンニセコビレッジ', s: 'ヒルトン ニセコビレッジ', b: 'hilton', r: 'hokkaido', p: '北海道', c: '虻田郡ニセコ町', t: 'resort', o: 'ytl' },
  { n: 'ヒノデヒルズ・ニセコビレッジ, キュリオ・コレクション by ヒルトン', s: 'ヒノデヒルズ ニセコ', b: 'curio', r: 'hokkaido', p: '北海道', c: '虻田郡ニセコ町', t: 'resort', o: 'ytl' },
  { n: 'ザ・グリーンリーフ・ニセコビレッジ, タペストリー コレクション by ヒルトン', s: 'グリーンリーフ ニセコ', b: 'tapestry', r: 'hokkaido', p: '北海道', c: '虻田郡ニセコ町', t: 'resort', o: 'ytl' },

  /* ===== 関東 ===== */
  { n: 'コンラッド東京', s: 'コンラッド東京', b: 'conrad', r: 'kanto', p: '東京都', c: '港区', t: 'city', o: 'hilton-direct' },
  { n: 'ヒルトン東京', s: 'ヒルトン東京', b: 'hilton', r: 'kanto', p: '東京都', c: '新宿区', t: 'city', o: 'hilton-direct' },
  { n: 'ヒルトン東京お台場', s: 'ヒルトン東京お台場', b: 'hilton', r: 'kanto', p: '東京都', c: '港区', t: 'city', o: 'hmj' },
  { n: 'ダブルツリーbyヒルトン東京有明', s: 'DT 東京有明', b: 'doubletree', r: 'kanto', p: '東京都', c: '江東区', t: 'city', o: 'unknown' },
  { n: 'ヒルトン東京ベイ', s: 'ヒルトン東京ベイ', b: 'hilton', r: 'kanto', p: '千葉県', c: '浦安市', t: 'resort', o: 'hilton-direct' },
  { n: 'ヒルトン成田', s: 'ヒルトン成田', b: 'hilton', r: 'kanto', p: '千葉県', c: '成田市', t: 'city', o: 'narita-kosuge' },
  { n: 'ヒルトン横浜', s: 'ヒルトン横浜', b: 'hilton', r: 'kanto', p: '神奈川県', c: '横浜市西区', t: 'city', o: 'ken' },
  { n: 'ヒルトン・ガーデン・イン横浜みなとみらい', s: 'HGI みなとみらい', b: 'hgi', r: 'kanto', p: '神奈川県', c: '横浜市西区', t: 'city', o: 'unknown' },
  { n: 'ヒルトン小田原リゾート&スパ', s: 'ヒルトン小田原', b: 'hilton', r: 'kanto', p: '神奈川県', c: '小田原市', t: 'resort', o: 'hilton-direct' },

  /* ===== 中部 ===== */
  { n: 'ダブルツリーbyヒルトン富山', s: 'DT 富山', b: 'doubletree', r: 'chubu', p: '富山県', c: '富山市', t: 'city', o: 'hilton-direct' },
  { n: '旧軽井沢KIKYO, キュリオ・コレクション by ヒルトン', s: '旧軽井沢KIKYO', b: 'curio', r: 'chubu', p: '長野県', c: '北佐久郡軽井沢町', t: 'resort', o: 'tokyu' },
  { n: 'ヒルトン名古屋', s: 'ヒルトン名古屋', b: 'hilton', r: 'chubu', p: '愛知県', c: '名古屋市中区', t: 'city', o: 'hilton-direct' },
  { n: 'コンラッド名古屋', s: 'コンラッド名古屋', b: 'conrad', r: 'chubu', p: '愛知県', c: '名古屋市中村区', t: 'city', o: 'hilton-direct' },

  /* ===== 近畿 ===== */
  { n: 'ROKU KYOTO, LXR Hotels & Resorts', s: 'ROKU KYOTO', b: 'lxr', r: 'kinki', p: '京都府', c: '京都市北区', t: 'resort', o: 'tokyu' },
  { n: 'ヒルトン京都', s: 'ヒルトン京都', b: 'hilton', r: 'kinki', p: '京都府', c: '京都市中京区', t: 'city', o: 'hilton-direct' },
  { n: 'ダブルツリーbyヒルトン京都東山', s: 'DT 京都東山', b: 'doubletree', r: 'kinki', p: '京都府', c: '京都市東山区', t: 'city', o: 'hilton-direct' },
  { n: 'ダブルツリーbyヒルトン京都駅', s: 'DT 京都駅', b: 'doubletree', r: 'kinki', p: '京都府', c: '京都市南区', t: 'city', o: 'hilton-direct' },
  { n: 'ヒルトン・ガーデン・イン京都四条烏丸', s: 'HGI 京都四条烏丸', b: 'hgi', r: 'kinki', p: '京都府', c: '京都市', t: 'city', o: 'hilton-direct' },
  { n: 'ウォルドーフ・アストリア大阪', s: 'WA 大阪', b: 'waldorf', r: 'kinki', p: '大阪府', c: '大阪市北区', t: 'city', o: 'hilton-direct' },
  { n: 'コンラッド大阪', s: 'コンラッド大阪', b: 'conrad', r: 'kinki', p: '大阪府', c: '大阪市北区', t: 'city', o: 'hilton-direct' },
  { n: 'キャノピーbyヒルトン大阪梅田', s: 'キャノピー大阪梅田', b: 'canopy', r: 'kinki', p: '大阪府', c: '大阪市北区', t: 'city', o: 'hilton-direct' },
  { n: 'ヒルトン大阪', s: 'ヒルトン大阪', b: 'hilton', r: 'kinki', p: '大阪府', c: '大阪市北区', t: 'city', o: 'hilton-direct' },
  { n: 'ダブルツリーbyヒルトン大阪城', s: 'DT 大阪城', b: 'doubletree', r: 'kinki', p: '大阪府', c: '大阪市中央区', t: 'city', o: 'hilton-direct' },

  /* ===== 中国・四国 ===== */
  { n: 'ヒルトン広島', s: 'ヒルトン広島', b: 'hilton', r: 'chugoku', p: '広島県', c: '広島市中区', t: 'city', o: 'hilton-direct' },

  /* ===== 九州・沖縄 ===== */
  { n: 'ヒルトン福岡シーホーク', s: 'ヒルトン福岡シーホーク', b: 'hilton', r: 'kyushu', p: '福岡県', c: '福岡市中央区', t: 'resort', o: 'hilton-direct' },
  { n: 'ヒルトン長崎', s: 'ヒルトン長崎', b: 'hilton', r: 'kyushu', p: '長崎県', c: '長崎市', t: 'city', o: 'graba' },
  { n: 'ダブルツリーbyヒルトン那覇', s: 'DT 那覇', b: 'doubletree', r: 'kyushu', p: '沖縄県', c: '那覇市', t: 'city', o: 'hilton-direct' },
  { n: 'ダブルツリーbyヒルトン那覇首里城', s: 'DT 那覇首里城', b: 'doubletree', r: 'kyushu', p: '沖縄県', c: '那覇市', t: 'city', o: 'hilton-direct' },
  { n: 'ヒルトン沖縄北谷リゾート', s: 'ヒルトン沖縄北谷', b: 'hilton', r: 'kyushu', p: '沖縄県', c: '中頭郡北谷町', t: 'resort', o: 'hilton-direct' },
  { n: 'ダブルツリーbyヒルトン沖縄北谷リゾート', s: 'DT 沖縄北谷', b: 'doubletree', r: 'kyushu', p: '沖縄県', c: '中頭郡北谷町', t: 'resort', o: 'hilton-direct' },
  { n: 'ヒルトン沖縄瀬底リゾート', s: 'ヒルトン沖縄瀬底', b: 'hilton', r: 'kyushu', p: '沖縄県', c: '国頭郡本部町', t: 'resort', o: 'hilton-direct' },
  { n: 'ヒルトン沖縄宮古島リゾート', s: 'ヒルトン沖縄宮古島', b: 'hilton', r: 'kyushu', p: '沖縄県', c: '宮古島市', t: 'resort', o: 'hilton-direct' },
  { n: 'キャノピーbyヒルトン沖縄宮古島リゾート', s: 'キャノピー宮古島', b: 'canopy', r: 'kyushu', p: '沖縄県', c: '宮古島市', t: 'resort', o: 'hilton-direct' },
];

/* ---------- 開業予定（トグルで対象に含められる） ---------- */
const UPCOMING = [
  { n: 'カサラ・ニセコビレッジ, LXR Hotels & Resorts', s: 'カサラ ニセコ', b: 'lxr', r: 'hokkaido', p: '北海道', c: '虻田郡ニセコ町', t: 'resort', o: 'ytl', when: '開業予定' },
  { n: 'ヒルトン高山リゾート', s: 'ヒルトン高山', b: 'hilton', r: 'chubu', p: '岐阜県', c: '高山市', t: 'resort', o: 'unknown', when: '2026年9月' },
  { n: '雅叙園東京, LXR Hotels & Resorts', s: '雅叙園東京 LXR', b: 'lxr', r: 'kanto', p: '東京都', c: '目黒区', t: 'city', o: 'unknown', when: '2026年末' },
  { n: 'コンラッド横浜', s: 'コンラッド横浜', b: 'conrad', r: 'kanto', p: '神奈川県', c: '横浜市', t: 'city', o: 'unknown', when: '2027年春' },
  { n: 'ウォルドーフ・アストリア東京日本橋', s: 'WA 東京日本橋', b: 'waldorf', r: 'kanto', p: '東京都', c: '中央区', t: 'city', o: 'unknown', when: '2027年秋' },
  { n: 'LXR箱根強羅', s: 'LXR 箱根強羅', b: 'lxr', r: 'kanto', p: '神奈川県', c: '足柄下郡箱根町', t: 'resort', o: 'unknown', when: '2028年夏' },
  { n: 'Umiuta Hiroshima, LXR Hotels & Resorts', s: 'Umiuta 広島', b: 'lxr', r: 'chugoku', p: '広島県', c: '廿日市市', t: 'resort', o: 'unknown', when: '2028年' },
  { n: '京都ブライトンホテル, キュリオ・コレクション by ヒルトン', s: '京都ブライトン', b: 'curio', r: 'kinki', p: '京都府', c: '京都市上京区', t: 'city', o: 'unknown', when: '2028年冬' },
  { n: 'モットーbyヒルトン京都四条烏丸', s: 'モットー京都', b: 'motto', r: 'kinki', p: '京都府', c: '京都市', t: 'city', o: 'unknown', when: '2029年度' },
  { n: 'コンラッド神戸', s: 'コンラッド神戸', b: 'conrad', r: 'kinki', p: '兵庫県', c: '神戸市', t: 'city', o: 'unknown', when: '2030年' },
];
