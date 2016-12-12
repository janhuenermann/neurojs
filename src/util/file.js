var StringView = require('../vendor/stringview.js');

function isObjLiteral(_obj) {
  var _test  = _obj;
  return (  typeof _obj !== 'object' || _obj === null ?
              false :  
              (
                (function () {
                  while (!false) {
                    if (  Object.getPrototypeOf( _test = Object.getPrototypeOf(_test)  ) === null) {
                      break;
                    }      
                  }
                  return Object.getPrototypeOf(_obj) === _test;
                })()
              )
          );
}

class BinaryWriter {

	/**
	 * Returns array buffer, which contains the binary data.
	 * @param  {array} contents
	 * @return {ArrayBuffer} 
	 */
	static write(contents) {
		var toc = [], length = 0;

		for (var i = 0; i < contents.length; i++) {
			var value = contents[i]
			var isobject = false

			if (value.constructor === Object || value.constructor === Array) {
				value = (contents[i] = JSON.stringify(value))
				isobject = true
			}

			if (typeof value === 'string') {
				toc.push({
					t: 's',
					l: value.length
				});

				if (isobject) {
					toc[toc.length - 1]['o'] = 1;
				}

				length += value.length
			}

			else if (ArrayBuffer.isView(value)) {
				toc.push({
					t: 't',
					l: value.byteLength,
					i: value.constructor.name
				})

				length += value.byteLength
			}

			else if (value instanceof ArrayBuffer) {
				toc.push({
					t: 'b',
					l: value.byteLength
				})

				length += value.byteLength
			}
 		}

		var jsonified = JSON.stringify(toc)

		length += jsonified.length + Uint32Array.BYTES_PER_ELEMENT + 1

		var writer = new BinaryWriter(length)

		writer.setUint8(BinaryWriter.validationByte) // validation byte
		writer.setUint32(jsonified.length) // table of contents length
		writer.setString(jsonified) // ToC

		for (var i = 0; i < toc.length; i++) {
			switch(toc[i].t) {
				case 's': writer.setString(contents[i]); break
				case 't': writer.setTypedArray(contents[i]); break
				case 'b': writer.setBuffer(contents[i]); break
			}
		}

		if (!writer.isAtEnd()) {
			throw "The lengths don't match up";
		}

		return writer.raw
	}


	constructor(length) {
		this.array = new Uint8Array(length)
		this.buffer = this.array.buffer
		this.dataView = new DataView(this.buffer)
		this.index = 0
	}

	setUint8(val) {
		this.dataView.setUint8(this.index, val)
		this.index += Uint8Array.BYTES_PER_ELEMENT
	}

	setUint32(val) {
		this.dataView.setUint32(this.index, val)
		this.index += Uint32Array.BYTES_PER_ELEMENT
	}

	setString(string) {
		var sv = new StringView(string);
		this.array.set(sv.rawData, this.index);
		this.index += sv.buffer.byteLength
	}

	setTypedArray(arr) {
		this.array.set(new Uint8Array(arr.buffer), this.index)
		this.index += arr.byteLength
	}

	setBuffer(buf) {
		this.array.set(new Uint8Array(buf), this.index)
		this.index += buf.byteLength
	}

	isAtEnd() {
		return this.buffer.byteLength === this.index
	}

	get raw() {
		return this.array.buffer
	}

}


class BinaryReader {

	/**
	 * Returns the contents read from the array buffer
	 * @param  {ArrayBuffer} buffer
	 * @return {array}      
	 */
	static read(buffer) {
		var reader = new BinaryReader(buffer)

		var validation = reader.getUint8()

		if (validation !== BinaryWriter.validationByte) {
			throw "validation byte doesn't match."
		}

		var tocLength = reader.getUint32()
		var tocString = reader.getString(tocLength)
		var toc = JSON.parse(tocString)
		var contents = []

		for (var i = 0; i < toc.length; i++) {
			switch (toc[i].t) {
				case 's': contents.push(reader.getString(toc[i].l)); break
				case 't': contents.push(new (typeof window !== 'undefined' ? window : global)[toc[i].i](reader.getBuffer(toc[i].l))); break
				case 'b': contents.push(reader.getBuffer(toc[i].l)); break
			}

			if (toc[i]['o'] === 1) {
				contents[i] = JSON.parse(contents[i]);
			}
		}

		return contents
	}


	constructor(buffer) {
		this.array = new Uint8Array(buffer)
		this.buffer = buffer
		this.dataView = new DataView(buffer)
		this.index = 0
	}


	getUint8() {
		var val = this.dataView.getUint8(this.index)
		this.index += Uint8Array.BYTES_PER_ELEMENT

		return val
	}

	getUint32() {
		var val = this.dataView.getUint32(this.index)
		this.index += Uint32Array.BYTES_PER_ELEMENT

		return val
	}

	getString(length) {
		var arr = this.array.subarray(this.index, this.index + length)
		var str = (new StringView(arr)).toString()

		this.index += arr.byteLength

		return str
	}

	getBuffer(byteLength) {
		var arr = this.array.slice(this.index, this.index + byteLength)
		this.index += byteLength

		return arr.buffer
	}

	isAtEnd() {
		return this.buffer.byteLength === this.index
	}

}

BinaryWriter.validationByte = 0x8F;

module.exports = {
	'Writer' : BinaryWriter,
	'Reader' : BinaryReader
};