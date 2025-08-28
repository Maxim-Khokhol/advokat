<?php
// ---- TELEGRAM CONFIG ----
const BOT_TOKEN = '8483758392:AAFBj4FeE2h83-5IbANQ7bBtsAfGtARn85A';
const CHAT_ID   = '992773494';

$ALLOWED_EXT  = ['jpg','jpeg','png','pdf','webp','doc','docx','ppt','pptx'];
$ALLOWED_MIME = [
  'image/jpeg','image/pjpeg','image/png','image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/octet-stream',
];
$MAX_FILES = 3;
$MAX_BYTES_PER_FILE = 50 * 1024 * 1024; // 50 MB

header('Content-Type: application/json; charset=utf-8');

// ----- ТЕКСТ -----
$first = trim($_POST['firstName'] ?? '');
$last  = trim($_POST['lastName']  ?? '');
$mid   = trim($_POST['middleName']?? '');
$city  = trim($_POST['city']      ?? '');
$phone = trim($_POST['tel']       ?? '');
$comm  = trim($_POST['comment']   ?? '');

$text = "Нова заявка з сайту\n"
      . "ПІБ: $last $first $mid\n"
      . "Телефон: $phone\n"
      . "Місто: " . ($city!==''?$city:'—') . "\n"
      . "Коментар: " . ($comm!==''?$comm:'—');

$ch = curl_init('https://api.telegram.org/bot'.BOT_TOKEN.'/sendMessage');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => ['chat_id'=>CHAT_ID, 'text'=>$text],
  CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
]);
$res = curl_exec($ch); curl_close($ch);
if ($res === false) { http_response_code(502); echo json_encode(['ok'=>false,'error'=>'tg_text_failed']); exit; }


if (isset($_FILES['files']) && is_array($_FILES['files']['name'])) {

  $cnt = 0;
  foreach ($_FILES['files']['error'] as $e) if ($e !== UPLOAD_ERR_NO_FILE) $cnt++;
  if ($cnt > $MAX_FILES) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'too_many_files']); exit; }

  $mapByExt = [
    'jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp','pdf'=>'application/pdf',
    'doc'=>'application/msword',
    'docx'=>'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt'=>'application/vnd.ms-powerpoint',
    'pptx'=>'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  for ($i=0; $i<count($_FILES['files']['name']); $i++) {
    if ($_FILES['files']['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
    if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'upload_error','index'=>$i]); exit; }

    $tmp  = $_FILES['files']['tmp_name'][$i];
    $name = $_FILES['files']['name'][$i];
    $size = $_FILES['files']['size'][$i];
    $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));

    if ($size > $MAX_BYTES_PER_FILE) { http_response_code(413); echo json_encode(['ok'=>false,'error'=>'too_large','index'=>$i]); exit; }
    if (!in_array($ext, $ALLOWED_EXT, true)) { http_response_code(415); echo json_encode(['ok'=>false,'error'=>'ext_not_allowed','ext'=>$ext]); exit; }

    $mime = 'application/octet-stream';
    if (class_exists('finfo')) {
      $fi = new finfo(FILEINFO_MIME_TYPE);
      $det = $fi->file($tmp);
      if ($det) $mime = $det;
    }
    if (!in_array($mime, $ALLOWED_MIME, true)) $mime = $mapByExt[$ext] ?? $mime;


    $c = curl_init('https://api.telegram.org/bot'.BOT_TOKEN.'/sendDocument');
    curl_setopt_array($c, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => ['chat_id'=>CHAT_ID, 'document'=>new CURLFile($tmp, $mime, $name)],
      CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60
    ]);
    $r = curl_exec($c); $http = curl_getinfo($c, CURLINFO_RESPONSE_CODE); curl_close($c);
    if ($r === false || $http < 200 || $http >= 300) { http_response_code(502); echo json_encode(['ok'=>false,'error'=>'tg_doc_failed','index'=>$i]); exit; }
  }
}

echo json_encode(['ok'=>true]);
