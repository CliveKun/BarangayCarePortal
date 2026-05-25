<?php
include 'config.php';

$reporter = !empty($_POST['reporter']) ? $conn->real_escape_string($_POST['reporter']) : "Anonymous";
$type     = $_POST['type'];
$urgency  = $_POST['urgency'];
$location = $conn->real_escape_string($_POST['location']);
$details  = $conn->real_escape_string($_POST['details']);
$lat      = !empty($_POST['lat']) ? $_POST['lat'] : NULL;
$lng      = !empty($_POST['lng']) ? $_POST['lng'] : NULL;

$photoName = "";
$videoName = "";
$uploadDir = 'uploads/';

if(isset($_FILES['photo']) && $_FILES['photo']['error'] == 0){
    $photoName = time() . "_img_" . basename($_FILES['photo']['name']);
    move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $photoName);
}

if(isset($_FILES['video']) && $_FILES['video']['error'] == 0){
    $videoName = time() . "_vid_" . basename($_FILES['video']['name']);
    move_uploaded_file($_FILES['video']['tmp_name'], $uploadDir . $videoName);
}

$stmt = $conn->prepare("INSERT INTO reports (reporter, type, urgency, location, details, photo, video, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssssss", $reporter, $type, $urgency, $location, $details, $photoName, $videoName, $lat, $lng);

if($stmt->execute()){
    echo "success";
} else {
    echo "Database Error: " . $stmt->error;
}
?>