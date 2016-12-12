class FileLoader {

	static download(file, callback) {
		// Create XHR, Blob and FileReader objects
	    var xhr = new XMLHttpRequest(), blob, fileReader = new FileReader();

	    xhr.open("GET", file, true);
	    // Set the responseType to arraybuffer. "blob" is an option too, rendering manual Blob creation unnecessary, but the support for "blob" is not widespread enough yet
	    xhr.responseType = "arraybuffer";

	    xhr.addEventListener("load", function () {
	        if (xhr.status === 200) {
	            callback(null, xhr.response)
	        }

	        else {
	        	callback(xhr.status, null)
	        }
	    }, false);

	    // Send XHR
	    xhr.send();
	}

}

module.exports = FileLoader;