/* 
 * TODO migrate permalink using the dialog box 
 * TODO resizable
 * TODO many calls even if the dialog box has not been closed: error, ignore, overwrite current dialog box, or stack args & call again just after close?
 */

function EBX_DialogBox() {}

EBX_DialogBox.panelId = "ebx_DialogBox";

EBX_DialogBox.panel = null;
EBX_DialogBox.resize = null;

EBX_DialogBox.currentJSCommandClose = null;

/* 
 * @param argsObj is an object that can contains many attributes (all are optional)
 * header: header HTML content (should be single line and not too long)
 * body: body HTML content
 * footer: footer HTML content
 * focusId: String element id to focus on display (usually the default button)
 * jsCommandClose: javaScript function to call if click on back or push escape key
 */
//[EBX_PUBLIC_API]
ebx_dialogBox_show = function(argsObj) {

	var isInit = false;

	if (EBX_DialogBox.panel === null) {
		EBX_DialogBox.panel = new YAHOO.widget.Panel(EBX_DialogBox.panelId, {
			close: false,
			draggable: false,
			modal: true,
			visible: false,
			fixedcenter: true
		});

		EBX_DialogBox.panel.render(document.body);

		isInit = true;
	}

	EBX_DialogBox.currentJSCommandClose = argsObj.jsCommandClose;

	if (argsObj.header !== undefined) {
		EBX_DialogBox.panel.setHeader(argsObj.header);
	} else {
		EBX_DialogBox.panel.setHeader("");
	}
	if (argsObj.body !== undefined) {
		EBX_DialogBox.panel.setBody(argsObj.body);
	} else {
		EBX_DialogBox.panel.setBody("");
	}
	if (argsObj.footer !== undefined) {
		EBX_DialogBox.panel.setFooter(argsObj.footer);
	} else {
		EBX_DialogBox.panel.setFooter("");
	}

  var dialogBoxElement = EBX_DialogBox.panel.element;
  dialogBoxElement.style.marginRight = YAHOO.widget.Overlay.VIEWPORT_OFFSET + "px";

  EBX_DialogBox.panel.center();
	EBX_DialogBox.panel.show();

	EBX_Loader.stackKeyListener(EBX_Utils.keyCodes.ESCAPE, EBX_DialogBox.clickOnBack);

	if (argsObj.focusId !== undefined && document.getElementById(argsObj.focusId) !== null) {
		document.getElementById(argsObj.focusId).focus();
	}

	if (isInit === true) {
		var mask = document.getElementById(EBX_DialogBox.panelId + "_mask");
		YAHOO.util.Event.on(mask, "click", EBX_DialogBox.clickOnBack);
		mask.title = EBX_LocalizedMessage.dialogBox_maskTooltip;

		//		Disable resize for now (too complicated for the 1st lot)
		//		var height = EBX_DialogBox.panel.element.offsetHeight;
		//		var width = EBX_DialogBox.panel.element.offsetWidth;
		//
		//		EBX_DialogBox.resize = new YAHOO.util.Resize(EBX_DialogBox.panelId, {
		//			handles: [ "br" ],
		//			useShim: true,
		//			minHeight: height,
		//			minWidth: width,
		//			proxy: true
		//		});
		//		EBX_DialogBox.resize.originalHeight = height;
		//		EBX_DialogBox.resize.originalWidth = width;
		//		EBX_DialogBox.resize.originalLeft = EBX_DialogBox.panel.element.offsetLeft;
		//		EBX_DialogBox.resize.originalTop = EBX_DialogBox.panel.element.offsetTop;
		//
		//		EBX_DialogBox.resize.on("startResize", function(args) {
		//
		//			var D = YAHOO.util.Dom;
		//
		//			var clientRegion = D.getClientRegion();
		//			var elRegion = D.getRegion(this.element);
		//
		//			EBX_DialogBox.resize.set("maxWidth", clientRegion.right - elRegion.left - YAHOO.widget.Overlay.VIEWPORT_OFFSET);
		//			EBX_DialogBox.resize.set("maxHeight", clientRegion.bottom - elRegion.top - YAHOO.widget.Overlay.VIEWPORT_OFFSET);
		//
		//			EBX_DialogBox.resize.set("minWidth", clientRegion.width / 2 - elRegion.left/* + 100*/);
		//			EBX_DialogBox.resize.set("minHeight", clientRegion.height / 2 - elRegion.top/* + 50*/);
		//		}, EBX_DialogBox.panel, true);
		//
		//		EBX_DialogBox.resize.on("proxyResize", function(args) {
		//			var proxy = EBX_DialogBox.resize._proxy;
		//			var panelHeight = args.height;
		//			var panelWidth = args.width;
		//
		//			var heightDiff = panelHeight - EBX_DialogBox.resize.originalHeight;
		//			var widthDiff = panelWidth - EBX_DialogBox.resize.originalWidth;
		//
		//			var targetHeight = EBX_DialogBox.resize.originalHeight + heightDiff * 2;
		//			var targetLeft = EBX_DialogBox.resize.originalLeft - widthDiff;
		//			var targetWidth = EBX_DialogBox.resize.originalWidth + widthDiff * 2;
		//			var targetTop = EBX_DialogBox.resize.originalTop - heightDiff;
		//
		//			proxy.style.left = targetLeft + "px";
		//			proxy.style.top = targetTop + "px";
		//			proxy.style.width = targetWidth + "px";
		//			proxy.style.height = targetHeight + "px";
		//		}, null, true);
		//
		//		EBX_DialogBox.resize
		//				.on(
		//						"endResize",
		//						function(args) {
		//							var panelHeight = args.height;
		//							var panelWidth = args.width;
		//
		//							var heightDiff = panelHeight - EBX_DialogBox.resize.originalHeight;
		//							var widthDiff = panelWidth - EBX_DialogBox.resize.originalWidth;
		//
		//							var targetHeight = EBX_DialogBox.resize.originalHeight + heightDiff * 2;
		//							var targetWidth = EBX_DialogBox.resize.originalWidth + widthDiff * 2;
		//
		//							this.cfg.setProperty("height", targetHeight + "px");
		//							this.cfg.setProperty("width", targetWidth + "px");
		//							this.moveTo(EBX_DialogBox.resize.originalLeft - widthDiff, EBX_DialogBox.resize.originalTop - heightDiff);
		//
		//							args.target.originalHeight = targetHeight;
		//							args.target.originalWidth = targetWidth;
		//							args.target.originalLeft = EBX_DialogBox.resize.originalLeft - widthDiff;
		//							args.target.originalTop = EBX_DialogBox.resize.originalTop - heightDiff;
		//
		//							EBX_DialogBox.panel.body.style.height = (targetHeight - EBX_DialogBox.panel.header.offsetHeight - EBX_DialogBox.panel.footer.offsetHeight)
		//									+ "px";
		//						}, EBX_DialogBox.panel, true);
	}

	// TODO resize must be reset to auto
	// XXX maybe do something like that? (no it does not work well)
	//	EBX_DialogBox.resize.reset();
};

EBX_DialogBox.clickOnBack = function() {
	if (EBX_DialogBox.currentJSCommandClose !== null) {
		window.setTimeout(EBX_DialogBox.currentJSCommandClose, 0);
	}
};

//[EBX_PUBLIC_API]
ebx_dialogBox_hide = function() {
	EBX_DialogBox.panel.hide();
	EBX_Loader.removeKeyListener(EBX_Utils.keyCodes.ESCAPE, EBX_DialogBox.clickOnBack);
};

var ebx_confirm_currentJsCommand_yes = null;
var ebx_confirm_currentJsCommand_no = null;

/* Pops a modal dialog box that displays a question, a positive and a negative answer.
 * By a click on the back, the user produces the negative answer.
 * 
 * @param argsObj is an object that can contains many attributes:
 * question(mandatory): String with HTML single line and not too long
 * message: String with HTML free style
 * jsCommandYes(mandatory):  JavaScript command to call if answer is positive
 * labelYes: overwrite the default positive label
 * jsCommandNo: JavaScript command to call if answer is negative
 * labelNo: overwrite the default negative label
 */
//[EBX_PUBLIC_API]
ebx_confirm = function(argsObj) {

	ebx_confirm_currentJsCommand_yes = argsObj.jsCommandYes;

	if (argsObj.jsCommandNo !== undefined) {
		ebx_confirm_currentJsCommand_no = argsObj.jsCommandNo;
	}

	var questionLines = argsObj.question.split("\n");

	var headerHTML = [];
	headerHTML.push("<h2 class='ebx_dialog_header'>", questionLines.shift(), "</h2>");

	var bodyHTML = [];
	if (questionLines.length > 0 || argsObj.message !== undefined) {
		bodyHTML.push("<div class=\"ebx_ContainerWithTextPadding\">");
		if (questionLines.length > 0) {
			bodyHTML.push(questionLines.join("<br/>"));
		}
		if (argsObj.message !== undefined) {
			bodyHTML.push(argsObj.message);
		}
		bodyHTML.push("</div>");
	}

	var footerHTML = ebx_confirm_footerTemplate;
	footerHTML = footerHTML.replace(new RegExp(ebx_confirm_yesButtonLabelPattern, 'g'), argsObj.labelYes !== undefined ? argsObj.labelYes
			: EBX_LocalizedMessage.dialogBox_confirm_yes);
	footerHTML = footerHTML.replace(new RegExp(ebx_confirm_noButtonLabelPattern, 'g'), argsObj.labelNo !== undefined ? argsObj.labelNo
			: EBX_LocalizedMessage.dialogBox_confirm_no);
	footerHTML = "<div class=\"ebx_DialogBoxFooterToolbar\">" + footerHTML + "</div>";

	ebx_dialogBox_show({
		header: headerHTML.join(""),
		body: bodyHTML.join(""),
		footer: footerHTML,
		focusId: ebx_confirm_yesButtonId,
		jsCommandClose: "ebx_confirm_replyNo();"
	});
};

ebx_confirm_replyYes = function() {
	ebx_dialogBox_hide();
	if (ebx_confirm_currentJsCommand_yes !== null) {
		window.setTimeout(ebx_confirm_currentJsCommand_yes, 0);
	}
	ebx_confirm_reset();
};

ebx_confirm_replyNo = function() {
	ebx_dialogBox_hide();
	if (ebx_confirm_currentJsCommand_no !== null) {
		window.setTimeout(ebx_confirm_currentJsCommand_no, 0);
	}
	ebx_confirm_reset();
};

ebx_confirm_reset = function() {
	ebx_confirm_currentJsCommand_yes = null;
	ebx_confirm_currentJsCommand_no = null;
};

/* Pops a modal dialog box that displays a message and a OK button.
 * By a click on the back, the user closes the dialog.
 * 
 * @param message String with HTML single line and not too long
 * @param otherLines [optional] String with HTML free style to put in the body of the dialog box
 */
//[EBX_PUBLIC_API]
ebx_alert = function(message, otherLines) {
	var messageLines = message.split("\n");

	var headerHTML = [];
	headerHTML.push("<h2 class='ebx_dialog_header'>", messageLines.shift(), "</h2>");

	var bodyHTML = [];
	if (messageLines.length > 0 || otherLines !== undefined) {
		bodyHTML.push("<div class=\"ebx_ContainerWithTextPadding\">");
		if (messageLines.length > 0) {
			bodyHTML.push(messageLines.join("<br/>"));
		}
		if (otherLines !== undefined) {
			bodyHTML.push(otherLines);
		}
		bodyHTML.push("</div>");
	}

	var footerHTML = [];
	footerHTML.push("<div class=\"ebx_DialogBoxFooterToolbar\">");
	footerHTML.push(ebx_alert_footer_content);
	footerHTML.push("</div>");

	ebx_dialogBox_show({
		header: headerHTML.join(""),
		body: bodyHTML.join(""),
		footer: footerHTML.join(""),
		focusId: ebx_alert_okButtonId,
		jsCommandClose: "ebx_alert_replyOK();"
	});
};

ebx_alert_replyOK = function() {
	ebx_dialogBox_hide();
};
