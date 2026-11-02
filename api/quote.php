<?php
declare(strict_types=1);

/**
 * Handles email quote requests. Requires PHP hosting, a created company mailbox,
 * a configured outbound email service on the host and api/config.php.
 * PHP mail() handing off a message is not a guarantee of inbox delivery.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);
    echo json_encode(
        ['success' => $success, 'message' => $message],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'متد درخواست مجاز نیست.');
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    respond(503, false, 'سرویس ارسال ایمیل هنوز راه‌اندازی نشده است.');
}

$config = require $configFile;
$recipient = $config['to'] ?? '';
$sender = $config['from'] ?? '';
if (!filter_var($recipient, FILTER_VALIDATE_EMAIL) ||
    !filter_var($sender, FILTER_VALIDATE_EMAIL)) {
    respond(503, false, 'تنظیمات ایمیل سایت کامل نیست.');
}

// Simple bot trap. Humans won't see or complete this field.
if (!empty($_POST['website'])) {
    respond(200, true, 'درخواست شما دریافت شد.');
}

$labels = [
    'company' => 'نام شرکت',
    'person' => 'نام و نام خانوادگی',
    'phone' => 'شماره تماس',
    'whatsapp' => 'واتساپ',
    'email' => 'ایمیل مشتری',
    'origin' => 'مبدأ کالا',
    'destination' => 'مقصد',
    'commodity' => 'نوع کالا',
    'weight' => 'وزن ناخالص',
    'dimensions' => 'ابعاد',
    'volume' => 'حجم',
    'packages' => 'تعداد بسته',
    'ready' => 'زمان آماده بودن',
    'method' => 'روش حمل',
    'incoterm' => 'اینکوترمز',
    'pickup' => 'آدرس Pickup',
    'delivery' => 'آدرس تحویل',
    'notes' => 'توضیحات',
];

$values = [];
foreach ($labels as $key => $label) {
    $raw = $_POST[$key] ?? '';
    if (!is_string($raw)) respond(422, false, 'اطلاعات فرم نامعتبر است.');
    $raw = trim(str_replace(["\r", "\0"], ' ', $raw));
    if (strlen($raw) > 10000) respond(422, false, 'متن واردشده بیش از حد طولانی است.');
    $values[$key] = $raw;
}

foreach (['company', 'person', 'phone', 'origin', 'destination', 'commodity'] as $required) {
    if ($values[$required] === '') {
        respond(422, false, 'لطفاً تمام فیلدهای ضروری را تکمیل کنید.');
    }
}
if (strlen($values['phone']) > 30 || strlen($values['phone']) < 6) {
    respond(422, false, 'شماره تماس معتبر وارد کنید.');
}
if ($values['email'] !== '' && !filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
    respond(422, false, 'ایمیل واردشده معتبر نیست.');
}

// Lightweight rate limit: one request per 30 seconds from the same IP.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/avento_quote_' . hash('sha256', $ip);
$now = time();
if (is_file($rateFile) && $now - (int) @file_get_contents($rateFile) < 30) {
    respond(429, false, 'برای ارسال درخواست جدید کمی بعد تلاش کنید.');
}

$conditions = [
    'danger' => 'کالای خطرناک',
    'battery' => 'باتری',
    'chemical' => 'مواد شیمیایی',
    'oversized' => 'بار فوق سنگین / Oversized',
    'insurance' => 'نیاز به بیمه',
    'clearance' => 'هماهنگی ترخیص',
];
$selectedConditions = [];
foreach ($conditions as $name => $label) {
    if (isset($_POST[$name])) $selectedConditions[] = $label;
}

$lines = [
    'استعلام جدید حمل بین‌المللی - Avento Logistics',
    'تاریخ ثبت: ' . date('Y-m-d H:i:s T'),
    '----------------------------------------',
];
foreach ($labels as $key => $label) {
    $lines[] = $label . ': ' . ($values[$key] === '' ? '—' : $values[$key]);
}
$lines[] = 'شرایط ویژه: ' . ($selectedConditions ? implode('، ', $selectedConditions) : 'موردی انتخاب نشده');

$subject = 'Avento Logistics | Freight Quote Request';
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Avento Logistics <' . $sender . '>',
];
if ($values['email'] !== '') {
    $headers[] = 'Reply-To: ' . $values['email'];
}
$sent = @mail($recipient, $subject, implode("\n", $lines), implode("\r\n", $headers));
if (!$sent) {
    respond(503, false, 'ارسال ایمیل انجام نشد. لطفاً بعداً تلاش کنید یا تماس بگیرید.');
}
@file_put_contents($rateFile, (string)$now, LOCK_EX);
respond(200, true, 'درخواست شما دریافت شد. کارشناسان ما جهت بررسی شرایط حمل با شما تماس خواهند گرفت.');
