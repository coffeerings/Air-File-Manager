<?

// list of files output in json
function get_files_recursive($directory) {
	$ignore = array('.localized','.DS_Store');
	$dir = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory), true);
	$files = array();
	foreach($dir as $file){
		if(!is_dir($file)){
			$info = pathinfo($file);
			if(!in_array($file->getFilename(), $ignore)) $files[] = array('file_name'=>$file->getFilename(),'file_path'=>$file->getPath(),'file_size'=>$file->getSize(),'file_url'=>"http://{$_SERVER['HTTP_HOST']}/{$info['dirname']}/".$file->getFilename());
		}	
	}
	return $files;
}

echo json_encode(get_files_recursive('files'));