<?php
header('Content-Type: application/json');

$response = [];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    $response['status'] = 'error';
    $response['message'] = 'POSTメソッドでリクエストしてください。';
    echo json_encode($response);
    exit;
}

$url = isset($_POST['url']) ? trim($_POST['url']) : '';
if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400); // Bad Request
    $response['status'] = 'error';
    $response['message'] = '有効なURLが指定されていません。';
    echo json_encode($response);
    exit;
}

// URLからコンテンツを取得
$context = stream_context_create(['http' => ['ignore_errors' => true]]);
$jsonContent = @file_get_contents($url, false, $context);

if ($jsonContent === false) {
    http_response_code(500);
    $response['status'] = 'error';
    $response['message'] = 'URLへのアクセスに失敗しました。URLが正しいか確認してください。';
    echo json_encode($response);
    exit;
}

// Content-Typeヘッダーをチェック（より確実な方法）
$headers = get_headers($url, 1);
if (isset($headers['Content-Type']) && stripos($headers['Content-Type'], 'application/json') === false) {
    $response['status'] = 'error';
    $response['message'] = 'URLのアクセス先がJSONファイルではありませんでした。';
    echo json_encode($response);
    exit;
}

// JSONとして有効かチェック
json_decode($jsonContent);
if (json_last_error() !== JSON_ERROR_NONE) {
    $response['status'] = 'error';
    $response['message'] = 'URLでアクセスしたJSONファイルが正しい形式ではありませんでした。';
    echo json_encode($response);
    exit;
}

$response['status'] = 'success';
$response['data'] = $jsonContent;
echo json_encode($response);