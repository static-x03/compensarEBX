/*
 * This object must be initialized calling EBX_RecommendedPerspectives.init(selectedItemPath).
 * Only then, other methods will be available.
 */
var EBX_RecommendedPerspectives = (function() {
	"use strict";
	
	var selectedItemPath;
	var hasSelection = true;
	
	return {
		init: init
	};
	
	function init(selectedItemPath) {
		setSelectedItemPath(selectedItemPath);
		hasSelection = getSelectedItemRow() != null;
		fixLayout();
		EBX_LayoutManager.resizeWorkspaceListeners.push(fixLayout);
		
// -------------------- //
// ACCESSIBLE FUNCTIONS //
// -------------------- //
		
		EBX_RecommendedPerspectives = {
			select: select,
			action: action,
			eventOnSelection: eventOnSelection,
			moveTop: moveTop,
			moveUp: moveUp,
			moveDown: moveDown,
			moveBottom: moveBottom,
			deleteRow: deleteRow
		};
	}
	
// -------------- //
// IMPLEMENTATION //
// -------------- //
	
	function setSelectedItemPath(newPath) {
		selectedItemPath = newPath;
	}
	
	function getSelectedItemPath() {
		return selectedItemPath;
	}
	
	function getSelectedItemRow() {
		if (!hasSelection) {
			return null;
		}
		
		var selectedItemPath = getSelectedItemPath();
		if (!EBX_FormNodeIndex.isFormNodeDefined(selectedItemPath)) {
			return null;
		}
		
		var selectedItemRadioButtonNode = EBX_FormNodeIndex.getFormNode(selectedItemPath);
		if (!selectedItemRadioButtonNode) {
			return null;
		}

		var editor = selectedItemRadioButtonNode.getEditor();
		if (!editor) {
			return null;
		}
		
		var radioButtonElements = editor.getRdoBtns();
		
		var selectedRadioButton = EBX_Utils.filter(radioButtonElements, function(radio) {
			return radio.checked === true;
		})[0];
		
		if (!selectedRadioButton) {
			return null;
		}
		
		return selectedRadioButton.parentElement.parentElement;
	}
	
	function select(row) {
		EBX_Utils.forEach(row.parentElement.children, function(row) {
			EBX_Utils.removeCSSClass(row, "ebx_Selected");
		});
		
		EBX_Utils.addCSSClass(row, "ebx_Selected");
		hasSelection = true;
		row.children[0].children[0].click();
	}
	
	function action(url) {
		var ajaxHandler = new EBX_AJAXResponseHandler();
		
		ajaxHandler.sendRequest(url);
	}
	
	function eventOnSelection(url) {
		var selectedRow = getSelectedItemRow();
		if (selectedRow !== null) {
			window.location.href = url;
		}
	}
	
	function moveTop(ajaxUrl) {
		var selectedRow = getSelectedItemRow();
		if (selectedRow === null) return;
		
		var parent = selectedRow.parentElement;
		
		var firstElement = parent.children[0];
		if (selectedRow === firstElement) return;
		
		var ajaxHandler = new EBX_AJAXResponseHandler();
		
		ajaxHandler.handleAjaxResponseSuccess = function(responseContent) {
			parent.insertBefore(selectedRow, firstElement);
		};
		
		ajaxHandler.sendRequest(ajaxUrl);
	}
	
	function moveUp(ajaxUrl) {
		var selectedRow = getSelectedItemRow();
		if (selectedRow === null) return;
		
		var parent = selectedRow.parentElement;
		
		var previousElement = EBX_Utils.previousElementSibling(selectedRow);
		if (previousElement === null) return;
		
		var ajaxHandler = new EBX_AJAXResponseHandler();
		
		ajaxHandler.handleAjaxResponseSuccess = function(responseContent) {
			parent.insertBefore(selectedRow, previousElement);
		};
		
		ajaxHandler.sendRequest(ajaxUrl);
	}
	
	function moveDown(ajaxUrl) {
		var selectedRow = getSelectedItemRow();
		if (selectedRow === null) return;
		
		var parent = selectedRow.parentElement;
		
		var nextElement = EBX_Utils.nextElementSibling(selectedRow);
		if (nextElement === null) return;
		
		var ajaxHandler = new EBX_AJAXResponseHandler();
		
		ajaxHandler.handleAjaxResponseSuccess = function(responseContent) {
			parent.insertBefore(selectedRow, EBX_Utils.nextElementSibling(nextElement));
		};
		
		ajaxHandler.sendRequest(ajaxUrl);
	}
	
	function moveBottom(ajaxUrl) {
		var selectedRow = getSelectedItemRow();
		if (selectedRow === null) return;
		
		var parent = selectedRow.parentElement;
		
		var lastElement = parent.children[parent.children.length - 1];
		if (selectedRow === lastElement) return;
		
		var ajaxHandler = new EBX_AJAXResponseHandler();
		
		ajaxHandler.handleAjaxResponseSuccess = function(responseContent) {
			parent.insertBefore(selectedRow, EBX_Utils.nextElementSibling(lastElement));
		};
		
		ajaxHandler.sendRequest(ajaxUrl);
	}
	
	function deleteRow(ajaxUrl) {
		var selectedRow = getSelectedItemRow();
		if (selectedRow === null) return;
		
		hasSelection = false;
		
		var ajaxHandler = new EBX_AJAXResponseHandler();
		
		ajaxHandler.handleAjaxResponseSuccess = function(responseContent) {
			if (responseContent) {
				var json = YAHOO.lang.JSON.parse(responseContent);
				var redirectUrl = json.redirectUrl;
				if (redirectUrl)
					window.location.href = redirectUrl;
			}
			
			selectedRow.parentElement.removeChild(selectedRow);
			fixLayout();
		};
		
		ajaxHandler.sendRequest(ajaxUrl);
	}
	
	function fixLayout() {
		var header = document.querySelector("#ebx-defaultPerspectives .ebx-list-header");
		if (!header) return;
		
		var headerItems = document.querySelector("#ebx-defaultPerspectives .ebx-list-header > div");
		if (!headerItems) return;
		
		var firstRow = document.querySelector("#ebx-defaultPerspectives label");
		if (!firstRow) return;
		
		copyWidth(firstRow.parentElement, header);
		copyWidth(firstRow.children[1], headerItems.children[0]);
		copyWidth(firstRow.children[2], headerItems.children[1]);
		
		function copyWidth(from, to, offset) {
			var width = from.offsetWidth;
			to.style.width = width + "px";
		}
	}
	
})();
