// random bits and bobs not used any more
function do_load(){
	
	/* view source, requires event trigger */
	/*var viewer = air.SourceViewer.getDefault(); 
	viewer.viewSource();*/
	
	ship = air.File.applicationDirectory.resolvePath( DATABASE_FILE );
	store = air.File.applicationStorageDirectory.resolvePath( DATABASE_FILE );
	
	// Put the database in a writable place first
	if(!store.exists){
		ship.copyTo(store);
	}
	
	air.trace('Database at: ' + store.nativePath);	
	
	db = new air.SQLConnection();
	db.addEventListener(air.SQLEvent.OPEN, do_db_open);
	db.open(store, air.SQLMode.CREATE);	
	

}


/* abobe copied function to allow drag over pane */
function do_over( e ){
	// Check the types of data being dragged
	for( var t = 0; t < e.dataTransfer.types.length; t++ )
	{
		// Make sure there is a type you can handle		
		if( e.dataTransfer.types[t] == 'application/x-vnd.adobe.air.file-list' )
		{
			// Tell WebKit to avoid the default behavior (ignore)
			e.preventDefault();
		}
	}
}

function do_drop( e ){
	var data = null;
	var elem = null;	
	var file = null;
	var list = null;
	var stream = null;

	// Get the list of files that were dropped
	list = e.dataTransfer.getData( 'application/x-vnd.adobe.air.file-list' );

	// Iterate through the list of dropped files
	for( var f = 0; f < list.length; f++ ){
		stream = new air.FileStream();
		stream.open( list[f], air.FileMode.READ );
		
		url_parts = list[f].url.split("/");
		filename = url_parts[url_parts.length-1];

		data = stream.readMultiByte( stream.bytesAvailable, air.File.systemCharset );
		stream.close();
		
		file = air.File.applicationStorageDirectory.resolvePath( filename );		
		stream_write = new air.FileStream();
		stream_write.open( file, air.FileMode.WRITE );
		stream_write.writeMultiByte( data, air.File.systemCharset );
		stream_write.close();
		air.trace( 'File has been copied to your local application store.' );
		air.trace('File should have been copied on Desktop.');
		
		display_directory_listing();
		preview_file_contents(data);
		
		store_contents( data );
	}
}

function errorHandler(event){
               air.trace(event.text);
           }

function ioErrorHandler(event) {
            air.trace("ioErrorHandler: " + event);
        }


function store_contents( contents ){
	stmt.text = 'INSERT INTO files VALUES ( NULL, :contents )';
	stmt.parameters[':contents'] = contents;
	stmt.execute();
}

function do_db_open( e ){	
	stmt = new air.SQLStatement();
	stmt.addEventListener( air.SQLErrorEvent.ERROR, do_stmt_error );
	stmt.addEventListener( air.SQLEvent.RESULT, do_stmt_result );
	stmt.sqlConnection = db;
}

function do_stmt_error( e ){
	air.trace( 'Error executing statement:\n' + e.error.message );
}

function do_stmt_result( e ){
	air.trace( 'The data has been stored in the local datastore.' );
}

function preview_file_contents(data){
	$('#file_preview_pane').text(data);
	$('#file_preview_pane').fadeIn('slow');
}