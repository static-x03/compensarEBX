/* Published methods:
 * EBX_AJAXResponseHandler.sendRequest(url)
 * abstract EBX_AJAXResponseHandler.handleAjaxResponseSuccess(responseContent)
 * abstract EBX_AJAXResponseHandler.handleAjaxResponseFailed(responseContent)
 *
 * @see com.orchestranetworks.ui.UIAjaxComponent
 */
function EBX_AJAXResponseHandler() {
	this.onExecuteIfOK = function(responseXML, root) {
		var bodyElement = root.getElementsByTagName('responseBody')[0];
		// if the server wrote "" in the ajax response, the XML parser won't put a void CDATA
		// so by default, the response is ""
		var responseContent = "";
		if (bodyElement.firstChild) {
			responseContent = bodyElement.firstChild.data;
		}
		this.handleAjaxResponseSuccess(responseContent);
		return true;
	};

	this.onExecuteIfKO = function(responseXML) {
		this.handleAjaxResponseFailed(responseXML);
	};

	// PUBLIC API
	this.sendRequest = function(url) {
		this.onExecute(url);
	};

	// PUBLIC API
	// Abstract method which manages response document if the response code is the one expected.
	this.handleAjaxResponseSuccess = function(responseContent) {
		EBX_Logger.log("Ajax object must implement method [ handleAjaxResponseSuccess(responseContent) ]", EBX_Logger.error);
	};

	// PUBLIC API
	// Abstract method which manages response document if the response code is not the one expected.
	this.handleAjaxResponseFailed = function(responseContent) {
		EBX_Logger.log("Ajax object must implement method [ handleAjaxResponseFailed(responseContent) ]", EBX_Logger.error);
	};
}

EBX_AJAXResponseHandler.prototype = new EBX_AbstractAjaxResponseManager();
