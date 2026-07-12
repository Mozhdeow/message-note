<?php

$allowed_origins = [
    "http://localhost:3001",
    "http://localhost:8000",
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$fourDays = 60 * 60 * 24 * 4;

ini_set("session.gc_maxlifetime", (string) $fourDays);

session_set_cookie_params([
    "lifetime" => $fourDays,
    "path" => "/",
    "domain" => "",
    "secure" => false,
    "httponly" => true,
    "samesite" => "Lax",
]);

session_start();

require_once "db.php";

function response_json($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function post_value($key, $default = "") {
    return isset($_POST[$key]) ? trim($_POST[$key]) : $default;
}

function get_value($key, $default = "") {
    return isset($_GET[$key]) ? trim($_GET[$key]) : $default;
}

function base_url() {
    $protocol = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off")
        ? "https"
        : "http";

    $host = $_SERVER["HTTP_HOST"];

    $scriptDir = str_replace("\\", "/", dirname($_SERVER["SCRIPT_NAME"]));

    if ($scriptDir === "/" || $scriptDir === ".") {
        $scriptDir = "";
    }

    return $protocol . "://" . $host . $scriptDir;
}

function avatar_url($avatar) {
    if (!$avatar) {
        return null;
    }

    if (strpos($avatar, "http://") === 0 || strpos($avatar, "https://") === 0) {
        return $avatar;
    }

    return base_url() . "/" . ltrim($avatar, "/");
}

function clean_user($user) {
    return [
        "id" => (int) $user["id"],
        "username" => $user["username"],
        "full_name" => $user["full_name"] ?? null,
        "email" => $user["email"],
        "avatar" => avatar_url($user["avatar"] ?? null),
        "role" => $user["role"] ?? "user",
        "status" => $user["status"] ?? "active",
        "isLoggedIn" => true,
    ];
}

$action = $_POST["action"] ?? $_GET["action"] ?? "";

if (!$action) {
    response_json([
        "success" => false,
        "message" => "Action is required."
    ], 400);
}

$public_get_actions = ["status"];

if ($_SERVER["REQUEST_METHOD"] !== "POST" && !in_array($action, $public_get_actions, true)) {
    response_json([
        "success" => false,
        "message" => "Only POST method is allowed for this action."
    ], 405);
}


if ($action === "setAuthForm") {
    $form = post_value("form", "login");

    setcookie("auth_form", $form, [
        "expires" => time() + 86400 * 7,
        "path" => "/",
        "domain" => "",
        "secure" => false,
        "httponly" => true,
        "samesite" => "Lax",
    ]);

    response_json(["success" => true]);
}

if ($action === "getAuthForm") {
    $form = $_COOKIE["auth_form"] ?? "login";

    response_json([
        "success" => true,
        "form" => $form
    ]);
}


if ($action === "register") {
    $username = post_value("username");
    $email = post_value("email");
    $password = post_value("password");
    $confirmPassword = post_value("confirmPassword");

    $errors = [];

    if ($username === "") {
        $errors["username"] = "Username is required.";
    } elseif (strlen($username) < 3) {
        $errors["username"] = "Username must be at least 3 characters.";
    } elseif (!preg_match("/^[a-zA-Z0-9_]+$/", $username)) {
        $errors["username"] = "Username can only contain letters, numbers and underscore.";
    }

    if ($email === "") {
        $errors["email"] = "Email is required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors["email"] = "Please enter a valid email address.";
    }

    if ($password === "") {
        $errors["password"] = "Password is required.";
    } elseif (strlen($password) < 6) {
        $errors["password"] = "Password must be at least 6 characters.";
    }

    if ($confirmPassword === "") {
        $errors["confirmPassword"] = "Please confirm your password.";
    } elseif ($password !== $confirmPassword) {
        $errors["confirmPassword"] = "Passwords do not match.";
    }

    if (!empty($errors)) {
        response_json([
            "success" => false,
            "errors" => $errors
        ], 422);
    }

    $stmt = $pdo->prepare("
        SELECT id, username, email
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
    ");

    $stmt->execute([$username, $email]);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        if ($existingUser["username"] === $username) {
            response_json([
                "success" => false,
                "errors" => [
                    "username" => "Username already exists."
                ]
            ], 409);
        }

        if ($existingUser["email"] === $email) {
            response_json([
                "success" => false,
                "errors" => [
                    "email" => "Email is already registered."
                ]
            ], 409);
        }
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO users (
            username,
            full_name,
            email,
            password_hash,
            avatar,
            role,
            status
        )
        VALUES (
            ?,
            NULL,
            ?,
            ?,
            NULL,
            'user',
            'active'
        )
    ");

    $created = $stmt->execute([
        $username,
        $email,
        $passwordHash
    ]);

    if (!$created) {
        response_json([
            "success" => false,
            "errors" => [
                "general" => "Database error during registration."
            ]
        ], 500);
    }

    $userId = (int) $pdo->lastInsertId();

    $_SESSION["user_id"] = $userId;
    $_SESSION["username"] = $username;
    $_SESSION["role"] = "user";

    response_json([
        "success" => true,
        "message" => "Account created successfully.",
        "user" => [
            "id" => $userId,
            "username" => $username,
            "full_name" => null,
            "email" => $email,
            "avatar" => null,
            "role" => "user",
            "status" => "active",
            "isLoggedIn" => true,
        ]
    ]);
}


if ($action === "login") {
    $username = post_value("username");
    $password = post_value("password");

    $errors = [];

    if ($username === "") {
        $errors["username"] = "Username is required.";
    }

    if ($password === "") {
        $errors["password"] = "Password is required.";
    }

    if (!empty($errors)) {
        response_json([
            "success" => false,
            "errors" => $errors
        ], 422);
    }

    $stmt = $pdo->prepare("
        SELECT
            id,
            username,
            full_name,
            email,
            password_hash,
            avatar,
            role,
            status
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
    ");

    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user["password_hash"])) {
        response_json([
            "success" => false,
            "errors" => [
                "general" => "Invalid username or password."
            ]
        ], 401);
    }

    if (($user["status"] ?? "active") !== "active") {
        response_json([
            "success" => false,
            "errors" => [
                "general" => "Your account is blocked."
            ]
        ], 403);
    }

    $_SESSION["user_id"] = $user["id"];
    $_SESSION["username"] = $user["username"];
    $_SESSION["role"] = $user["role"] ?? "user";

    response_json([
        "success" => true,
        "message" => "Login successful.",
        "user" => clean_user($user)
    ]);
}


if ($action === "status") {
    if (!isset($_SESSION["user_id"])) {
        response_json([
            "success" => true,
            "isLoggedIn" => false,
            "user" => null
        ]);
    }

    $userId = (int) $_SESSION["user_id"];

    $stmt = $pdo->prepare("
        SELECT
            id,
            username,
            full_name,
            email,
            avatar,
            role,
            status
        FROM users
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        session_destroy();

        response_json([
            "success" => true,
            "isLoggedIn" => false,
            "user" => null
        ]);
    }

    response_json([
        "success" => true,
        "isLoggedIn" => true,
        "user" => clean_user($user)
    ]);
}


if ($action === "logout") {
    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();

        setcookie(session_name(), "", [
            "expires" => time() - 42000,
            "path" => $params["path"],
            "domain" => $params["domain"],
            "secure" => $params["secure"],
            "httponly" => $params["httponly"],
            "samesite" => "Lax",
        ]);
    }

    session_destroy();

    response_json([
        "success" => true,
        "message" => "Logged out successfully."
    ]);
}


if ($action === "update_profile") {
    if (!isset($_SESSION["user_id"])) {
        response_json([
            "success" => false,
            "message" => "You are not logged in."
        ], 401);
    }

    $userId = (int) $_SESSION["user_id"];

    $fullName = post_value("full_name");
    $username = post_value("username");
    $email = post_value("email");

    $errors = [];

    if ($username === "") {
        $errors["username"] = "Username is required.";
    } elseif (strlen($username) < 3) {
        $errors["username"] = "Username must be at least 3 characters.";
    } elseif (!preg_match("/^[a-zA-Z0-9_]+$/", $username)) {
        $errors["username"] = "Username can only contain letters, numbers and underscore.";
    }

    if ($email === "") {
        $errors["email"] = "Email is required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors["email"] = "Please enter a valid email address.";
    }

    if ($fullName !== "" && strlen($fullName) > 150) {
        $errors["full_name"] = "Full name is too long.";
    }

    if (!empty($errors)) {
        response_json([
            "success" => false,
            "errors" => $errors
        ], 422);
    }

    $stmt = $pdo->prepare("
        SELECT id, username, email
        FROM users
        WHERE (username = ? OR email = ?)
        AND id != ?
        LIMIT 1
    ");

    $stmt->execute([$username, $email, $userId]);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        if ($existingUser["username"] === $username) {
            response_json([
                "success" => false,
                "errors" => [
                    "username" => "Username already exists."
                ]
            ], 409);
        }

        if ($existingUser["email"] === $email) {
            response_json([
                "success" => false,
                "errors" => [
                    "email" => "Email is already registered."
                ]
            ], 409);
        }
    }

    $avatarPath = null;

    if (isset($_FILES["avatar"]) && $_FILES["avatar"]["error"] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES["avatar"]["error"] !== UPLOAD_ERR_OK) {
            response_json([
                "success" => false,
                "errors" => [
                    "avatar" => "Avatar upload failed."
                ]
            ], 422);
        }

        if ($_FILES["avatar"]["size"] > 2 * 1024 * 1024) {
            response_json([
                "success" => false,
                "errors" => [
                    "avatar" => "Avatar size must be less than 2MB."
                ]
            ], 422);
        }

        $tmpPath = $_FILES["avatar"]["tmp_name"];

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmpPath);

        $allowedTypes = [
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp",
            "image/gif" => "gif",
        ];

        if (!array_key_exists($mime, $allowedTypes)) {
            response_json([
                "success" => false,
                "errors" => [
                    "avatar" => "Only JPG, PNG, WEBP or GIF images are allowed."
                ]
            ], 422);
        }

        $uploadDir = __DIR__ . "/uploads/avatars";

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $extension = $allowedTypes[$mime];
        $fileName = "avatar_" . $userId . "_" . time() . "." . $extension;
        $targetPath = $uploadDir . "/" . $fileName;

        if (!move_uploaded_file($tmpPath, $targetPath)) {
            response_json([
                "success" => false,
                "errors" => [
                    "avatar" => "Could not save avatar."
                ]
            ], 500);
        }

        $avatarPath = "uploads/avatars/" . $fileName;
    }

    if ($avatarPath) {
        $stmt = $pdo->prepare("
            UPDATE users
            SET full_name = ?, username = ?, email = ?, avatar = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $fullName !== "" ? $fullName : null,
            $username,
            $email,
            $avatarPath,
            $userId
        ]);
    } else {
        $stmt = $pdo->prepare("
            UPDATE users
            SET full_name = ?, username = ?, email = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $fullName !== "" ? $fullName : null,
            $username,
            $email,
            $userId
        ]);
    }

    $_SESSION["username"] = $username;

    $stmt = $pdo->prepare("
        SELECT id, username, full_name, email, avatar, role, status
        FROM users
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch();

    response_json([
        "success" => true,
        "message" => "Profile updated successfully.",
        "user" => clean_user($updatedUser)
    ]);
}

if ($action === "dashboard_summary") {
    $userId = $_SESSION["user_id"] ?? $_SESSION["user"]["id"] ?? null;

    if (!$userId) {
        response_json([
            "success" => false,
            "message" => "You must be logged in."
        ], 401);
    }

    $userId = (int) $userId;

    try {

        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS total
            FROM playlists
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $createdPlaylists = (int) ($stmt->fetch(PDO::FETCH_ASSOC)["total"] ?? 0);


        $openedPlaylists = 0;

        try {
            $stmt = $pdo->prepare("
                SELECT COUNT(*) AS total
                FROM opened_playlists
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $openedPlaylists = (int) ($stmt->fetch(PDO::FETCH_ASSOC)["total"] ?? 0);
        } catch (Exception $e) {
            $openedPlaylists = 0;
        }


        $unreadNotifications = 0;

        try {
            $stmt = $pdo->prepare("
                SELECT COUNT(*) AS total
                FROM notifications
                WHERE user_id = ?
                AND is_read = 0
            ");
            $stmt->execute([$userId]);
            $unreadNotifications = (int) ($stmt->fetch(PDO::FETCH_ASSOC)["total"] ?? 0);
        } catch (Exception $e) {
            $unreadNotifications = 0;
        }


        $stmt = $pdo->prepare("
            SELECT
                id,
                title,
                cover_image,
                share_token,
                created_at,
                view_count
            FROM playlists
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 4
        ");
        $stmt->execute([$userId]);
        $latestPlaylists = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($latestPlaylists as &$playlist) {
            $playlist["id"] = (int) $playlist["id"];
            $playlist["view_count"] = (int) ($playlist["view_count"] ?? 0);

            if (!empty($playlist["cover_image"])) {
                $cover = $playlist["cover_image"];

                if (
                    strpos($cover, "http://") !== 0 &&
                    strpos($cover, "https://") !== 0
                ) {
                    $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off")
                        ? "https"
                        : "http";

                    $host = $_SERVER["HTTP_HOST"] ?? "localhost:8001";

                    $playlist["cover_image"] = $scheme . "://" . $host . "/" . ltrim($cover, "/");
                }
            }
        }

        response_json([
            "success" => true,
            "data" => [
                "stats" => [
                    "created_playlists" => $createdPlaylists,
                    "opened_playlists" => $openedPlaylists,
                    "unread_notifications" => $unreadNotifications,
                ],
                "latest_playlists" => $latestPlaylists,
            ]
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}



if ($action === "admin_dashboard_summary") {
    require_admin_user($pdo);

    try {
        $usersCount = 0;
        $playlistsCount = 0;
        $openTicketsCount = 0;
        $openedPlaylistsCount = 0;

        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS total
            FROM users
        ");
        $stmt->execute();
        $usersCount = (int) ($stmt->fetch(PDO::FETCH_ASSOC)["total"] ?? 0);

        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS total
            FROM playlists
        ");
        $stmt->execute();
        $playlistsCount = (int) ($stmt->fetch(PDO::FETCH_ASSOC)["total"] ?? 0);

        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE status = 'open'
        ");
        $stmt->execute();
        $openTicketsCount = (int) ($stmt->fetch(PDO::FETCH_ASSOC)["total"] ?? 0);

        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS total
            FROM opened_playlists
        ");
        $stmt->execute();
        $openedPlaylistsCount = (int) ($stmt->fetch(PDO::FETCH_ASSOC)["total"] ?? 0);

        $stmt = $pdo->prepare("
            SELECT
                t.id,
                t.subject,
                t.message,
                t.status,
                t.created_at,
                u.full_name AS user_name,
                u.email AS user_email
            FROM tickets t
            LEFT JOIN users u ON u.id = t.user_id
            WHERE t.status = 'open'
            ORDER BY t.created_at DESC, t.id DESC
            LIMIT 5
        ");
        $stmt->execute();
        $latestOpenTickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($latestOpenTickets as &$ticket) {
            $ticket["id"] = (int) $ticket["id"];
        }

        response_json([
            "success" => true,
            "data" => [
                "stats" => [
                    "users_count" => $usersCount,
                    "playlists_count" => $playlistsCount,
                    "open_tickets_count" => $openTicketsCount,
                    "opened_playlists_count" => $openedPlaylistsCount,
                ],
                "latest_open_tickets" => $latestOpenTickets,
            ]
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


function require_admin_user($pdo) {
    $user_id = $_SESSION["user_id"] ?? $_SESSION["user"]["id"] ?? null;

    if (!$user_id) {
        response_json([
            "success" => false,
            "message" => "You must be logged in."
        ], 401);
    }

    $stmt = $pdo->prepare("
        SELECT id, role, status
        FROM users
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user["role"] !== "admin") {
        response_json([
            "success" => false,
            "message" => "Admin access is required."
        ], 403);
    }

    if (($user["status"] ?? "active") !== "active") {
        response_json([
            "success" => false,
            "message" => "Your account is not active."
        ], 403);
    }

    return $user;
}



function require_admin_or_support_user($pdo) {
    $user_id = $_SESSION["user_id"] ?? $_SESSION["user"]["id"] ?? null;

    if (!$user_id) {
        response_json([
            "success" => false,
            "message" => "You must be logged in."
        ], 401);
    }

    $stmt = $pdo->prepare("
        SELECT id, full_name, username, email, avatar, role, status
        FROM users
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        response_json([
            "success" => false,
            "message" => "User not found."
        ], 404);
    }

    if (($user["status"] ?? "active") !== "active") {
        response_json([
            "success" => false,
            "message" => "Your account is not active."
        ], 403);
    }

    if (!in_array($user["role"], ["admin", "support"], true)) {
        response_json([
            "success" => false,
            "message" => "Panel access is required."
        ], 403);
    }

    return $user;
}

if ($action === "admin_me") {
    $user = require_admin_or_support_user($pdo);

    response_json([
        "success" => true,
        "user" => [
            "id" => (int) $user["id"],
            "full_name" => $user["full_name"],
            "username" => $user["username"],
            "email" => $user["email"],
            "avatar" => $user["avatar"],
            "role" => $user["role"],
            "status" => $user["status"],
        ]
    ]);
}


function upload_admin_avatar_or_null() {
    if (!isset($_FILES["avatar"]) || $_FILES["avatar"]["error"] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($_FILES["avatar"]["error"] !== UPLOAD_ERR_OK) {
        response_json([
            "success" => false,
            "message" => "Avatar upload failed."
        ], 422);
    }

    $allowedTypes = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
    ];

    $mime = mime_content_type($_FILES["avatar"]["tmp_name"]);

    if (!isset($allowedTypes[$mime])) {
        response_json([
            "success" => false,
            "message" => "Only JPG, PNG and WebP images are allowed."
        ], 422);
    }

    $uploadDir = __DIR__ . "/uploads/avatars";

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $extension = $allowedTypes[$mime];
    $filename = "avatar_" . time() . "_" . bin2hex(random_bytes(8)) . "." . $extension;
    $targetPath = $uploadDir . "/" . $filename;

    if (!move_uploaded_file($_FILES["avatar"]["tmp_name"], $targetPath)) {
        response_json([
            "success" => false,
            "message" => "Could not save avatar."
        ], 500);
    }

    return "uploads/avatars/" . $filename;
}


if ($action === "admin_get_users") {
    require_admin_user($pdo);

    try {
        $stmt = $pdo->prepare("
            SELECT
                u.id,
                u.full_name AS name,
                u.full_name,
                u.username,
                u.email,
                u.avatar,
                u.role,
                u.status,
                CASE WHEN u.status = 'active' THEN 1 ELSE 0 END AS is_active,
                u.created_at,
                u.updated_at,

                (
                    SELECT COUNT(*)
                    FROM playlists p
                    WHERE p.user_id = u.id
                ) AS playlists_count,

                (
                    SELECT COUNT(*)
                    FROM opened_playlists op
                    WHERE op.user_id = u.id
                ) AS opened_playlists_count

            FROM users u
            ORDER BY u.id DESC
        ");

        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($users as &$user) {
            $user["id"] = (int) $user["id"];
            $user["is_active"] = (int) $user["is_active"];
            $user["playlists_count"] = (int) $user["playlists_count"];
            $user["opened_playlists_count"] = (int) $user["opened_playlists_count"];
        }

        response_json([
            "success" => true,
            "users" => $users
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


if ($action === "admin_create_user") {
    require_admin_user($pdo);

    $name = trim($_POST["name"] ?? "");
    $username = trim($_POST["username"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $password = trim($_POST["password"] ?? "");
    $role = trim($_POST["role"] ?? "user");
    $is_active = (int) ($_POST["is_active"] ?? 1);

    $status = $is_active === 1 ? "active" : "inactive";

    $allowedRoles = ["user", "support", "admin"];

    if ($name === "") {
        response_json([
            "success" => false,
            "message" => "Name is required."
        ], 422);
    }

    if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        response_json([
            "success" => false,
            "message" => "Valid email is required."
        ], 422);
    }

    if ($password === "") {
        response_json([
            "success" => false,
            "message" => "Password is required."
        ], 422);
    }

    if (!in_array($role, $allowedRoles, true)) {
        response_json([
            "success" => false,
            "message" => "Invalid role."
        ], 422);
    }

    try {
        $check = $pdo->prepare("
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
        ");

        $check->execute([$email]);

        if ($check->fetch()) {
            response_json([
                "success" => false,
                "message" => "Email is already in use."
            ], 409);
        }

        if ($username !== "") {
            $usernameCheck = $pdo->prepare("
                SELECT id
                FROM users
                WHERE username = ?
                LIMIT 1
            ");

            $usernameCheck->execute([$username]);

            if ($usernameCheck->fetch()) {
                response_json([
                    "success" => false,
                    "message" => "Username is already in use."
                ], 409);
            }
        }

        $avatar = upload_admin_avatar_or_null();
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO users
                (username, full_name, email, password_hash, avatar, role, status, created_at, updated_at)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $username ?: null,
            $name,
            $email,
            $passwordHash,
            $avatar,
            $role,
            $status
        ]);

        response_json([
            "success" => true,
            "message" => "User created successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}

if ($action === "admin_update_user") {
    require_admin_user($pdo);

    $id = (int) ($_POST["id"] ?? 0);
    $name = trim($_POST["name"] ?? "");
    $username = trim($_POST["username"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $password = trim($_POST["password"] ?? "");
    $role = trim($_POST["role"] ?? "user");
    $is_active = (int) ($_POST["is_active"] ?? 1);

    $status = $is_active === 1 ? "active" : "inactive";

    $allowedRoles = ["user", "support", "admin"];

    if ($id <= 0) {
        response_json([
            "success" => false,
            "message" => "Invalid user id."
        ], 422);
    }

    if ($name === "") {
        response_json([
            "success" => false,
            "message" => "Name is required."
        ], 422);
    }

    if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        response_json([
            "success" => false,
            "message" => "Valid email is required."
        ], 422);
    }

    if (!in_array($role, $allowedRoles, true)) {
        response_json([
            "success" => false,
            "message" => "Invalid role."
        ], 422);
    }

    try {
        $check = $pdo->prepare("
            SELECT id
            FROM users
            WHERE email = ? AND id != ?
            LIMIT 1
        ");

        $check->execute([$email, $id]);

        if ($check->fetch()) {
            response_json([
                "success" => false,
                "message" => "Email is already in use."
            ], 409);
        }

        if ($username !== "") {
            $usernameCheck = $pdo->prepare("
                SELECT id
                FROM users
                WHERE username = ? AND id != ?
                LIMIT 1
            ");

            $usernameCheck->execute([$username, $id]);

            if ($usernameCheck->fetch()) {
                response_json([
                    "success" => false,
                    "message" => "Username is already in use."
                ], 409);
            }
        }

        $avatar = upload_admin_avatar_or_null();

        $fields = [
            "full_name = ?",
            "username = ?",
            "email = ?",
            "role = ?",
            "status = ?",
            "updated_at = NOW()"
        ];

        $values = [
            $name,
            $username ?: null,
            $email,
            $role,
            $status
        ];

        if ($password !== "") {
            $fields[] = "password_hash = ?";
            $values[] = password_hash($password, PASSWORD_DEFAULT);
        }

        if ($avatar) {
            $fields[] = "avatar = ?";
            $values[] = $avatar;
        }

        $values[] = $id;

        $sql = "
            UPDATE users
            SET " . implode(", ", $fields) . "
            WHERE id = ?
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        response_json([
            "success" => true,
            "message" => "User updated successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}




if ($action === "admin_get_playlists") {
     require_admin_or_support_user($pdo);

    try {
        $stmt = $pdo->prepare("
            SELECT
                p.id,
                p.user_id,
                p.title,
                p.receiver_name,
                p.receiver_message,
                p.cover_image,
                p.share_token,
                p.is_active,
                p.view_count,
                p.created_at,
                p.updated_at,

                u.full_name AS owner_name,
                u.email AS owner_email,

                (
                    SELECT COUNT(*)
                    FROM categories c
                    WHERE c.playlist_id = p.id
                ) AS categories_count,

                (
                    SELECT COUNT(*)
                    FROM playlist_tracks pt
                    WHERE pt.playlist_id = p.id AND pt.is_main = 0
                ) AS tracks_count,

                EXISTS (
                    SELECT 1
                    FROM playlist_tracks mt
                    WHERE mt.playlist_id = p.id AND mt.is_main = 1
                    LIMIT 1
                ) AS has_main_track

            FROM playlists p
            LEFT JOIN users u ON u.id = p.user_id
            ORDER BY p.id DESC
        ");

        $stmt->execute();
        $playlists = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($playlists as &$playlist) {
            $playlist["id"] = (int) $playlist["id"];
            $playlist["user_id"] = (int) $playlist["user_id"];
            $playlist["is_active"] = (int) $playlist["is_active"];
            $playlist["view_count"] = (int) ($playlist["view_count"] ?? 0);
            $playlist["categories_count"] = (int) $playlist["categories_count"];
            $playlist["tracks_count"] = (int) $playlist["tracks_count"];
            $playlist["has_main_track"] = (bool) $playlist["has_main_track"];
        }

        response_json([
            "success" => true,
            "playlists" => $playlists
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


function upload_admin_playlist_cover_or_null() {
    if (!isset($_FILES["cover_image"]) || $_FILES["cover_image"]["error"] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($_FILES["cover_image"]["error"] !== UPLOAD_ERR_OK) {
        response_json([
            "success" => false,
            "message" => "Cover upload failed."
        ], 422);
    }

    $allowedTypes = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
    ];

    $mime = mime_content_type($_FILES["cover_image"]["tmp_name"]);

    if (!isset($allowedTypes[$mime])) {
        response_json([
            "success" => false,
            "message" => "Only JPG, PNG and WebP images are allowed."
        ], 422);
    }

    $uploadDir = __DIR__ . "/uploads/playlist_covers";

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $extension = $allowedTypes[$mime];
    $filename = "playlist_cover_" . time() . "_" . bin2hex(random_bytes(8)) . "." . $extension;
    $targetPath = $uploadDir . "/" . $filename;

    if (!move_uploaded_file($_FILES["cover_image"]["tmp_name"], $targetPath)) {
        response_json([
            "success" => false,
            "message" => "Could not save cover image."
        ], 500);
    }

    return "uploads/playlist_covers/" . $filename;
}


if ($action === "admin_update_playlist") {
   require_admin_or_support_user($pdo);

    $id = (int) ($_POST["id"] ?? 0);
    $title = trim($_POST["title"] ?? "");
    $receiver_name = trim($_POST["receiver_name"] ?? "");
    $receiver_message = trim($_POST["receiver_message"] ?? "");
    $access_password = trim($_POST["access_password"] ?? "");
    $is_active = (int) ($_POST["is_active"] ?? 1);

    if ($id <= 0) {
        response_json([
            "success" => false,
            "message" => "Invalid playlist id."
        ], 422);
    }

    if ($title === "") {
        response_json([
            "success" => false,
            "message" => "Playlist title is required."
        ], 422);
    }

    try {
        $check = $pdo->prepare("
            SELECT id
            FROM playlists
            WHERE id = ?
            LIMIT 1
        ");

        $check->execute([$id]);

        if (!$check->fetch(PDO::FETCH_ASSOC)) {
            response_json([
                "success" => false,
                "message" => "Playlist not found."
            ], 404);
        }

        $cover = upload_admin_playlist_cover_or_null();

        $fields = [
            "title = ?",
            "receiver_name = ?",
            "receiver_message = ?",
            "is_active = ?",
            "updated_at = NOW()"
        ];

        $values = [
            $title,
            $receiver_name ?: null,
            $receiver_message ?: null,
            $is_active
        ];

        if ($access_password !== "") {
            $fields[] = "access_password = ?";
            $values[] = password_hash($access_password, PASSWORD_DEFAULT);
        }

        if ($cover) {
            $fields[] = "cover_image = ?";
            $values[] = $cover;
        }

        $values[] = $id;

        $sql = "
            UPDATE playlists
            SET " . implode(", ", $fields) . "
            WHERE id = ?
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        response_json([
            "success" => true,
            "message" => "Playlist updated successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


if ($action === "admin_delete_playlist") {
     require_admin_or_support_user($pdo);

    $id = (int) ($_POST["id"] ?? 0);

    if ($id <= 0) {
        response_json([
            "success" => false,
            "message" => "Invalid playlist id."
        ], 422);
    }

    try {
        $stmt = $pdo->prepare("
            DELETE FROM playlists
            WHERE id = ?
        ");

        $stmt->execute([$id]);

        response_json([
            "success" => true,
            "message" => "Playlist deleted successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


if ($action === "admin_get_opened_playlists") {
    require_admin_or_support_user($pdo);

    try {
        $stmt = $pdo->prepare("
            SELECT
                op.id,
                op.user_id,
                op.playlist_id,
                op.opened_at,

                opener.full_name AS opener_name,
                opener.username AS opener_username,
                opener.email AS opener_email,
                opener.avatar AS opener_avatar,

                p.title AS playlist_title,
                p.receiver_name,
                p.receiver_message,
                p.cover_image,
                p.share_token,

                owner.full_name AS owner_name,
                owner.email AS owner_email,

                (
                    SELECT COUNT(*)
                    FROM categories c
                    WHERE c.playlist_id = p.id
                ) AS categories_count,

                (
                    SELECT COUNT(*)
                    FROM playlist_tracks pt
                    WHERE pt.playlist_id = p.id AND pt.is_main = 0
                ) AS tracks_count,

                EXISTS (
                    SELECT 1
                    FROM playlist_tracks mt
                    WHERE mt.playlist_id = p.id AND mt.is_main = 1
                    LIMIT 1
                ) AS has_main_track

            FROM opened_playlists op
            INNER JOIN users opener ON opener.id = op.user_id
            INNER JOIN playlists p ON p.id = op.playlist_id
            LEFT JOIN users owner ON owner.id = p.user_id
            ORDER BY op.opened_at DESC
        ");

        $stmt->execute();
        $openedPlaylists = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($openedPlaylists as &$item) {
            $item["id"] = (int) $item["id"];
            $item["user_id"] = (int) $item["user_id"];
            $item["playlist_id"] = (int) $item["playlist_id"];
            $item["categories_count"] = (int) $item["categories_count"];
            $item["tracks_count"] = (int) $item["tracks_count"];
            $item["has_main_track"] = (bool) $item["has_main_track"];
        }

        response_json([
            "success" => true,
            "opened_playlists" => $openedPlaylists
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


if ($action === "admin_delete_opened_playlist") {
    require_admin_user($pdo);

    $id = (int) ($_POST["id"] ?? 0);

    if ($id <= 0) {
        response_json([
            "success" => false,
            "message" => "Invalid opened playlist record id."
        ], 422);
    }

    try {
        $stmt = $pdo->prepare("
            DELETE FROM opened_playlists
            WHERE id = ?
        ");

        $stmt->execute([$id]);

        response_json([
            "success" => true,
            "message" => "Opened playlist record deleted successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}



if ($action === "admin_get_playlist_preview") {
    require_admin_or_support_user($pdo);

    $token = trim($_POST["token"] ?? "");

    if ($token === "") {
        response_json([
            "success" => false,
            "message" => "Playlist token is required."
        ], 422);
    }

    try {
        $stmt = $pdo->prepare("
            SELECT
                id,
                user_id,
                title,
                receiver_name,
                receiver_message,
                cover_image,
                share_token,
                created_at
            FROM playlists
            WHERE share_token = ?
            LIMIT 1
        ");

        $stmt->execute([$token]);
        $playlist = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$playlist) {
            response_json([
                "success" => false,
                "message" => "Playlist not found."
            ], 404);
        }

        $playlistId = (int) $playlist["id"];

        $stmt = $pdo->prepare("
            SELECT
                id,
                track_name,
                artist_name,
                album_name,
                file_url,
                cover_image,
                lyrics,
                description,
                duration
            FROM playlist_tracks
            WHERE playlist_id = ?
            AND is_main = 1
            LIMIT 1
        ");

        $stmt->execute([$playlistId]);
        $mainTrack = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("
            SELECT
                id,
                name,
                description,
                sort_order
            FROM categories
            WHERE playlist_id = ?
            ORDER BY sort_order ASC, id ASC
        ");

        $stmt->execute([$playlistId]);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("
            SELECT
                id,
                category_id,
                track_name,
                artist_name,
                album_name,
                file_url,
                cover_image,
                lyrics,
                description,
                duration,
                sort_order
            FROM playlist_tracks
            WHERE playlist_id = ?
            AND is_main = 0
            ORDER BY sort_order ASC, id ASC
        ");

        $stmt->execute([$playlistId]);
        $tracks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!function_exists("admin_media_url_or_null")) {
            function admin_media_url_or_null($path) {
                if (!$path) return null;

                if (strpos($path, "http://") === 0 || strpos($path, "https://") === 0) {
                    return $path;
                }

                return base_url() . "/" . ltrim($path, "/");
            }
        }

        $formattedMainTrack = null;

        if ($mainTrack) {
            $formattedMainTrack = [
                "id" => (int) $mainTrack["id"],
                "title" => $mainTrack["track_name"],
                "track_name" => $mainTrack["track_name"],
                "artist" => $mainTrack["artist_name"],
                "artist_name" => $mainTrack["artist_name"],
                "album" => $mainTrack["album_name"],
                "album_name" => $mainTrack["album_name"],
                "file_url" => admin_media_url_or_null($mainTrack["file_url"]),
                "cover_image" => admin_media_url_or_null($mainTrack["cover_image"]),
                "lyrics" => $mainTrack["lyrics"],
                "description" => $mainTrack["description"],
                "duration" => (int) $mainTrack["duration"],
            ];
        }

        $tracksByCategory = [];

        foreach ($tracks as $track) {
            $categoryId = (int) $track["category_id"];

            if (!isset($tracksByCategory[$categoryId])) {
                $tracksByCategory[$categoryId] = [];
            }

            $tracksByCategory[$categoryId][] = [
                "id" => (int) $track["id"],
                "category_id" => $categoryId,
                "title" => $track["track_name"],
                "track_name" => $track["track_name"],
                "artist" => $track["artist_name"],
                "artist_name" => $track["artist_name"],
                "album" => $track["album_name"],
                "album_name" => $track["album_name"],
                "file_url" => admin_media_url_or_null($track["file_url"]),
                "cover_image" => admin_media_url_or_null($track["cover_image"]),
                "lyrics" => $track["lyrics"],
                "description" => $track["description"],
                "duration" => (int) $track["duration"],
            ];
        }

        $formattedCategories = [];

        foreach ($categories as $category) {
            $categoryId = (int) $category["id"];

            $formattedCategories[] = [
                "id" => $categoryId,
                "name" => $category["name"],
                "description" => $category["description"],
                "sort_order" => (int) $category["sort_order"],
                "tracks" => $tracksByCategory[$categoryId] ?? [],
            ];
        }

        response_json([
            "success" => true,
            "playlist" => [
                "id" => $playlistId,
                "title" => $playlist["title"],
                "receiver_name" => $playlist["receiver_name"],
                "receiver_message" => $playlist["receiver_message"],
                "cover_image" => admin_media_url_or_null($playlist["cover_image"]),
                "share_token" => $playlist["share_token"],
                "created_at" => $playlist["created_at"],
                "main_track" => $formattedMainTrack,
                "categories" => $formattedCategories,
            ],
            "main_track" => $formattedMainTrack,
            "categories" => $formattedCategories
        ]);

    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}




if ($action === "admin_get_tickets") {
    require_admin_or_support_user($pdo);

    try {
        $stmt = $pdo->prepare("
            SELECT
                t.id,
                t.user_id,
                t.subject,
                t.message,
                t.admin_answer,
                t.answered_by,
                t.answered_at,
                t.status,
                t.closed_at,
                t.created_at,
                t.updated_at,

                u.full_name AS user_name,
                u.username,
                u.email AS user_email,
                u.avatar AS user_avatar,

                admin.full_name AS answered_by_name

            FROM tickets t
            LEFT JOIN users u ON u.id = t.user_id
            LEFT JOIN users admin ON admin.id = t.answered_by
            ORDER BY
                CASE
                    WHEN t.status = 'open' THEN 1
                    WHEN t.status = 'answered' THEN 2
                    WHEN t.status = 'closed' THEN 3
                    ELSE 4
                END ASC,
                t.created_at DESC
        ");

        $stmt->execute();
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tickets as &$ticket) {
            $ticket["id"] = (int) $ticket["id"];
            $ticket["user_id"] = (int) $ticket["user_id"];
            $ticket["answered_by"] = $ticket["answered_by"] ? (int) $ticket["answered_by"] : null;
        }

        response_json([
            "success" => true,
            "tickets" => $tickets
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


if ($action === "admin_answer_ticket") {
    $admin = require_admin_or_support_user($pdo);

    $id = (int) ($_POST["id"] ?? 0);
    $answer = trim($_POST["answer"] ?? "");

    if ($id <= 0) {
        response_json([
            "success" => false,
            "message" => "Invalid ticket id."
        ], 422);
    }

    if ($answer === "") {
        response_json([
            "success" => false,
            "message" => "Answer text is required."
        ], 422);
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id, status
            FROM tickets
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$id]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            response_json([
                "success" => false,
                "message" => "Ticket not found."
            ], 404);
        }

        if ($ticket["status"] === "closed") {
            response_json([
                "success" => false,
                "message" => "Closed tickets cannot be answered."
            ], 422);
        }

        $adminId = (int) $admin["id"];

        $stmt = $pdo->prepare("
            UPDATE tickets
            SET
                admin_answer = ?,
                answered_by = ?,
                answered_at = NOW(),
                status = 'answered',
                updated_at = NOW()
            WHERE id = ?
        ");

        $stmt->execute([
            $answer,
            $adminId,
            $id
        ]);

        response_json([
            "success" => true,
            "message" => "Ticket answered successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


if ($action === "admin_close_ticket") {
    require_admin_or_support_user($pdo);

    $id = (int) ($_POST["id"] ?? 0);

    if ($id <= 0) {
        response_json([
            "success" => false,
            "message" => "Invalid ticket id."
        ], 422);
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id
            FROM tickets
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$id]);

        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            response_json([
                "success" => false,
                "message" => "Ticket not found."
            ], 404);
        }

        $stmt = $pdo->prepare("
            UPDATE tickets
            SET
                status = 'closed',
                closed_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
        ");

        $stmt->execute([$id]);

        response_json([
            "success" => true,
            "message" => "Ticket closed successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}



if ($action === "get_my_tickets") {
    $user_id = $_SESSION["user_id"] ?? $_SESSION["user"]["id"] ?? null;

    if (!$user_id) {
        response_json([
            "success" => false,
            "message" => "You must be logged in."
        ], 401);
    }

    try {
        $stmt = $pdo->prepare("
            SELECT
                t.id,
                t.subject,
                t.message,
                t.admin_answer,
                t.status,
                t.answered_at,
                t.closed_at,
                t.created_at,
                t.updated_at,
                admin.full_name AS answered_by_name
            FROM tickets t
            LEFT JOIN users admin ON admin.id = t.answered_by
            WHERE t.user_id = ?
            ORDER BY
                CASE
                    WHEN t.status = 'open' THEN 1
                    WHEN t.status = 'answered' THEN 2
                    WHEN t.status = 'closed' THEN 3
                    ELSE 4
                END ASC,
                t.created_at DESC
        ");

        $stmt->execute([$user_id]);
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tickets as &$ticket) {
            $ticket["id"] = (int) $ticket["id"];
        }

        response_json([
            "success" => true,
            "tickets" => $tickets
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}


if ($action === "create_ticket") {
    $user_id = $_SESSION["user_id"] ?? $_SESSION["user"]["id"] ?? null;

    if (!$user_id) {
        response_json([
            "success" => false,
            "message" => "You must be logged in."
        ], 401);
    }

    $subject = trim($_POST["subject"] ?? "");
    $message = trim($_POST["message"] ?? "");

    if ($message === "") {
        response_json([
            "success" => false,
            "message" => "Message is required."
        ], 422);
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO tickets
                (user_id, subject, message, status, created_at, updated_at)
            VALUES
                (?, ?, ?, 'open', NOW(), NOW())
        ");

        $stmt->execute([
            $user_id,
            $subject ?: null,
            $message
        ]);

        response_json([
            "success" => true,
            "message" => "Ticket created successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}



if ($action === "close_my_ticket") {
    $user_id = $_SESSION["user_id"] ?? $_SESSION["user"]["id"] ?? null;

    if (!$user_id) {
        response_json([
            "success" => false,
            "message" => "You must be logged in."
        ], 401);
    }

    $id = (int) ($_POST["id"] ?? 0);

    if ($id <= 0) {
        response_json([
            "success" => false,
            "message" => "Invalid ticket id."
        ], 422);
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id, status
            FROM tickets
            WHERE id = ? AND user_id = ?
            LIMIT 1
        ");

        $stmt->execute([$id, $user_id]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            response_json([
                "success" => false,
                "message" => "Ticket not found."
            ], 404);
        }

        if ($ticket["status"] === "closed") {
            response_json([
                "success" => false,
                "message" => "Ticket is already closed."
            ], 422);
        }

        $stmt = $pdo->prepare("
            UPDATE tickets
            SET
                status = 'closed',
                closed_at = NOW(),
                updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ");

        $stmt->execute([$id, $user_id]);

        response_json([
            "success" => true,
            "message" => "Ticket closed successfully."
        ]);
    } catch (Exception $e) {
        response_json([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ], 500);
    }
}




// ---------------------------------------------------------
// منطق ساخت پلی‌لیست شخصی (Create Playlist)
// ---------------------------------------------------------
if ($action === "create_playlist") {
    if (!isset($_SESSION["user_id"])) {
        response_json([
            "success" => false,
            "message" => "You are not logged in."
        ], 401);
    }

    $user_id = (int) $_SESSION["user_id"];

    $title = post_value("title");
    $receiver_name = post_value("receiver_name");
    $receiver_message = post_value("receiver_message");
    $password = post_value("access_password");

    if ($title === "") {
        response_json([
            "success" => false,
            "message" => "Playlist title is required."
        ], 422);
    }

    if (strlen($password) < 4) {
        response_json([
            "success" => false,
            "message" => "Password must be at least 4 characters."
        ], 422);
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $share_token = bin2hex(random_bytes(6));

    $upload_dir = __DIR__ . "/uploads/";

    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    function save_uploaded_file($file, $prefix, $upload_dir) {
        if (!$file || !isset($file["error"]) || $file["error"] !== UPLOAD_ERR_OK) {
            return null;
        }

        $originalName = $file["name"] ?? "";
        $tmpName = $file["tmp_name"] ?? "";

        if (!$tmpName) {
            return null;
        }

        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if ($ext === "") {
            $ext = "bin";
        }

        $safeName = $prefix . "_" . uniqid() . "." . $ext;
        $targetPath = $upload_dir . $safeName;

        if (!move_uploaded_file($tmpName, $targetPath)) {
            return null;
        }

        return "uploads/" . $safeName;
    }

    try {
        $pdo->beginTransaction();

        $playlist_cover_path = null;

        if (isset($_FILES["cover_image"])) {
            $playlist_cover_path = save_uploaded_file(
                $_FILES["cover_image"],
                "playlist",
                $upload_dir
            );
        }

        $stmtPlaylist = $pdo->prepare("
            INSERT INTO playlists (
                user_id,
                title,
                receiver_name,
                receiver_message,
                cover_image,
                access_password,
                share_token
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stmtPlaylist->execute([
            $user_id,
            $title,
            $receiver_name,
            $receiver_message,
            $playlist_cover_path,
            $hashedPassword,
            $share_token
        ]);

        $playlist_id = (int) $pdo->lastInsertId();



        if (isset($_POST["main_track"]) && isset($_FILES["main_track"])) {
            $mainTrack = $_POST["main_track"];

            $main_file_url = null;
            $main_cover_url = null;

            if (isset($_FILES["main_track"]["name"]["file"])) {
                $main_file = [
                    "name" => $_FILES["main_track"]["name"]["file"],
                    "type" => $_FILES["main_track"]["type"]["file"],
                    "tmp_name" => $_FILES["main_track"]["tmp_name"]["file"],
                    "error" => $_FILES["main_track"]["error"]["file"],
                    "size" => $_FILES["main_track"]["size"]["file"],
                ];

                $main_file_url = save_uploaded_file($main_file, "main_track", $upload_dir);
            }

            if (isset($_FILES["main_track"]["name"]["cover_image"])) {
                $main_cover = [
                    "name" => $_FILES["main_track"]["name"]["cover_image"],
                    "type" => $_FILES["main_track"]["type"]["cover_image"],
                    "tmp_name" => $_FILES["main_track"]["tmp_name"]["cover_image"],
                    "error" => $_FILES["main_track"]["error"]["cover_image"],
                    "size" => $_FILES["main_track"]["size"]["cover_image"],
                ];

                $main_cover_url = save_uploaded_file($main_cover, "main_cover", $upload_dir);
            }

            $stmtMainTrack = $pdo->prepare("
                INSERT INTO playlist_tracks (
                    playlist_id,
                    category_id,
                    is_main,
                    track_name,
                    artist_name,
                    album_name,
                    file_url,
                    cover_image,
                    lyrics,
                    description,
                    duration,
                    sort_order
                )
                VALUES (?, NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            ");

            $stmtMainTrack->execute([
                $playlist_id,
                $mainTrack["track_name"] ?? "Main Music",
                $mainTrack["artist_name"] ?? "Unknown Artist",
                $mainTrack["album_name"] ?? "Unknown Album",
                $main_file_url,
                $main_cover_url,
                $mainTrack["lyrics"] ?? "",
                $mainTrack["description"] ?? "",
                isset($mainTrack["duration"]) ? (int) $mainTrack["duration"] : 0
            ]);
        }



        $categories = $_POST["categories"] ?? [];
        $categoryMap = [];

        $stmtCat = $pdo->prepare("
            INSERT INTO categories (
                playlist_id,
                name,
                description,
                sort_order
            )
            VALUES (?, ?, ?, ?)
        ");

        foreach ($categories as $index => $cat) {
            $stmtCat->execute([
                $playlist_id,
                $cat["name"] ?? "",
                $cat["description"] ?? "",
                isset($cat["sort_order"]) ? (int) $cat["sort_order"] : $index
            ]);

            $db_cat_id = (int) $pdo->lastInsertId();

            if (isset($cat["id"])) {
                $categoryMap[$cat["id"]] = $db_cat_id;
            }
        }


        $tracks = $_POST["tracks"] ?? [];

        $stmtTrack = $pdo->prepare("
            INSERT INTO playlist_tracks (
                playlist_id,
                category_id,
                is_main,
                track_name,
                artist_name,
                album_name,
                file_url,
                cover_image,
                lyrics,
                description,
                duration,
                sort_order
            )
            VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($tracks as $index => $track) {
            $frontEndCatId = $track["category_id"] ?? "";
            $dbCatId = $categoryMap[$frontEndCatId] ?? null;

            if (!$dbCatId) {
                continue;
            }

            $file_url = null;
            $track_cover_path = null;

            if (isset($_FILES["tracks"]["name"][$index]["file"])) {
                $track_file = [
                    "name" => $_FILES["tracks"]["name"][$index]["file"],
                    "type" => $_FILES["tracks"]["type"][$index]["file"],
                    "tmp_name" => $_FILES["tracks"]["tmp_name"][$index]["file"],
                    "error" => $_FILES["tracks"]["error"][$index]["file"],
                    "size" => $_FILES["tracks"]["size"][$index]["file"],
                ];

                $file_url = save_uploaded_file($track_file, "track", $upload_dir);
            }

            if (isset($_FILES["tracks"]["name"][$index]["cover_image"])) {
                $track_cover = [
                    "name" => $_FILES["tracks"]["name"][$index]["cover_image"],
                    "type" => $_FILES["tracks"]["type"][$index]["cover_image"],
                    "tmp_name" => $_FILES["tracks"]["tmp_name"][$index]["cover_image"],
                    "error" => $_FILES["tracks"]["error"][$index]["cover_image"],
                    "size" => $_FILES["tracks"]["size"][$index]["cover_image"],
                ];

                $track_cover_path = save_uploaded_file($track_cover, "track_cover", $upload_dir);
            }

            $stmtTrack->execute([
                $playlist_id,
                $dbCatId,
                $track["track_name"] ?? "",
                $track["artist_name"] ?? "",
                $track["album_name"] ?? "",
                $file_url,
                $track_cover_path,
                $track["lyrics"] ?? "",
                $track["description"] ?? "",
                isset($track["duration"]) ? (int) $track["duration"] : 0,
                isset($track["sort_order"]) ? (int) $track["sort_order"] : $index
            ]);
        }

        $pdo->commit();

        response_json([
            "success" => true,
            "message" => "Playlist created successfully.",
            "url" => "http://localhost:3001/playlist/" . $share_token,
            "token" => $share_token,
            "password" => $password,
            "playlist_id" => $playlist_id
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        response_json([
            "success" => false,
            "message" => "خطا در دیتابیس: " . $e->getMessage()
        ], 500);
    }
}






if ($action === "get_playlist_data") {
    $token = trim($_POST['token'] ?? $_GET['token'] ?? '');

    if ($token === '') {
        echo json_encode([
            "success" => false,
            "message" => "Invalid playlist token."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT
                id,
                title,
                receiver_name,
                receiver_message,
                cover_image,
                share_token
            FROM playlists
            WHERE share_token = ? AND is_active = 1
            LIMIT 1
        ");

        $stmt->execute([$token]);
        $playlist = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$playlist) {
            echo json_encode([
                "success" => false,
                "message" => "Playlist not found."
            ]);
            exit;
        }

        $stmtCat = $pdo->prepare("
            SELECT
                id,
                playlist_id,
                name,
                slug,
                description,
                sort_order
            FROM categories
            WHERE playlist_id = ?
            ORDER BY sort_order ASC, id ASC
        ");

        $stmtCat->execute([$playlist['id']]);
        $categories = $stmtCat->fetchAll(PDO::FETCH_ASSOC);

        $mainStmt = $pdo->prepare("
            SELECT
                id,
                playlist_id,
                category_id,
                is_main,
                track_name,
                artist_name,
                album_name,
                file_url,
                cover_image,
                lyrics,
                description,
                duration
            FROM playlist_tracks
            WHERE playlist_id = ? AND is_main = 1
            LIMIT 1
        ");

        $mainStmt->execute([$playlist['id']]);
        $mainTrack = $mainStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "playlist" => [
                "id" => (int) $playlist["id"],
                "title" => $playlist["title"],
                "receiver_name" => $playlist["receiver_name"],
                "receiver_message" => $playlist["receiver_message"],
                "cover_image" => $playlist["cover_image"],
                "share_token" => $playlist["share_token"],
                "main_track" => $mainTrack ?: null,
                "categories" => $categories
            ],
            "categories" => $categories,
            "main_track" => $mainTrack ?: null
        ]);
        exit;

    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ]);
        exit;
    }
}

if ($action === "get_my_playlists") {
    if (!isset($_SESSION["user_id"])) {
        response_json([
            "success" => false,
            "message" => "You are not logged in."
        ], 401);
    }

    $userId = (int) $_SESSION["user_id"];

    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.title,
            p.receiver_name,
            p.receiver_message,
            p.cover_image,
            p.share_token,
            p.created_at,

            (
                SELECT COUNT(*)
                FROM categories c
                WHERE c.playlist_id = p.id
            ) AS categories_count,

            (
                SELECT COUNT(*)
                FROM playlist_tracks pt
                WHERE pt.playlist_id = p.id
                AND pt.is_main = 0
            ) AS tracks_count,

            (
                SELECT COUNT(*)
                FROM playlist_tracks pt
                WHERE pt.playlist_id = p.id
                AND pt.is_main = 1
            ) AS main_tracks_count

        FROM playlists p
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    ");

    $stmt->execute([$userId]);
    $playlists = $stmt->fetchAll();

    $formatted = [];

    foreach ($playlists as $playlist) {
        $coverImage = $playlist["cover_image"];

        if ($coverImage && strpos($coverImage, "http://") !== 0 && strpos($coverImage, "https://") !== 0) {
            $coverImage = base_url() . "/" . ltrim($coverImage, "/");
        }

        $formatted[] = [
            "id" => (int) $playlist["id"],
            "title" => $playlist["title"],
            "receiver_name" => $playlist["receiver_name"],
            "receiver_message" => $playlist["receiver_message"],
            "cover_image" => $coverImage,
            "share_token" => $playlist["share_token"],
            "created_at" => $playlist["created_at"],
            "categories_count" => (int) $playlist["categories_count"],
            "tracks_count" => (int) $playlist["tracks_count"],
            "has_main_track" => ((int) $playlist["main_tracks_count"]) > 0,
            "share_url" => "http://localhost:3001/playlist/" . $playlist["share_token"]
        ];
    }

    response_json([
        "success" => true,
        "playlists" => $formatted
    ]);
}



if ($action === "get_public_playlist") {
    $token = post_value("token");
    $password = post_value("password");

    if ($token === "") {
        response_json([
            "success" => false,
            "message" => "Playlist token is required."
        ], 422);
    }

    if ($password === "") {
        response_json([
            "success" => false,
            "message" => "Password is required."
        ], 422);
    }

    $stmt = $pdo->prepare("
        SELECT
            id,
            user_id,
            title,
            receiver_name,
            receiver_message,
            cover_image,
            access_password,
            share_token,
            created_at
        FROM playlists
        WHERE share_token = ?
        LIMIT 1
    ");

    $stmt->execute([$token]);
    $playlist = $stmt->fetch();



    if (!$playlist) {
        response_json([
            "success" => false,
            "message" => "Playlist not found."
        ], 404);
    }



    if (!password_verify($password, $playlist["access_password"])) {
        response_json([
            "success" => false,
            "message" => "Wrong playlist password."
        ], 401);
    }

  $current_user_id = $_SESSION["user_id"] ?? $_SESSION["user"]["id"] ?? null;

    if ($current_user_id && isset($playlist["id"])) {
        $openedCheck = $pdo->prepare("
            SELECT id
            FROM opened_playlists
            WHERE user_id = ? AND playlist_id = ?
            LIMIT 1
        ");

        $openedCheck->execute([$current_user_id, $playlist["id"]]);
        $openedRow = $openedCheck->fetch(PDO::FETCH_ASSOC);

        if ($openedRow) {
            $openedUpdate = $pdo->prepare("
                UPDATE opened_playlists
                SET opened_at = NOW()
                WHERE id = ?
            ");

            $openedUpdate->execute([$openedRow["id"]]);
        } else {
            $openedInsert = $pdo->prepare("
                INSERT INTO opened_playlists (user_id, playlist_id, opened_at)
                VALUES (?, ?, NOW())
            ");

            $openedInsert->execute([$current_user_id, $playlist["id"]]);
        }
    }

    $playlistId = (int) $playlist["id"];

    $stmt = $pdo->prepare("
        SELECT
            id,
            track_name,
            artist_name,
            album_name,
            file_url,
            cover_image,
            lyrics,
            description,
            duration
        FROM playlist_tracks
        WHERE playlist_id = ?
        AND is_main = 1
        LIMIT 1
    ");

    $stmt->execute([$playlistId]);
    $mainTrack = $stmt->fetch();

    $stmt = $pdo->prepare("
        SELECT
            id,
            name,
            description,
            sort_order
        FROM categories
        WHERE playlist_id = ?
        ORDER BY sort_order ASC, id ASC
    ");

    $stmt->execute([$playlistId]);
    $categories = $stmt->fetchAll();

    $stmt = $pdo->prepare("
        SELECT
            id,
            category_id,
            track_name,
            artist_name,
            album_name,
            file_url,
            cover_image,
            lyrics,
            description,
            duration,
            sort_order
        FROM playlist_tracks
        WHERE playlist_id = ?
        AND is_main = 0
        ORDER BY sort_order ASC, id ASC
    ");

    $stmt->execute([$playlistId]);
    $tracks = $stmt->fetchAll();

    function media_url_or_null($path) {
        if (!$path) return null;

        if (strpos($path, "http://") === 0 || strpos($path, "https://") === 0) {
            return $path;
        }

        return base_url() . "/" . ltrim($path, "/");
    }

    $formattedMainTrack = null;

    if ($mainTrack) {
        $formattedMainTrack = [
            "id" => (int) $mainTrack["id"],
            "title" => $mainTrack["track_name"],
            "artist" => $mainTrack["artist_name"],
            "album" => $mainTrack["album_name"],
            "file_url" => media_url_or_null($mainTrack["file_url"]),
            "cover_image" => media_url_or_null($mainTrack["cover_image"]),
            "lyrics" => $mainTrack["lyrics"],
            "description" => $mainTrack["description"],
            "duration" => (int) $mainTrack["duration"],
        ];
    }

    $tracksByCategory = [];

    foreach ($tracks as $track) {
        $categoryId = (int) $track["category_id"];

        if (!isset($tracksByCategory[$categoryId])) {
            $tracksByCategory[$categoryId] = [];
        }

        $tracksByCategory[$categoryId][] = [
            "id" => (int) $track["id"],
            "category_id" => $categoryId,
            "title" => $track["track_name"],
            "artist" => $track["artist_name"],
            "album" => $track["album_name"],
            "file_url" => media_url_or_null($track["file_url"]),
            "cover_image" => media_url_or_null($track["cover_image"]),
            "lyrics" => $track["lyrics"],
            "description" => $track["description"],
            "duration" => (int) $track["duration"],
        ];
    }

    $formattedCategories = [];

    foreach ($categories as $category) {
        $categoryId = (int) $category["id"];

        $formattedCategories[] = [
            "id" => $categoryId,
            "name" => $category["name"],
            "description" => $category["description"],
            "sort_order" => (int) $category["sort_order"],
            "tracks" => $tracksByCategory[$categoryId] ?? [],
        ];
    }

    response_json([
        "success" => true,
        "playlist" => [
            "id" => $playlistId,
            "title" => $playlist["title"],
            "receiver_name" => $playlist["receiver_name"],
            "receiver_message" => $playlist["receiver_message"],
            "cover_image" => media_url_or_null($playlist["cover_image"]),
            "share_token" => $playlist["share_token"],
            "created_at" => $playlist["created_at"],
            "main_track" => $formattedMainTrack,
            "categories" => $formattedCategories,
        ]
    ]);
}



if ($action === "get_category_tracks") {
    $category_id = (int) post_value("category_id", get_value("category_id", 0));

    if ($category_id === 0) {
        echo json_encode(["success" => false, "message" => "Invalid category ID."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, track_name, artist_name, duration, file_url, cover_image, lyrics, description FROM playlist_tracks WHERE category_id = ? ORDER BY id ASC");
        $stmt->execute([$category_id]);
        $tracks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "tracks" => $tracks
        ]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
    exit;
}



if ($action === "get_opened_playlists") {
    $user_id = $_SESSION["user_id"] ?? $_SESSION["user"]["id"] ?? null;

    if (!$user_id) {
        echo json_encode([
            "success" => false,
            "message" => "You must be logged in."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT
                op.id,
                op.user_id,
                op.playlist_id,
                op.opened_at,

                p.title,
                p.receiver_name,
                p.receiver_message,
                p.cover_image,
                p.share_token,
                p.created_at,

                (
                    SELECT COUNT(*)
                    FROM categories c
                    WHERE c.playlist_id = p.id
                ) AS categories_count,

                (
                    SELECT COUNT(*)
                    FROM playlist_tracks pt
                    WHERE pt.playlist_id = p.id AND pt.is_main = 0
                ) AS tracks_count,

                EXISTS (
                    SELECT 1
                    FROM playlist_tracks mt
                    WHERE mt.playlist_id = p.id AND mt.is_main = 1
                    LIMIT 1
                ) AS has_main_track

            FROM opened_playlists op
            INNER JOIN playlists p ON p.id = op.playlist_id
            WHERE op.user_id = ?
            ORDER BY op.opened_at DESC
        ");

        $stmt->execute([$user_id]);
        $playlists = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($playlists as &$playlist) {
            $playlist["id"] = (int) $playlist["id"];
            $playlist["user_id"] = (int) $playlist["user_id"];
            $playlist["playlist_id"] = (int) $playlist["playlist_id"];
            $playlist["categories_count"] = (int) $playlist["categories_count"];
            $playlist["tracks_count"] = (int) $playlist["tracks_count"];
            $playlist["has_main_track"] = (bool) $playlist["has_main_track"];
        }

        echo json_encode([
            "success" => true,
            "playlists" => $playlists
        ]);
        exit;

    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ]);
        exit;
    }
}



response_json([
    "success" => false,
    "message" => "Invalid action."
], 400);

?>