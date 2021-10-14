function EBX_Utils(){

}

EBX_Utils.CSSClassSeparator = " "; /* DO NOT CHANGE : HTML/CSS Standard */
EBX_Utils.matchCSSClass = function(element, cssClass){
    if (element.className == null) 
        return false;
    
    var classes = element.className.split(EBX_Utils.CSSClassSeparator);
    for (var i = 0; i < classes.length; i++) {
        if (classes[i] == cssClass) 
            return true;
    }
    return false;
};

EBX_Utils.addCSSClass = function(element, cssClass) {
	if (element.className === undefined || element.className === null) {
		return false;
	}

	if (!EBX_Utils.matchCSSClass(element, cssClass)) {
		if (element.className !== "") {
			element.className += EBX_Utils.CSSClassSeparator;
		}
		element.className += cssClass;
	}

	return true;
};

/**
 * Return true if the CSS Class was find (and so removed)
 */
EBX_Utils.removeCSSClass = function(element, cssClass){
    if (element.className == null) 
        return false;
    
    var ret = false;
    var targetClassName = "";
    var firstLoop = true;
    var classes = element.className.split(EBX_Utils.CSSClassSeparator);
    for (var i = 0; i < classes.length; i++) {
        if (classes[i] == cssClass) 
            ret = true;
        else 
            targetClassName += (firstLoop ? "" : EBX_Utils.CSSClassSeparator) +
            classes[i];
        
        firstLoop = false;
    }
    element.className = targetClassName;
    return ret;
};

EBX_Utils.getFirstParentMatchingCSSClass = function(element, cssClass){
    var parent = element.parentNode;
    while (parent != null) {
        if (EBX_Utils.matchCSSClass(parent, cssClass)) 
            return parent;
        else 
            parent = parent.parentNode;
    }
    return null;
};

EBX_Utils.getRecursiveChildrenMatchingTagName = function(element, tagName){
    var children = new Array();
    
    for (var i = 0; i < element.childNodes.length; i++) {
        EBX_Utils.pushRecursiveChildrenMatchingTagName(element.childNodes[i], tagName, children);
    }
    
    return children;
};
EBX_Utils.pushRecursiveChildrenMatchingTagName = function(element, tagName, arrayToFill){
    /* some nodes are not elements (but text for example) */
    if (element.tagName != null) 
        if (element.tagName.toLowerCase() == tagName.toLowerCase()) 
            arrayToFill.push(element);
    
    for (var i = 0; i < element.childNodes.length; i++) {
        EBX_Utils.pushRecursiveChildrenMatchingTagName(element.childNodes[i], tagName, arrayToFill);
    }
};

EBX_Utils.urlParams = null;
EBX_Utils.getUrlParams = function(){
    if (EBX_Utils.urlParams == null) {
        EBX_Utils.urlParams = new Array();
        var paramCouples = location.search.substr(1).split("&");
        var paramCouple;
        for (var i in paramCouples) {
            paramCouple = paramCouples[i].split("=");
            EBX_Utils.urlParams[paramCouple[0]] = paramCouple[1];
        }
    }
    return EBX_Utils.urlParams;
};

EBX_Utils.expandAllParentYUINodes = function(yuiNode){
    var parentNode = yuiNode;
    while (parentNode != null) {
        parentNode.expand();
        parentNode = parentNode.parent;
    }
};

function EBX_Doc(){
}

EBX_Doc.popupName = "ebx_HelpBook";
EBX_Doc.launchPopup = function(url){
    var helpPopUp = window.open(url, EBX_Doc.popupName, "toolbar=yes, menubar=no, location=no, scrollbars=yes, resizable=yes, width=850, height=600");
    
    return helpPopUp;
};
