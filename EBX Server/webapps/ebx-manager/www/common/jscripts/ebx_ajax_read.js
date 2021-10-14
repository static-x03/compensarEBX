/**
 * Add default XHR header to avoid caching AJAX Request on IE
 */
YAHOO.util.Connect._default_headers["If-Modified-Since"] = "Tue, 29 Nov 1966 20:50:00 GMT";

// EBX_Ajax function (limited to read only and display html)
function EBX_Ajax() {
	var onXMLHttpRequest = false;

	var finished = true;
	var onTargetObject = null;

	this.setFinished = function(hasFinished) {
		finished = hasFinished;
	};

	this.hasFinished = function() {
		return finished;
	};

	this.setReadyStateChangeObject = function(anObject) {
		if (!anObject instanceof EBX_AbstractAjaxResponseManager) {
			EBX_Logger.log("EBX_Ajax.setReadyStateChangeObject: Given object must implement Javascript prototype [EBX_AbstractAjaxResponseManager]",
					EBX_Logger.error);
			return;
		}
		onTargetObject = anObject;
	};

	this.execute = function(anUrl) {
		this.setFinished(false);
		if (onTargetObject === null) {
			return;
		}

		if (window.XMLHttpRequest) {
			try {
				onXMLHttpRequest = new XMLHttpRequest();
			} catch (e) {}
		} else if (window.ActiveXObject) {
			try {
				onXMLHttpRequest = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try {
					onXMLHttpRequest = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {}
			}
		}

		if (!onXMLHttpRequest) {
			return false;
		}

		onXMLHttpRequest.abort();

		onXMLHttpRequest.onreadystatechange = function() {
			if (onXMLHttpRequest.readyState == 4) {
				var status = 400;
				try {
					status = onXMLHttpRequest.status;
				} catch (e) {}
				switch (status) {
					case 200:
						if (onTargetObject) {
							onTargetObject.onReadyStateChangeFunction();
						}
						break;
					// The real timeout code is 408 but Mozilla don't manage it correctly (do retry...).
					// The "Unauthorized" response code is not so far from a Timeout in this context.
					// (ex: "Request unauthorized because of session timeout")
					case 401:
						if (onTargetObject) {
							onTargetObject.onManageTimeoutResponse();
						}
						break;
					//Case of obsolete AJAX request. => do nothing
					case 204:
						break;

					default:
						if (onTargetObject) {
							onTargetObject.onManageErrorResponse();
						}
						break;
				}
			}
		};

		// Mantis #6349: POST method in ajax requests.
		// GET
		/*
		onXMLHttpRequest.open("GET", anUrl, true);
		//Prevent IE from getting back request response from cache...Force request revalidation.
		onXMLHttpRequest.setRequestHeader("If-Modified-Since", "Tue, 29 Nov 1966 20:50:00 GMT");
		onXMLHttpRequest.send("");
		EBX_Logger.log("EBX_Ajax.execute: Request send at url [" + anUrl + "]", EBX_Logger.info);
		*/

		// POST
		var questionMarkPos = anUrl.indexOf("?");
		var url = anUrl.substring(0, questionMarkPos);
		var params = anUrl.substring(questionMarkPos + 1, anUrl.length);
		onXMLHttpRequest.open("POST", url, true);

		//Send the proper header information along with the request
		onXMLHttpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		//Prevent IE from getting back request response from cache...Force request revalidation.
		onXMLHttpRequest.setRequestHeader("If-Modified-Since", "Tue, 29 Nov 1966 20:50:00 GMT");
		onXMLHttpRequest.send(params);
		EBX_Logger.log("EBX_Ajax.execute: Request send at url [" + url + "] with params [" + params + "]", EBX_Logger.info);
	};

	this.getReadyState = function() {
		return onXMLHttpRequest.readyState;
	};
	this.getResponseXML = function() {
		return onXMLHttpRequest.responseXML;
	};
	this.getResponseText = function() {
		return onXMLHttpRequest.responseText;
	};
}

//Prototype definition to get back ajax response and call the good object which will
//properly manage the response. This prototype defines abstract methods which must be implemented.
//All Ajax functionnalities in EBX® must implement this prototype !!
//@see com.onwbp.orchestra.manager.ui.subcomponent.ajax.AjaxResponseDocumentBuilder
function EBX_AbstractAjaxResponseManager() {
	//this.ajaxObject;
	this.successfullyComplete = true;

	//Available response codes.
	this.responseCodeOK_RequestResponse = 1;
	this.responseCodeOK_OptionsList = 2;
	this.responseCodeOK_JSONDoc = 3;

	this.responseCodeKO_Other = 10;
	this.responseCodeKO_Timeout = 11;

	//Abstract method which manage response document if the response code is the one expected.
	//Must return true if all happens as expected, false otherwise.
	this.onExecuteIfOK = function(responseXML, root) {
		EBX_Logger.log("EBX_AbstractAjaxResponseManager.onExecuteIfOK: Ajax object must implement method [ onExecuteIfOK(responseXML, root) ]",
				EBX_Logger.error);
		return false;
	};

	//Abstract method which manage response document if the response code is not the one expected.
	this.onExecuteIfKO = function(responseXML) {
		EBX_Logger.log("EBX_AbstractAjaxResponseManager.onExecuteIfKO: Ajax object must implement method [ onExecuteIfKO(responseXML, root) ]",
				EBX_Logger.error);
	};

	//Return the expected OK response code.
	//Must be overwritten by all sub-Classes.
	this.onGetExceptedResponseCode = function(callerId) {
		return this.responseCodeOK_RequestResponse;
	};

	//Standard method which launch the ajax request. Should not be overwritten.
	this.onExecute = function(url) {
		this.successfullyComplete = false;
		this.ajaxObject = new EBX_Ajax();
		this.ajaxObject.setReadyStateChangeObject(this);
		this.ajaxObject.execute(url.replace(/&amp;/g, "&"));
	};

	//Standard method which get back XML response and execute the proper function.
	//Should not be overwritten. See "onExecuteIfOK(responseXML, root)" and "onExecuteIfKO(responseXML)".
	this.onReadyStateChangeFunction = function() {
		if (this.ajaxObject.getReadyState() != 4) {
			return;
		}
		var responseXML = this.ajaxObject.getResponseXML();
		if (responseXML) {
			var root = responseXML.getElementsByTagName('ebxAjaxResponse')[0];
			if (root) {
				var responseStatus = root.attributes.getNamedItem('status').nodeValue;
				var callerEl = root.attributes.getNamedItem('callerId');
				var callerID = null;
				if (callerEl) {
					callerID = callerEl.nodeValue;
				}

				var expectedResponseCode = this.onGetExceptedResponseCode(callerID);
				if (this.onCheckExpectedResponseCode(expectedResponseCode)) {
					if (responseStatus == this.responseCodeKO_Timeout) {
						this.onManageTimeoutResponse();
						return;
					}
					if (responseStatus == expectedResponseCode) {
						this.successfullyComplete = this.onExecuteIfOK(responseXML, root);
						var responseJSArray = root.getElementsByTagName('responseJS');
						if (responseJSArray.length !== 0) {
							window.setTimeout(responseJSArray[0].firstChild.nodeValue, 0);
						}
					} else {
						if (responseStatus == this.responseCodeKO_Other) {
							this.onDisplayMessages(responseXML);
							this.onExecuteIfKO(responseXML);
							return;
						}
					}
				}
				this.onDisplayMessages(responseXML);
			}
		}
		if (!this.successfullyComplete) {
			this.onExecuteIfKO(responseXML);
		}
	};

	this.onIsSuccessfullyComplete = function() {
		return this.successfullyComplete;
	};

	//Check if given expected response code is valid according to this object constants.
	//TODO Find a way to synchronize these constants with those in Java class "AjaxResponseDocumentBuilder"
	this.onCheckExpectedResponseCode = function(aResponseCode) {
		switch (aResponseCode) {
			case this.responseCodeOK_JSONDoc:
				return true;

			case this.responseCodeOK_RequestResponse:
				return true;

			case this.responseCodeOK_OptionsList:
				return true;

			case this.responseCodeKO_Other:
				return true;

			case this.responseCodeKO_Timeout:
				return true;

			default:
				EBX_Logger.log("EBX_AbstractAjaxResponseManager.onCheckExpectedResponseCode: Unknown response code [" + aResponseCode
						+ "]. Response text: [ " + this.getResponseText() + " ]", EBX_Logger.error);
				return false;
		}
	};

	//An Ajax response document can contain "messages" element which contain one or more message.
	//This function add all messages in the onMessagesManager according to their severity and if they
	// must be displayed (hidden message attribute). Once added, the message manager will display new messages
	// starting by the higher severity (ERROR then WARNING then INFO).
	this.onDisplayMessages = function(responseXML) {
		if (!responseXML) {
			return;
		}

		var root = responseXML.getElementsByTagName('ebxAjaxResponse')[0];
		if (!root) {
			return;
		}

		var messages = root.getElementsByTagName('messages')[0];
		if (!messages) {
			return;
		}

		var messagesList = messages.getElementsByTagName('message');
		for ( var i = 0; i < messagesList.length; i++) {
			this.onDisplayMessage(messagesList[i]);
		}
	};

	//This function add given message to the message manager for the proper severity (message's attribute).
	// @see onDisplayMessages(responseXML)
	this.onDisplayMessage = function(message) {
		if (!message) {
			return;
		}

		var severity = message.attributes.getNamedItem('severity').nodeValue;
		var isHidden = eval(message.attributes.getNamedItem('hidden').nodeValue);
		if (isHidden) {
			// already managed and logged by the server in AjaxResponseDocumentBuilder.setErrorDocument
			/*
			 if (EBX_UserMessageManager.INFO === severity)
			 EBX_Logger.log(message.firstChild.data, EBX_Logger.info);
			 if (EBX_UserMessageManager.WARNING === severity)
			 EBX_Logger.log(message.firstChild.data, EBX_Logger.warn);
			 if (EBX_UserMessageManager.ERROR === severity)
			 EBX_Logger.log(message.firstChild.data, EBX_Logger.error);
			 return;
			 */
		}

		EBX_UserMessageManager.addMessage(message.firstChild.data, severity);
	};

	//Manage an HTTP error response (not an EBX_Ajax error response document, see "onExecuteIfKO(...)" for that)
	this.onManageErrorResponse = function() {};

	this.onManageTimeoutResponse = function() {
		EBX_Logger.log("EBX_AbstractAjaxResponseManager.onManageTimeoutResponse: Time out", EBX_Logger.warn);
		EBX_Loader.gotoTimeoutPage();
	};

	this.getResponseText = function() {
		return this.ajaxObject.getResponseText();
	};

}
