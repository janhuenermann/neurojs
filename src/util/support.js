function CheckSupport() {

	if (process !== undefined && !process.browser) {
		if (process.version.indexOf('v') !== 0) {
			throw 'unknown node version.';
		}

		var vn = process.version.substring(1).split('.');
		var major = parseInt(vn[0]);
		var minor = parseInt(vn[1]);
	
		if (major > 6) return true;
		if (major === 6 && minor >= 6) return true;

		return false;
	}

	else if (typeof window !== 'undefined') {
		var supported = {
			'safari': 10,
			'chrome': 54
		};

		return true;
	}

	return true;

}

module.exports = CheckSupport;