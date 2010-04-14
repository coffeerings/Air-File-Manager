<?

// list of files output in json, quick hack of api
function get_files_recursive($directory) {
	$ignore = array('.localized','.DS_Store','.timestamp');
	$dir = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory), true);
	$files = array();
	foreach($dir as $file){
		if(!is_dir($file)){
			$info = pathinfo($file);
			if(!in_array($file->getFilename(), $ignore) && strpos($file->getFilename(),'.timestamp') === false) {
				$last_download = file_get_contents($file->getPath().'/'.$file->getFilename().'.timestamp');
				$files[] = array(	'file_name'=>$file->getFilename(),
													'file_path'=>$file->getPath(),
													'file_size'=>$file->getSize(),
													'file_url'=>"http://{$_SERVER['HTTP_HOST']}/download.php?file={$info['dirname']}/".$file->getFilename(),
													'file_mtime'=>$file->getMTime(),
													'last_download'=>$last_download);
			}
		}	
	}
	return $files;
}

echo json_encode(get_files_recursive('files'));