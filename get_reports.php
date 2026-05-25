<?php
include 'config.php';

$sql = "SELECT * FROM reports ORDER BY id DESC";

$result = $conn->query($sql);

$reports = [];

while($row = $result->fetch_assoc()){
    $reports[] = $row;
}

echo json_encode($reports);
?>