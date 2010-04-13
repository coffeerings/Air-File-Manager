/* 
 Drop Box Style Tool 
 Proof of Concept - DO NOT PUT INTO BLOODY PRODUCTION
*/

var SERVICE_URL = 'http://air.localhost:8080';
var DATA_URL = 'http://air.localhost:8080/test.txt';
var LIST_URL = 'http://air.localhost:8080/list.php';
var UPLOAD_URL = 'http://air.localhost:8080/upload.php';
var LOCAL_FILE = 'myfile.txt';
var DATABASE_FILE = 'db/mydatabase.db';
var DEFAULT_LOCAL_DIR = 'AIR';

// Member properties
var monitor = null;
var network_status = false;
var files_online = new Array(); // todo: migrate logic to something more self contained

/* initialise app */
$(document).ready(function(){
	do_load();
  $("#sync").click(function () { 
  	do_sync_down(); 
  });
});

function do_load(){
	monitor = new air.URLMonitor(new air.URLRequest(SERVICE_URL));
	monitor.pollInterval = 500;
	monitor.addEventListener( air.StatusEvent.STATUS, function(e){
		if(monitor.available){
			air.trace('Network availible');
			network_status = true;
		}
		else{
			air.trace('Network not available.' );
			network_status = false;
		}
	});
	monitor.start();
	
	var conn = new air.SQLConnection(); 
	conn.addEventListener(air.SQLEvent.OPEN, function (e){ 
		air.trace("the database was created successfully"); 
	}); 
	conn.addEventListener(air.SQLErrorEvent.ERROR, errorHandler); 
	dbFile = air.File.applicationStorageDirectory.resolvePath(DATABASE_FILE); 
	conn.openAsync(dbFile); 
	
	create_stmt = new air.SQLStatement(); 
	create_stmt.sqlConnection = conn;  
	create_stmt.text = "CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, file_path TEXT, download_timestamp TEXT)";; 

	create_stmt.addEventListener(air.SQLEvent.RESULT, function(){
		air.trace("Table created"); 
	}); 
	create_stmt.addEventListener(air.SQLErrorEvent.ERROR, function(){
		air.trace("Error message:", event.error.message); 
    air.trace("Details:", event.error.details);
	}); 

	create_stmt.execute();
	
	
	do_sync_down();
	//do_sync_up(DEFAULT_LOCAL_DIR);
	display_directory_listing(DEFAULT_LOCAL_DIR);
	
	//setInterval( "do_sync_down()", 15000 );
	//setInterval( "do_sync_up(DEFAULT_LOCAL_DIR)", 10000 );
	setInterval( "display_directory_listing(DEFAULT_LOCAL_DIR)", 1000 );
}

function errorHandler(event)	{ 
    air.trace("Error message:", event.error.message); 
    air.trace("Details:", event.error.details); 
}

function do_sync_down(){
	$.getJSON(LIST_URL, function(data) {
		$.each(data, function(i,item){
			var file_path = DEFAULT_LOCAL_DIR + '/' + item.file_path + '/' + item.file_name; item.file_path;
			// check modifyied
			file = air.File.documentsDirectory.resolvePath(file_path);
			if(file.size != item.file_size){
				var url_stream = new air.URLStream();

				url_stream.addEventListener(air.Event.COMPLETE, function (event) {
					file_data = new air.ByteArray();
					file_stream = new air.FileStream(); 

			    url_stream.readBytes(file_data, 0, url_stream.bytesAvailable); 
			    file = air.File.documentsDirectory.resolvePath(file_path); 
			    file_stream.open(file, air.FileMode.WRITE); 
			    file_stream.writeBytes(file_data, 0, file_data.length); 
			    file_stream.close(); 
			    air.trace("The " + file_path + " file is written.");
				}); 
				url_stream.load(new air.URLRequest(item.file_url));
			}
			else{
				air.trace(file_path + ' all ok, not downloaded.');
			}
		});
	});
}

function do_sync_up(path){
	directory = air.File.documentsDirectory.resolvePath(path); 
	contents = directory.getDirectoryListing();
	for (var i=0; i<contents.length; i++){
		if(!contents[i].isDirectory){
			air.trace('upload path: ' + contents[i].nativePath);
			// create lock on file to stop two simul copies
			upload_url = UPLOAD_URL + '?folder=' + path.replace(DEFAULT_LOCAL_DIR + '/','');  // replace with something more robust
			var request = new air.URLRequest(upload_url);
			loader = new air.URLLoader();
			stream = new air.FileStream();
			buf = new air.ByteArray();
			extra = {"modified_time": "tmp"};
			stream.open(contents[i], air.FileMode.READ);
			stream.readBytes(buf);
			PrepareMultipartRequest(request, buf, 'upload_file', contents[i].nativePath, extra);
			loader.load(request);
			// remove lock
		}
		else{
			directory_default = air.File.documentsDirectory.resolvePath(DEFAULT_LOCAL_DIR); 
			relative_path = directory_default.getRelativePath(contents[i]);
			do_sync_up(DEFAULT_LOCAL_DIR + '/' + relative_path);
		}
	}
}

function display_directory_listing(path, clean){
	clean = typeof(clean) != 'undefined' ? clean : true;
	if(clean == true) $('#directory-listing > tbody').empty();
	
  directory = air.File.documentsDirectory.resolvePath(path);
	contents = directory.getDirectoryListing();

	for(i=0; i<contents.length; i++){
		if(!contents[i].isDirectory){
			$('#directory-listing > tbody:last').append('<tr><td>' + contents[i].nativePath + '</td><td>' + contents[i].name + '</td><td>' + contents[i].size + '</td></tr>');
		}
		else{
			directory_default = air.File.documentsDirectory.resolvePath(DEFAULT_LOCAL_DIR); 
			relative_path = directory_default.getRelativePath(contents[i]);
			display_directory_listing(DEFAULT_LOCAL_DIR + '/' + relative_path, false);
		}
	}
}

/* function from http://rollingcode.org/blog/f/multipart.js */
function PrepareMultipartRequest(request, file_bytes, field_name, native_path, data_before, data_after) {
	var boundary = '---------------------------1076DEAD1076DEAD1076DEAD';
	var header1 = '';
	var header2 = '\r\n';
	var header1_bytes = new air.ByteArray();
	var header2_bytes = new air.ByteArray();
	var body_bytes = new air.ByteArray();
	var n;
	if (!field_name) field_name = 'file';
	if (!native_path) native_path = '\\';
	if (!data_before) data_before = {};
	if (!data_after) data_after = {};
	for (n in data_before) {
		header1 += '--' + boundary + '\r\n'
				+ 'Content-Disposition: form-data; name="' + n + '"\r\n\r\n'
				+ data_before[n] + '\r\n';
	}
	header1 += '--' + boundary + '\r\n'
			+ 'Content-Disposition: form-data; name="' + field_name + '"; filename="' + native_path + '"\r\n'
			+ 'Content-Type: application/octet-stream\r\n\r\n';
	for (n in data_after) {
		header2 += '--' + boundary + '\r\n'
				+ 'Content-Disposition: form-data; name="' + n + '"\r\n\r\n'
				+ data_after[n] + '\r\n';
	}
	header2 += '--' + boundary + '--';
	header1_bytes.writeMultiByte(header1, "ascii");
	header2_bytes.writeMultiByte(header2, "ascii");
	body_bytes.writeBytes(header1_bytes, 0, header1_bytes.length);
	body_bytes.writeBytes(file_bytes, 0, file_bytes.length);
	body_bytes.writeBytes(header2_bytes, 0, header2_bytes.length);
	request.method = air.URLRequestMethod.POST;
	request.contentType = 'multipart/form-data; boundary='+boundary;
	request.data = body_bytes;
}