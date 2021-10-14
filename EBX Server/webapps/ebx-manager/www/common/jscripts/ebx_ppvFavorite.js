var EBX_PpvFavorite = (function() {
	"use strict";
	
	var defaultPerspectiveName;
	var buttonConfigurations = [];
	
// -------------------- //
// ACCESSIBLE FUNCTIONS //
// -------------------- //
	
	return {
		setFavoritePerspectiveName: setFavoritePerspectiveName,
		registerButtons: registerButtons,
		initDefaultPerspectiveButtons: initDefaultPerspectiveButtons,
		setDefaultPerspective: setDefaultPerspective
	};
	
// -------------- //
// IMPLEMENTATION //
// -------------- //
	
	function setFavoritePerspectiveName(name) {
		defaultPerspectiveName = name;
	}
	
	function registerButtons(perspectiveName, setButtonId, getButtonId) {
		buttonConfigurations.push({
			perspectiveName: perspectiveName,
			setButtonId: setButtonId,
			getButtonId: getButtonId
		});
	}
	
	function initDefaultPerspectiveButtons(perspectiveName, setButtonId, getButtonId) {
		var setButton = document.getElementById(setButtonId);
		var getButton = document.getElementById(getButtonId);
		
		if (perspectiveName === defaultPerspectiveName) {
			setButton.style.display = 'none';
			getButton.style.display = 'inline';
			
		} else {
			setButton.style.display = 'inline';
			getButton.style.display = 'none';
		}
	}
	
	function setDefaultPerspective(button, event, url, perspectiveName) {
		var cursor = button.style.cursor;

		button.style.cursor = "wait";
		
		ajaxCall(url, function() {
			button.style.cursor = cursor;

			setFavoritePerspectiveName(perspectiveName);
			refreshButtons();
		});
	}
	
	function refreshButtons() {
		EBX_Utils.forEach(buttonConfigurations, function(config) {
			initDefaultPerspectiveButtons(
					config.perspectiveName,
					config.setButtonId,
					config.getButtonId);
		});
	}
	
	function ajaxCall(url, callback) {
		var handler = new YAHOO.util.XHRDataSource();
		
		handler.sendRequest(url, {
			success: callback,
			failure: callback
		});
	}
	
})();