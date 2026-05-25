<?php
include 'config.php';

$username = $_POST['username'];
$password = md5($_POST['password']);

$sql = "SELECT * FROM admins
WHERE username='$username'
AND password='$password'";

$result = $conn->query($sql);

if($result->num_rows > 0){
    echo "success";
}else{
    echo "error";
}
?>