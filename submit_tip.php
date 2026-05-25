<?php
include 'config.php';

error_reporting(0);

$name = $_POST['name'];
$location = $conn->real_escape_string($_POST['location']);
$details = $conn->real_escape_string($_POST['details']);

if($name == ""){
    $name = "Anonymous";
}

$photoName = "";
$videoName = "";

if (!is_dir('uploads')) {
    mkdir('uploads', 0777, true);
}

if(isset($_FILES['photo']) && $_FILES['photo']['error'] == 0){
    $photoName = time() . "_" . basename($_FILES['photo']['name']);
    move_uploaded_file($_FILES['photo']['tmp_name'], "uploads/" . $photoName);
}

if(isset($_FILES['video']) && $_FILES['video']['error'] == 0){
    $videoName = time() . "_" . basename($_FILES['video']['name']);
    move_uploaded_file($_FILES['video']['tmp_name'], "uploads/" . $videoName);
}

$sql = "INSERT INTO reports
(reporter,type,location,details,photo,video)
VALUES
('$name','Anonymous Tip','$location','$details','$photoName','$videoName')";

if($conn->query($sql)){
    echo "success";
}else{
    echo "error";
}
?>