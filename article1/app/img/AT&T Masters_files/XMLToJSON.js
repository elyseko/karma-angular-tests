window.XMLToJSON = (function() {
	
	var ELEMENT_NODE = 1;
	var ATTRIBUTE_NODE = 2;
	var TEXT_NODE = 3;
	var CDATA_SECTION_NODE = 4;
	var ENTITY_REFERENCE_NODE = 5;
	var ENTITY_NODE = 6;
	var PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE = 8;
	var DOCUMENT_NODE = 9;
	var DOCUMENT_TYPE_NODE = 10;
	var DOCUMENT_FRAGMENT_NODE = 11;
	var NOTATION_NODE = 12;
	
	function XMLToJSON() {
		
	}
	
	XMLToJSON.prototype.parseXML = function(xml) {
		var returnJSON = {};

		if (xml.nodeType === ELEMENT_NODE) { // Grab any attributes and set them as properties
			if (xml.attributes.length > 0) {
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					returnJSON[attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType === TEXT_NODE) { // Deal with the text node
			returnJSON = xml.nodeValue;
		}
		
		if (xml.hasChildNodes()) { // Deal with any child nodes
			for (var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeValue = undefined;
				var nodeName = item.nodeName;
				var nodeType = item.nodeType;

				if (!returnJSON.hasOwnProperty(nodeName)) {

					switch (nodeType) {
						case TEXT_NODE:
							nodeValue = trimStr(item.nodeValue);
							if (nodeValue !== '') {
								returnJSON = item.nodeValue;
							}
							break;

						case CDATA_SECTION_NODE:
							nodeValue = trimStr(item.nodeValue);
							if (nodeValue !== '') {
								returnJSON = item.nodeValue;
							}
							break;

						default:
							returnJSON[nodeName] = this.parseXML(item);
					}
				} else {
					if (typeof(returnJSON[nodeName].push) == 'undefined') {
						var old = returnJSON[nodeName];
						returnJSON[nodeName] = [];
						returnJSON[nodeName].push(old);
						returnJSON[nodeName].push(this.parseXML(item));
					} else {
						returnJSON[nodeName].push(this.parseXML(item));
					}
				}
			}
		}
		return returnJSON;
	};


	function trimStr(str) {
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	}
	
	return XMLToJSON;	
})();
