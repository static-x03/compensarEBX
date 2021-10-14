var ebx_wcg = (function() {
	"use strict";
	
	var CSS_CLASS_HIDDEN = "ebx-wcg-hidden";
	
	// list of parameters of each service
	var serviceParameters;
	
	// list of parameters of each service
	// dynamically initialized from serviceParameters
	var serviceParamIds = [];
	
	var ajaxCallbacks = {};
	
	var pathPrefix = "";

  // Preview is deferred so that the preview url can be refreshed.
  var previewCallback;
  var isPreviewRequested = false;
	
	return {
		registerAjaxCallback: registerAjaxCallback,
		registerServiceParameters: registerServiceParameters,
		generateLink: generateLink,
    setPathPrefix: setPathPrefix,
    preview: preview,
    setPreviewCallback: setPreviewCallback
	};
	
	function setPathPrefix(newPathPrefix) {
		pathPrefix = newPathPrefix;
	}
	
	function getPath(aPath) {
		return pathPrefix + "/" + aPath;
	}
	
	function registerAjaxCallback(name, url) {
		ajaxCallbacks[name] = url;
	}
	
	function registerServiceParameters(declaration) {
		serviceParameters = declaration;
		
		for (var key in serviceParameters) {
			if (!serviceParameters.hasOwnProperty(key)) {
				continue;
			}
			
			var paramList = serviceParameters[key];
			EBX_Utils.forEach(paramList, function(param) {
				if (EBX_Utils.arrayContains(serviceParamIds, param) === false) {
					serviceParamIds.push(param);
				}
			});
		}
	}
	
	function generateLink() {
    previewCallback = undefined;

		var ajaxHandler = new EBX_AJAXResponseHandler();
		
		ajaxHandler.handleAjaxResponseSuccess = function(responseContent) {
			var result = document.getElementById("ebx-wcg-result");
			result.innerHTML = responseContent;
		};

		ajaxHandler.handleAjaxResponseFailed = function(responseContent) {
			EBX_Logger.log("AJAX request failed", EBX_Logger.error);
		};

		ajaxHandler.sendRequest(ajaxCallbacks["generateLink"]);
		
		refreshView();
	}
	
	function refreshView() {
		refreshSession();
		refreshViewType();
		manageServiceParameters();
		refreshFirstCallDisplay();
		refreshFeatures();
	}
	
	function manageServiceParameters() {
		var selectedServiceParameters;
		if (isPerspective()) {
			selectedServiceParameters = [];
		} else {
			var selectedService = ebx_form_getValue(getPath("service")).key;
			selectedServiceParameters = serviceParameters[selectedService];
		}
		
		EBX_Utils.forEach(serviceParamIds, function(id) {
			var parameterRow = document.getElementById("ebx-row-" + id);
			if (selectedServiceParameters && EBX_Utils.arrayContains(selectedServiceParameters, id) === true) {
				EBX_Utils.removeCSSClass(parameterRow, CSS_CLASS_HIDDEN);
			} else {
				EBX_Utils.addCSSClass(parameterRow, CSS_CLASS_HIDDEN);
			}
		});
	}
	
	function refreshViewType() {
		var serviceRow = document.getElementById("ebx-row-service");
		var serviceParametersRow = document.querySelector("#ebx-row-service + tr");
		var perspectiveNameRow = document.getElementById("ebx-row-perspectiveName");
		var perspectiveActionIdRow = document.getElementById("ebx-row-perspectiveActionId");
    var perspectiveActionNameRow = document.getElementById("ebx-row-perspectiveActionName");
		var pageSizeRow = document.getElementById("ebx-row-pageSize");
		
		if (isPerspective()) {
			EBX_Utils.addCSSClass(serviceRow, CSS_CLASS_HIDDEN);
			EBX_Utils.addCSSClass(serviceParametersRow, CSS_CLASS_HIDDEN);
			EBX_Utils.removeCSSClass(perspectiveNameRow, CSS_CLASS_HIDDEN);
			EBX_Utils.removeCSSClass(perspectiveActionIdRow, CSS_CLASS_HIDDEN);
      EBX_Utils.removeCSSClass(perspectiveActionNameRow, CSS_CLASS_HIDDEN);

			EBX_Utils.addCSSClass(pageSizeRow, CSS_CLASS_HIDDEN);
			
		} else {
			EBX_Utils.removeCSSClass(serviceRow, CSS_CLASS_HIDDEN);
			EBX_Utils.removeCSSClass(serviceParametersRow, CSS_CLASS_HIDDEN);
			EBX_Utils.addCSSClass(perspectiveNameRow, CSS_CLASS_HIDDEN);
			EBX_Utils.addCSSClass(perspectiveActionIdRow, CSS_CLASS_HIDDEN);
      EBX_Utils.addCSSClass(perspectiveActionNameRow, CSS_CLASS_HIDDEN);

			EBX_Utils.removeCSSClass(pageSizeRow, CSS_CLASS_HIDDEN);
		}
	}
	
	function refreshSession() {
		var session = ebx_form_getValue(getPath("session"));
		var usernameRow = document.getElementById("ebx-row-username");
		var passwordRow = document.getElementById("ebx-row-password");
		var localeRow = document.getElementById("ebx-row-locale");
		var viewTypeRow = document.getElementById("ebx-row-viewType");
		
		if ("ROOT" === session) {
			EBX_Utils.removeCSSClass(usernameRow, CSS_CLASS_HIDDEN);
			EBX_Utils.removeCSSClass(passwordRow, CSS_CLASS_HIDDEN);
			EBX_Utils.removeCSSClass(localeRow, CSS_CLASS_HIDDEN);
			EBX_Utils.removeCSSClass(viewTypeRow, CSS_CLASS_HIDDEN);
		} else {
			EBX_Utils.addCSSClass(usernameRow, CSS_CLASS_HIDDEN);
			EBX_Utils.addCSSClass(passwordRow, CSS_CLASS_HIDDEN);
			EBX_Utils.addCSSClass(localeRow, CSS_CLASS_HIDDEN);
			EBX_Utils.addCSSClass(viewTypeRow, CSS_CLASS_HIDDEN);
		}
	}
	
	function refreshFirstCallDisplay() {
		var firstCallDisplayTypeRow = document.getElementById("ebx-row-serviceParam-firstCallDisplay");
		var firstCallDisplayType = ebx_form_getValue(getPath("serviceParam-firstCallDisplay"));
		
		var firstCallDisplayPredicateRow = document.getElementById("ebx-row-serviceParam-firstCallDisplayPredicate");
		if (!EBX_Utils.matchCSSClass(firstCallDisplayTypeRow, CSS_CLASS_HIDDEN) && "RECORD" === firstCallDisplayType) {
			EBX_Utils.removeCSSClass(firstCallDisplayPredicateRow, CSS_CLASS_HIDDEN);
		} else {
			EBX_Utils.addCSSClass(firstCallDisplayPredicateRow, CSS_CLASS_HIDDEN);
		}
	}
	
	function refreshFeatures(type) {
		if (!type) {
			refreshFeatures("dataset");
			refreshFeatures("view");
			refreshFeatures("record");
			return;
		}
		
		var selectedServiceParameters;
		if (isPerspective()) {
			selectedServiceParameters = [];
			EBX_Utils.addCSSClass(document.getElementById("ebx-row-" + type + "FeaturesType"), CSS_CLASS_HIDDEN);
			EBX_Utils.addCSSClass(document.getElementById("ebx-row-" + type + "FeaturesValues"), CSS_CLASS_HIDDEN);
			
		} else {
			EBX_Utils.removeCSSClass(document.getElementById("ebx-row-" + type + "FeaturesType"), CSS_CLASS_HIDDEN);
			var typeValue = ebx_form_getValue(getPath(type + "FeaturesType"));
			
			var valuesRow = document.getElementById("ebx-row-" + type + "FeaturesValues");
			if ("HIDE_SELECTION" === typeValue || "SHOW_SELECTION" === typeValue) {
				EBX_Utils.removeCSSClass(valuesRow, CSS_CLASS_HIDDEN);
			} else {
				EBX_Utils.addCSSClass(valuesRow, CSS_CLASS_HIDDEN);
			}
		}
	}
	
	function isPerspective() {
		var viewType = ebx_form_getValue(getPath("viewType"));
		var session = ebx_form_getValue(getPath("session"));
		var isPerspective = "PERSPECTIVE" === viewType && "ROOT" === session;
		
		return isPerspective;
	}

  function preview() {
    isPreviewRequested = true;

    setTimeout(function () {
      if (previewCallback != null && isPreviewRequested) {
        isPreviewRequested = false;
        previewCallback();
      }
    }, 200);
  }

  function setPreviewCallback(callback) {
    previewCallback = callback;

    if (isPreviewRequested) {
      isPreviewRequested = false;
      callback();
    }
  }
	
})();
