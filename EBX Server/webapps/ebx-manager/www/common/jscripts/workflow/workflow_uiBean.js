var ebx_wfw_javascriptInit = true;

// Generic refresh handler
EBX_WorkflowRefreshHandler = function(htmlElementId) {

	// This method is mandatory
	this.handleAjaxResponseSuccess = function(responseContent) {
		document.getElementById(htmlElementId).innerHTML = responseContent;
	};

	// This method is mandatory
	this.handleAjaxResponseFailed = function(responseContent) {
		return false;
	};
};

// Specifies that the custom Ajax handler uses the prototype provided by EBX®
EBX_WorkflowRefreshHandler.prototype = new EBX_AJAXResponseHandler();

// Defines the function sending the Ajax request.
function ebx_wfw_callAjaxComponent(urlToAjaxComponent, htmlElementId, requestParameters) {

	// Initializes the custom Ajax handler with html element id
	var myRefreshHandler = new EBX_WorkflowRefreshHandler(htmlElementId);

	// Sends the request to the given Ajax component with the specified request parameters
	myRefreshHandler.sendRequest(urlToAjaxComponent + requestParameters);
};

function ebx_wfw_resetDivAjaxComponent(htmlElementId) {
	document.getElementById(htmlElementId).innerHTML = "";
}

function ebx_wfw_showAndHideElementAccordingToMode(mode, idLibraryMode, idParameters, idSpecificMode) {
	if (mode == "library") {
		document.getElementById(idSpecificMode).style.display = "none";
		document.getElementById(idLibraryMode).style.display = "";
		document.getElementById(idParameters).style.display = "";
	} else {
		document.getElementById(idSpecificMode).style.display = "";
		document.getElementById(idLibraryMode).style.display = "none";
		document.getElementById(idParameters).style.display = "none";
	}
}

function ebx_wfw_changeTaskTerminationCriteria(selectedValue, divId) {
	var divElement = document.getElementById(divId);

	if (selectedValue == null) {
		divElement.style.display = "";
		return;
	}

	if (EBX_Utils.arrayContains(ebx_wfw_tabTerminationCriteria_ignoreReject, selectedValue.key)) {
		divElement.style.display = "none";
		return;
	}
	divElement.style.display = "";
}
