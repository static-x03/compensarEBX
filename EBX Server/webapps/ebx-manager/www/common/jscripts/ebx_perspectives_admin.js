function ebx_perspectiveAdmin_onServiceChange(selection, jsonParameters) {
	var obj = JSON.parse(jsonParameters);

	if (selection == null) {
		document.getElementById(obj.id).innerHTML = "";
		return;
	}

	var ajaxHandler = new EBX_AJAXResponseHandler();

	ajaxHandler.handleAjaxResponseSuccess = function(responseContent) {
		var item = document.getElementById(obj.id);
		if (item == null) {
			document.getElementById(obj.id).innerHTML = "";
		} else {
			document.getElementById(obj.id).innerHTML = responseContent;
		}
	};

	ajaxHandler.handleAjaxResponseFailed = function(responseContent) {
		document.getElementById(obj.id).innerHTML = "";
	};

	var params = "__KEY__=" + encodeURIComponent(selection.key);

	var form = document.forms[EBX_Form.WorkspaceFormId];
	if (form != null) {
		for ( var i = 0; i < form.length; ++i) {
			var elem = form.elements[i];

			if (elem.name.indexOf("__Action_ServiceParameter_") == 0) {
				params += "&" + elem.name + "=" + encodeURIComponent(elem.value);
			}
		}
	}

	ajaxHandler.sendRequest(obj.url + "&" + params);
}

function ebx_perspectiveAdmin_onMenuItemTypeChange(selection, rootId) {
	var sectionDisplay = "none";
	var groupOrActionDisplay = "none";
	var actionDisplay = "none";

	if (selection != null) {
		switch (selection.key) {
			case "section":
				sectionDisplay = "";
				break;

			case "group":
				groupOrActionDisplay = "";
				break;

			case "action":
				groupOrActionDisplay = "";
				actionDisplay = "";
				break;
		}
	}

  document.getElementById(rootId + "_Name").style.display = actionDisplay;
	document.getElementById(rootId + "_HasTopSeparator").style.display = sectionDisplay;
	document.getElementById(rootId + "_Parent").style.display = groupOrActionDisplay;
	document.getElementById(rootId + "_Icon").style.display = groupOrActionDisplay;
	document.getElementById(rootId + "_Action").style.display = actionDisplay;
	document.getElementById(rootId + "_SelectionOnClose").style.display = actionDisplay;
}

function ebx_perspectiveAdmin_onMenuItemIconTypeChange(selection, rootId) {
	var cssDisplay = "none";
	var urlDisplay = "none";

	if (selection != null) {
		switch (selection) {
			case "css":
				cssDisplay = "";
				break;

			case "url":
				urlDisplay = "";
				break;
		}
	}

	document.getElementById(rootId + "_css").style.display = cssDisplay;
	document.getElementById(rootId + "_url").style.display = urlDisplay;
}

function ebx_perspectiveAdmin_displayIconSelector(iconDisplayId, toggleButtonId, title, iconNamesUrl) {
	var toggleButton = document.getElementById(toggleButtonId);
	toggleButton.style.cursor = "wait";

	var callback = new Object();

	callback.success = function(response) {
		var jsonData = JSON.parse(response.responseText);

		var panel = ebx_perspectiveAdmin_getIconSelectorPanel(title, jsonData.iconNames);
		panel.cfg.setProperty('context', [ iconDisplayId, 'tl', 'bl' ]);
		panel.toggleButtonId = toggleButtonId;
		panel.iconDisplayId = iconDisplayId;

		var mask = ebx_perspectiveAdmin_getMask();
		document.body.appendChild(mask);
		mask.style.display = "";

		toggleButton.style.cursor = "default";
		panel.show();
	};

	callback.failure = function(response) {
		toggleButton.style.cursor = "default";
		EBX_ButtonUtils.setStateToToggleButton(toggleButton, false);
	};

	callback.cache = true;

	YAHOO.util.Connect.asyncRequest('GET', iconNamesUrl, callback);
}

function ebx_perspectiveAdmin_hideIconSelector() {
	var panel = ebx_perspectiveAdmin_getIconSelectorPanel();

	panel.hide();
	ebx_perspectiveAdmin_getMask().style.display = "none";

	if (panel.toggleButtonId != null) {
		var toggleButton = document.getElementById(panel.toggleButtonId);
		EBX_ButtonUtils.setStateToToggleButton(toggleButton, false);
		panel.toggleButtonId = null;
	}
}

function ebx_perspectiveAdmin_onIconSelectorItemClick(iconName) {
	var iconClassName = "fa-" + iconName;

	var panel = ebx_perspectiveAdmin_getIconSelectorPanel();

	if (panel.iconDisplayId != null) {
		var iconDisplay = document.getElementById(panel.iconDisplayId);

		var className = iconDisplay.className;
		if (className == null) {
			iconDisplay.className = iconClassName;
		} else {
			var classNames = className.split(" ");

			var className = "";
			for ( var index = 0; index < classNames.length; ++index) {
				if (classNames[index].indexOf("fa-") != 0) {
					className += classNames[index];
					className += " ";
				}
			}

			className += iconClassName;
			iconDisplay.className = className;
		}
	}

	document.getElementsByName("__Icon_Reference_Css")[0].value = iconClassName;
	ebx_perspectiveAdmin_hideIconSelector();
}

function ebx_perspectiveAdmin_getIconSelectorPanel(title, iconNames) {
	var panelId = "ebx_perspectiveAdmin_IconSelector";

	var panel = window[panelId];

	if (iconNames == null) {
		return panel;
	}

	if (panel == null) {
		panel = new YAHOO.widget.Overlay("Ebx_IconSelectorPanel", {
			constraintoviewport: true,
			visible: false,
		});

		panel.render(document.body);
		window[panelId] = panel;
	}

	var content = "<div id='Ebx_IconSelectorPanel_Body' class='ebx_iconSelector ebx_ColoredBorder'>";
	if (title != null) {
		content += "<div class='ebx_iconSelectorHeader'>";
		content += title;
		content += "</div>";
	}
	content += "<div class='ebx_iconSelectorContent'>";

	var maxPos = iconNames.length;

	var pos = 0;
	while (pos < maxPos) {
		for ( var column = 0; (column < 15) && (pos < maxPos); ++column) {
			if (column >= 1) {
				content += "&nbsp;";
			}
			var iconName = iconNames[pos++];
			content += "<span class='ebx_iconSelectorItem fa fa-";
			content += iconName;
			content += "' onclick='ebx_perspectiveAdmin_onIconSelectorItemClick(\"" + iconName + "\")'></span>";
		}
		content += "<br/>";
	}
	content += "</div>";
	content += "</div>";
	panel.setBody(content);

	ebx_forceCSSReloadForIE8();

	return panel;
}

function ebx_perspectiveAdmin_getMask() {
	var maskId = "ebx_perspectiveAdmin_Mask";

	var mask = document.getElementById(maskId);
	if (mask == null) {
		mask = document.createElement("div");
		mask.id = maskId;
		mask.className = "ebx_PageMask";
		mask.style.display = "none";
		mask.onclick = ebx_perspectiveAdmin_hideIconSelector;
	}

	return mask;
}

function ebx_forceCSSReloadForIE8() {
	if ((YAHOO.env.ua.ie > 0) && (YAHOO.env.ua.ie <= 8)) {
		// This code is required with IE8 to reload CSS :before selectors.

		var head = document.getElementsByTagName('head')[0], style = document.createElement('style');
		style.type = 'text/css';
		style.styleSheet.cssText = ':before,:after{content:none !important';
		head.appendChild(style);
		setTimeout(function() {
			head.removeChild(style);
		}, 0);
	}
}
