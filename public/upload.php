<?
$file_dest = "{$_REQUEST['folder']}/{$_FILES['upload_file']['name']}";
move_uploaded_file($_FILES['upload_file']['tmp_name'], $file_dest);