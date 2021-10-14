function EBX_Doc() {

}

EBX_Doc.popupName = "ebx_HelpBook";

EBX_Doc.launchPopup = function(url) {
	var helpPopUp = window.open(url, EBX_Doc.popupName, "toolbar=yes, menubar=no, location=no, scrollbars=yes, resizable=yes, width=850, height=600");
	try {
		helpPopUp.focus();
	} catch (e) {}

};
