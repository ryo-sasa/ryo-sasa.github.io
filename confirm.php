<?php
// confirm.php
// POSTで送信されていない場合は入力画面へリダイレクト
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: index.php");
    exit;
}

// XSS対策用関数
function h($str) {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>入力内容確認</title>
  <!-- Bootstrap CSS（CDN版） -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="container my-4">
  <h1 class="mb-4">入力内容確認</h1>
  <form action="submit.php" method="post">
    <!-- POSTされた全データをhiddenで引き継ぐ -->
    <?php
    foreach ($_POST as $key => $value) {
        if (is_array($value)) {
            foreach ($value as $val) {
                echo '<input type="hidden" name="' . h($key) . '[]" value="' . h($val) . '">' . "\n";
            }
        } else {
            echo '<input type="hidden" name="' . h($key) . '" value="' . h($value) . '">' . "\n";
        }
    }
    ?>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>項目</th>
          <th>入力内容</th>
        </tr>
      </thead>
      <tbody>
        <!-- 【あなたについて】 -->
        <tr>
          <td>氏名(漢字)</td>
          <td><?php echo h($_POST['name_1'] ?? '') . ' ' . h($_POST['name_2'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>氏名(カナ)</td>
          <td><?php echo h($_POST['name_1_kana'] ?? '') . ' ' . h($_POST['name_2_kana'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>性別</td>
          <td><?php echo h($_POST['sex'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>生年月日</td>
          <td><?php echo h($_POST['birthday'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>郵便番号</td>
          <td><?php echo h($_POST['address_num'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>住所</td>
          <td><?php echo h($_POST['address_str'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>建物名</td>
          <td><?php echo h($_POST['address_str_building'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>電話番号(自宅)</td>
          <td><?php echo h($_POST['tel_home'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>電話番号(携帯)</td>
          <td><?php echo h($_POST['tel_mobile'] ?? ''); ?></td>
        </tr>
        <!-- 【大学について】 -->
        <tr>
          <td>大学</td>
          <td><?php echo h($_POST['daigaku'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>学部</td>
          <td><?php echo h($_POST['gakubu'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>学科</td>
          <td><?php echo h($_POST['gakka'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>大学入学月日</td>
          <td><?php echo h($_POST['enter_univ'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>大学受験区分</td>
          <td><?php echo h($_POST['daigaku_juken_kubun'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>大学院</td>
          <td><?php echo h($_POST['daigakuin'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>研究科</td>
          <td><?php echo h($_POST['kenkyuuka'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>専攻</td>
          <td><?php echo h($_POST['senkou'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>学年</td>
          <td><?php echo h($_POST['school_year'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>所属している部活・サークル・団体</td>
          <td><?php echo h($_POST['daigaku_org'] ?? ''); ?></td>
        </tr>
        <!-- 【大学受験について】 -->
        <tr>
          <td>試験名</td>
          <td><?php echo h($_POST['exam_type'] ?? ''); ?></td>
        </tr>
        <?php
        // 動的に生成された得点入力フィールド（例: foreign_language_subject_1, foreign_language_score_1 など）
        foreach ($_POST as $key => $value) {
            if (preg_match('/^(foreign_language|japanese|math_1|math_2|social_studies|science_1|science_2|information)_(subject|score)_\d+$/', $key)) {
                echo '<tr><td>' . h($key) . '</td><td>' . h($value) . '</td></tr>';
            }
        }
        ?>
        <!-- 【二次試験について】 -->
        <?php
        foreach ($_POST as $key => $value) {
            if (preg_match('/^(main_subject|sub_subject|score_input)_\d+$/', $key)) {
                echo '<tr><td>' . h($key) . '</td><td>' . h($value) . '</td></tr>';
            }
        }
        ?>
        <!-- 【大学受験時の東進在籍歴】 -->
        <tr>
          <td>東進在籍歴</td>
          <td>
            <?php
            if (isset($_POST['daigaku_juken_toshin_zaisekireki'])) {
                echo implode(", ", array_map('h', $_POST['daigaku_juken_toshin_zaisekireki']));
            }
            ?>
          </td>
        </tr>
        <tr>
          <td>通学していた校舎名</td>
          <td><?php echo h($_POST['daigaku_juken_toshin_koushamei'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>東進以外の塾・予備校名</td>
          <td><?php echo h($_POST['daigaku_juken_toshin_igai_jukumei'] ?? ''); ?></td>
        </tr>
        <!-- 【中高について】 -->
        <tr>
          <td>高校（都道府県）</td>
          <td><?php echo h($_POST['koukou_pref'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>高校（区分）</td>
          <td><?php echo h($_POST['koukou_pref2'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>高校名</td>
          <td><?php echo h($_POST['koukou_name'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>中学　受験有無</td>
          <td><?php echo h($_POST['chugaku_juken_umu'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>中学校名</td>
          <td><?php echo h($_POST['chugaku_name'] ?? ''); ?></td>
        </tr>
        <!-- 【教務力判定テスト受験希望科目】 -->
        <tr>
          <td>第1解答科目</td>
          <td><?php echo h($_POST['answer_ability_test_subject_1'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>第2解答科目</td>
          <td><?php echo h($_POST['answer_ability_test_subject_2'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>第3解答科目</td>
          <td><?php echo h($_POST['answer_ability_test_subject_3'] ?? ''); ?></td>
        </tr>
        <!-- 【自己PRおよび紹介者】 -->
        <tr>
          <td>紹介者</td>
          <td><?php echo h($_POST['introducer'] ?? ''); ?></td>
        </tr>
        <tr>
          <td>自由記入欄</td>
          <td><?php echo nl2br(h($_POST['memo'] ?? '')); ?></td>
        </tr>
      </tbody>
    </table>
    <div class="d-flex justify-content-between mt-4">
      <!-- 「修正する」ボタンはJavaScriptのhistory.back()で前画面に戻ります -->
      <button type="button" class="btn btn-secondary" onclick="history.back()">修正する</button>
      <!-- 最終送信先（例: submit.php）へPOSTデータを送信 -->
      <button type="submit" class="btn btn-primary">送信する</button>
    </div>
  </form>
</div>
</body>
</html>
