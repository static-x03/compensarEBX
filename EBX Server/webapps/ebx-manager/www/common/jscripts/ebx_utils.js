/*
 * Copyright TIBCO Software Inc. 2001-2021. All rights reserved.
 */

/** START EBX_Utils * */

// this is just for IE8; it can be removed when IE8 will no more be supported
// piece of code found on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/gm, '');
  };
}

var EBX_PageId = undefined;

function EBX_Utils() {

}

EBX_Utils.keyCodes = {
  LEFT_MOUSE_BUTTON: 1,

  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,

  SHIFT: 16,
  CTRL: 17,
  ALT: 18,

  PAUSE: 19,
  CAPS_LOCK: 20,

  ESCAPE: 27,

  SPACE: 32,

  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,

  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,

  DELETE: 46,

  KEY_V: 86,

  WIN_KEY: 91,
  WIN_MENU: 93,
  NUMPAD_PLUS: 107,
  NUMPAD_MINUS: 109,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,

  NUM_LOCK: 145,
  SCROLL_LOCK: 145,

  LETTER_C: 67,
  LETTER_V: 86
};

// return true if pressed key is F1 ... F12
EBX_Utils.isFunctionKey = function (keyCode) {
  if (keyCode >= 112 && keyCode <= 123) {
    return true;
  }
  return false;
};
EBX_Utils.isArrowKey = function (keyCode) {
  if (keyCode >= 37 && keyCode <= 40) {
    return true;
  }
  return false;
};

EBX_Utils.getTargetElement = function (event) {
  if (EBX_LayoutManager.isIE) {
    return event.srcElement;
  } else {
    return event.target;
  }
};

EBX_Utils.arrayContains = function (array, item) {
  var array_length = array.length;
  for (var i = 0; i < array_length; i++) {
    if (array[i] === item) {
      return true;
    }
  }
  return false;
};

EBX_Utils.indexOf = function (array, item) {
  if (Array.indexOf) {
    return array.indexOf(item);
  }

  var array_length = array.length;
  for (var i = 0; i < array_length; i++) {
    if (array[i] === item) {
      return i;
    }
  }
  return -1;
};

EBX_Utils.map = function map(array, callback) {
  if (array.map) {
    return array.map(callback);
  }

  var length = array.length;
  var result = new Array(length);

  for (var i = 0; i < length; i++) {
    result[i] = callback(array[i], i, array);
  }

  return result;
};

EBX_Utils.filter = function filter(array, callback) {
  if (array.filter) {
    return array.filter(callback);
  }

  var length = array.length;
  var result = [];

  for (var i = 0; i < length; i++) {
    var item = array[i];
    if (callback(item, i, array)) {
      result.push(item);
    }
  }

  return result;
};

EBX_Utils.filterObject = function filter(object, callback) {
  var result = {};

  for (var key in object) {
    if (!object.hasOwnProperty(key)) {
      continue;
    }

    var value = object[key];
    if (callback(value, key, object)) {
      result[key] = value;
    }
  }

  return result;
};

EBX_Utils.forEach = function forEach(array, callback) {
  if (array.forEach) {
    return array.forEach(callback);
  }

  var length = array.length;

  for (var i = 0; i < length; i++) {
    callback(array[i], i, array);
  }
};

EBX_Utils.isArray = function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }

  return Object.prototype.toString.call(arg) === '[object Array]';
};

EBX_Utils.childElementCount = function (element) {
  if (EBX_LayoutManager.isIE8 === false) {
    return element.childElementCount;
  }

  var child = EBX_Utils.firstElementChild(element);
  if (child === null) {
    return 0;
  }
  var i = 1;

  while ((child = EBX_Utils.nextElementSibling(child)) !== null) {
    i++;
  }
  return i;
};

/* DO NOT CHANGE : HTML/CSS Standard */
EBX_Utils.CSSClassSeparator = " ";

EBX_Utils.matchCSSClass = function (element, cssClass) {
  if (element.className === undefined || element.className === null || element.className.split === undefined) {
    return false;
  }

  return EBX_Utils.arrayContains(element.className.split(EBX_Utils.CSSClassSeparator), cssClass);
};

EBX_Utils.addCSSClass = function (element, cssClass) {
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

EBX_Utils.removeCSSClass = function (element, cssClass) {
  if (element.className === undefined || element.className === null) {
    return false;
  }
  if (cssClass === undefined || cssClass === null || cssClass === "") {
    return false;
  }
  if (!EBX_Utils.matchCSSClass(element, cssClass)) {
    return true;
  }

  element.className = EBX_Utils.getCSSClassWithOneRemoved(element.className, cssClass);

  return true;
};
EBX_Utils.getCSSClassWithOneRemoved = function (className, cssClassToRemove) {
  var ret = "";

  var classes = className.split(EBX_Utils.CSSClassSeparator);
  var classes_length = classes.length;
  for (var i = 0; i < classes_length; i++) {
    if (classes[i] !== "" && classes[i] !== cssClassToRemove) {
      if (i !== 0) {
        ret += EBX_Utils.CSSClassSeparator;
      }
      ret += classes[i];
    }
  }

  return ret;
};

EBX_Utils.getFirstDirectChildMatchingCSSClass = function (element, cssClass) {
  var child = element.firstChild;
  if (child === null) {
    return null;
  }
  do {
    if (EBX_Utils.matchCSSClass(child, cssClass)) {
      return child;
    }
  } while ((child = child.nextSibling));

  return null;
};

EBX_Utils.getFirstRecursiveChildMatchingCSSClass = function (element, cssClass) {
  return element.querySelector("." + cssClass);
};

EBX_Utils.getRecursiveChildrenMatchingCSSClass = function (element, cssClass) {
  var result, i, len, children;

  result = element.querySelectorAll("." + cssClass);

  // use a static array instead of a risky and variable (and not performant) NodeList
  children = [];

  for (i = 0, len = result.length; i < len; i++) {
    children.push(result[i]);
  }

  return children;
};

EBX_Utils.getAllChildFormElements = function (element) {
  var result, i, len, children;

  result = element.querySelectorAll("input,select,textarea,button");

  // use a static array instead of a risky and variable (and not performant) NodeList
  children = [];

  for (i = 0, len = result.length; i < len; i++) {
    // copy only elements having a name parameter
    if (result[i].name !== undefined) {
      children.push(result[i]);
    }
  }

  return children;
};

EBX_Utils.getFirstParentMatchingCSSClass = function (element, cssClass) {
  var parent = element.parentNode;
  while (parent !== null) {
    if (EBX_Utils.matchCSSClass(parent, cssClass)) {
      return parent;
    } else {
      parent = parent.parentNode;
    }
  }
  return null;
};
EBX_Utils.getFirstParentMatchingTagName = function (element, tagName) {
  var parent = element.parentNode;
  while (parent !== null) {
    if (parent.tagName !== undefined && parent.tagName.toLowerCase() == tagName.toLowerCase()) {
      return parent;
    } else {
      parent = parent.parentNode;
    }
  }
  return null;
};
EBX_Utils.hasParentMatchingId = function (element, id) {
  var parent = element.parentNode;
  while (parent !== null) {
    if (parent.id === id) {
      return true;
    } else {
      parent = parent.parentNode;
    }
  }
  return false;
};

EBX_Utils.getFirstDirectChildMatchingTagName = function (element, tagName) {
  var child = element.firstChild;
  if (child === null) {
    return null;
  }
  do {
    /* some nodes are not elements (but text for example) */
    if (child.tagName !== undefined) {
      if (child.tagName.toLowerCase() == tagName.toLowerCase()) {
        return child;
      }
    }
  } while ((child = child.nextSibling));

  return null;
};
EBX_Utils.getFirstRecursiveChildMatchingTagName = function (element, tagName) {
  var findAmongDirectChildren = EBX_Utils.getFirstDirectChildMatchingTagName(element, tagName);

  if (findAmongDirectChildren !== null) {
    return findAmongDirectChildren;
  }

  var child = element.firstChild;
  if (child === null) {
    return null;
  }
  do {
    findAmongDirectChildren = EBX_Utils.getFirstRecursiveChildMatchingTagName(child, tagName);
    if (findAmongDirectChildren !== null) {
      return findAmongDirectChildren;
    }
  } while ((child = child.nextSibling));

  return null;
};

EBX_Utils.nextElementSibling = function (element) {
  while (element.nextSibling !== null) {
    if (element.nextSibling.nodeType === 1) {
      return element.nextSibling;
    }
    element = element.nextSibling;
  }
  return null;
};

EBX_Utils.previousElementSibling = function (element) {
  while (element.previousSibling !== null) {
    if (element.previousSibling.nodeType === 1) {
      return element.previousSibling;
    }
    element = element.previousSibling;
  }
  return null;
};

EBX_Utils.firstElementChild = function (element) {
  if (element.firstChild === null) {
    return null;
  }
  if (element.firstChild.nodeType === 1) {
    return element.firstChild;
  }
  element = element.firstChild;
  while (element.nextSibling !== null) {
    if (element.nextSibling.nodeType === 1) {
      return element.nextSibling;
    }
    element = element.nextSibling;
  }
  return null;
};
EBX_Utils.lastElementChild = function (element) {
  if (element.lastChild === null) {
    return null;
  }
  if (element.lastChild.nodeType === 1) {
    return element.lastChild;
  }
  element = element.lastChild;
  while (element.previousSibling !== null) {
    if (element.previousSibling.nodeType === 1) {
      return element.previousSibling;
    }
    element = element.previousSibling;
  }
  return null;
};

EBX_Utils.getIndex = function (element) {
  var ret = 0;
  var child = EBX_Utils.firstElementChild(element.parentNode);
  do {
    if (child === element) {
      return ret;
    }
    ret++;
  } while ((child = EBX_Utils.nextElementSibling(child)) !== null);
  return -1;
};

EBX_Utils.getElementChildAtIndex = function (element, index) {
  var child = EBX_Utils.firstElementChild(element);
  for (var i = 0; i < index && child !== null; i++) {
    child = EBX_Utils.nextElementSibling(child);
  }
  return child;
};

EBX_Utils.isFullyDisplayed = function (element) {
  var elementRegion = YAHOO.util.Dom.getRegion(element);

  var topRightElement = document.elementFromPoint(elementRegion.right - 1, elementRegion.top + 1);
  if (topRightElement === null || (topRightElement !== element && !EBX_Utils.isChildOf(topRightElement, element))) {
    return false;
  }
  /* is it really useful to test all 4 points? the diagonal is enough in most of cases...?
   var bottomRightElement = document.elementFromPoint(elementRegion.right - 1, elementRegion.bottom - 1);
   if (bottomRightElement === null || (bottomRightElement !== element && !EBX_Utils.isChildOf(bottomRightElement, element))) {
   return false;
   }
   */
  var bottomLeftElement = document.elementFromPoint(elementRegion.left + 1, elementRegion.bottom - 1);
  if (bottomLeftElement === null || (bottomLeftElement !== element && !EBX_Utils.isChildOf(bottomLeftElement,
      element))) {
    return false;
  }
  /*
   var topLeftElement = document.elementFromPoint(elementRegion.left + 1, elementRegion.top + 1);
   if (topLeftElement === null || (topLeftElement !== element && !EBX_Utils.isChildOf(topLeftElement, element))) {
   return false;
   }
   */
  return true;
};

EBX_Utils.isChildOf = function (child, element) {
  var parent = child.parentNode;
  while (parent !== null) {
    if (parent === element) {
      return true;
    } else {
      parent = parent.parentNode;
    }
  }
  return false;
};

EBX_Utils.getIFrameContentDocumentOrNull = function (iFrameEl) {
  try {
    return iFrameEl.contentDocument;
  } catch (e) {
    return null;
  }
};

EBX_Utils.getElementByIdInSubSessionIFrameRecursively = function (id) {
  var documentEl = document;
  var element = null;
  while (element === null) {
    if (documentEl.getElementById("ebx_SubSessioniFrame") === null) {
      return null;
    }
    documentEl = EBX_Utils.getIFrameContentDocumentOrNull(documentEl.getElementById("ebx_SubSessioniFrame"));
    if (documentEl === null) {
      // iframeDocument null is the case of unreachable iframe document for security reasons
      return null;
    }
    element = documentEl.getElementById(id);
  }
  return element;
};

EBX_Utils.getSubSessionIFrame = function () {
  return document.getElementById("ebx_SubSessioniFrame");
};

EBX_Utils.removeLast = function (str, strToRemove) {
  return str.substring(0, str.lastIndexOf(strToRemove));
};

EBX_Utils.hScrollHeight = null;
EBX_Utils.vScrollWidth = null;

EBX_Utils.getHScrollHeight = function () {
  if (EBX_Utils.hScrollHeight === null) {
    EBX_Utils.initScrollSizes();
  }
  return EBX_Utils.hScrollHeight;
};
EBX_Utils.getVScrollWidth = function () {
  if (EBX_Utils.vScrollWidth === null) {
    EBX_Utils.initScrollSizes();
  }
  return EBX_Utils.vScrollWidth;
};

EBX_Utils.initScrollSizes = function () {
  var containerEl = document.createElement("div");
  containerEl.style.position = "fixed";
  containerEl.style.top = "0";
  containerEl.style.left = "200%";
  containerEl.style.width = "100px";
  containerEl.style.height = "100px";
  containerEl.style.overflow = "auto";

  var contentEl = document.createElement("div");
  contentEl.style.width = "200px";
  contentEl.style.height = "200px";

  containerEl.appendChild(contentEl);

  document.body.appendChild(containerEl);

  EBX_Utils.hScrollHeight = 100 - containerEl.clientHeight;
  EBX_Utils.vScrollWidth = 100 - containerEl.clientWidth;

  document.body.removeChild(containerEl);
};

EBX_Utils.getOffsetParentPositionAbsolute = function (element) {
  /* create a div gauge */
  var gauge = document.createElement("div");
  gauge.style.position = "absolute";
  gauge.style.visibility = "hidden";
  gauge.innerHTML = "gauge";

  element.parentNode.appendChild(gauge);

  var ret = gauge.offsetParent;

  /* destroy div gauge */
  gauge.parentNode.removeChild(gauge);

  return ret;
};
EBX_Utils.getOffsetTopPositionAbsolute = function (element) {
  var offsetParentPositionAbsolute = EBX_Utils.getOffsetParentPositionAbsolute(element);
  return EBX_Utils.getOffsetTopRelativeToContainer(element, offsetParentPositionAbsolute);
};
EBX_Utils.getOffsetLeftPositionAbsolute = function (element) {
  var offsetParentPositionAbsolute = EBX_Utils.getOffsetParentPositionAbsolute(element);
  return EBX_Utils.getOffsetLeftRelativeToContainer(element, offsetParentPositionAbsolute);
};
EBX_Utils.getOffsetTopRelativeToContainer = function (element, elementContainer) {
  var ret = element.offsetTop;
  var tmpOffsetParent = element.offsetParent;
  while (tmpOffsetParent !== undefined && tmpOffsetParent != elementContainer) {
    ret += tmpOffsetParent.offsetTop;
    tmpOffsetParent = tmpOffsetParent.offsetParent;
  }

  return ret;
};
EBX_Utils.getOffsetLeftRelativeToContainer = function (element, elementContainer) {
  var ret = element.offsetLeft;
  var tmpOffsetParent = element.offsetParent;
  while (tmpOffsetParent !== null && tmpOffsetParent != elementContainer) {
    ret += tmpOffsetParent.offsetLeft;
    tmpOffsetParent = tmpOffsetParent.offsetParent;
  }

  return ret;
};

EBX_Utils.returnTrue = function () {
  return true;
};
EBX_Utils.returnFalse = function () {
  return false;
};

EBX_Utils.clearSelection = function () {
  if (document.selection && document.selection.empty) {
    document.selection.empty();
  } else if (window.getSelection) {
    var sel = window.getSelection();
    sel.removeAllRanges();
  }
};

EBX_Utils.launchRequestInTopFrame = function (requestURL) {
  if (!EBX_LayoutManager.isEmbedded()) {
    window.location.href = requestURL;
    return;
  }

  ebx_getContainerWindow(window).parent.EBX_Utils.launchRequestInTopFrame(requestURL);
};

/** END EBX_Utils * */

/** START EBX_Logger * */

function EBX_Logger() {

}

EBX_Logger.error = YAHOO.widget.Logger.categories[2];
EBX_Logger.warn = YAHOO.widget.Logger.categories[1];
EBX_Logger.info = YAHOO.widget.Logger.categories[0];

EBX_Logger.serverSeverity = [];
EBX_Logger.serverSeverity[EBX_Logger.error] = "E";
EBX_Logger.serverSeverity[EBX_Logger.warn] = "W";
EBX_Logger.serverSeverity[EBX_Logger.info] = "I";

EBX_Logger.LoggerWriter = new YAHOO.widget.LogWriter("EBX_Logger");
EBX_Logger.LogReader = false;

EBX_Logger.init = function () {
  if (EBX_LayoutManager.isEmbedded()) {
    return;
  }
  EBX_Logger.LogReader = new YAHOO.widget.LogReader();
  EBX_Logger.LogReader.verboseOutput = false;
  EBX_Logger.LogReader.hideSource("LogReader");
  EBX_Logger.LogReader.hideSource("global");
  EBX_Logger.LogReader.hide();
};

EBX_Logger.show = function () {
  if (!EBX_Logger.LogReader) {
    return;
  }

  EBX_Logger.LogReader.show();
};
EBX_Logger.hide = function () {
  if (!EBX_Logger.LogReader) {
    return;
  }

  EBX_Logger.LogReader.hide();
};

/**
 * @param message
 *            the message to log
 * @param level
 *            EBX_Logger.error or EBX_Logger.warn or EBX_Logger.info
 */
EBX_Logger.log = function (message, level) {
  EBX_Logger.LoggerWriter.log(message, level);
  EBX_Logger.sendLogToServer(message, level);
};

EBX_Logger.sendLogToServer = function (message, level) {
  if (EBX_Logger.logThisLevel(level)) {
    var url = EBX_Constants.getRequestLink(EBX_Constants.ajaxLogEvent);

    var data = EBX_Constants.ajaxLogSeverity + "=" + EBX_Logger.serverSeverity[level];
    data += "&";
    data += EBX_Constants.ajaxLogMsg + "=" + encodeURIComponent(message);

    YAHOO.util.Connect.asyncRequest('POST', url, {}, data);
  }
};
EBX_Logger.sendLogToServerLevel = EBX_Logger.error;
EBX_Logger.logThisLevel = function (level) {
  if (EBX_Logger.sendLogToServerLevel === undefined) {
    return false;
  }

  if (EBX_Logger.sendLogToServerLevel === EBX_Logger.info) {
    if (level == EBX_Logger.info || level == EBX_Logger.warn || level == EBX_Logger.error) {
      return true;
    }
  }

  if (EBX_Logger.sendLogToServerLevel === EBX_Logger.warn) {
    if (level == EBX_Logger.warn || level == EBX_Logger.error) {
      return true;
    }
  }

  if (EBX_Logger.sendLogToServerLevel === EBX_Logger.error) {
    if (level == EBX_Logger.error) {
      return true;
    }
  }

  return false;
};

YAHOO.util.Event.onDOMReady(EBX_Logger.init);

/** END EBX_Logger * */

function EBX_DebugTools() {

}

EBX_DebugTools.init = function () {
  YAHOO.util.Event.addListener(document.body, "dblclick", EBX_DebugTools.dblclickOnBody, null, null);
};

EBX_DebugTools.dblclickOnBody = function (event) {
  if (event.clientX < 10 && event.clientY < 10 && event.altKey === true && event.ctrlKey === true && event.shiftKey
      === true) {
    EBX_DebugTools.promptToolsList();
  }
};

EBX_DebugTools.toolList = [];

EBX_DebugTools.promptToolsList = function () {
  var text, i, len, tool, code;

  text = [];
  text.push("Debug tools:");

  // build the list of tools
  for (i = 0, len = EBX_DebugTools.toolList.length; i < len; i++) {
    tool = EBX_DebugTools.toolList[i];
    text.push((i + 1) + ". " + tool[0]);
  }

  code = prompt(text.join("\n"));

  // cancel button
  if (code === null) {
    return;
  }

  tool = EBX_DebugTools.toolList[code - 1];
  if (tool !== undefined) {
    tool[1].call();
    return;
  }

  // other hidden cases
  switch (code) {
    case "Something else":
      ebx_alert("There is no easter egg here.\nIt's a professional web application.");
      break;

    default:
      ebx_alert("Sorry, unknown code.");
  }
};

/*START HorizontalRuler */
EBX_DebugTools.horizontalRulerEl = null;
EBX_DebugTools.showHorizontalRuler = function () {
  if (EBX_DebugTools.horizontalRulerEl === null) {
    EBX_DebugTools.horizontalRulerEl = document.createElement("div");
    EBX_DebugTools.horizontalRulerEl.style.position = "fixed";
    EBX_DebugTools.horizontalRulerEl.style.borderTop = "1px solid black";
    EBX_DebugTools.horizontalRulerEl.style.borderBottom = "1px solid black";
    EBX_DebugTools.horizontalRulerEl.style.opacity = "0.3";
    EBX_DebugTools.horizontalRulerEl.style.height = "1px";
    EBX_DebugTools.horizontalRulerEl.style.left = "0";
    EBX_DebugTools.horizontalRulerEl.style.width = "100%";
    document.body.appendChild(EBX_DebugTools.horizontalRulerEl);
  }

  EBX_DebugTools.horizontalRulerEl.style.display = "";

  YAHOO.util.Event.addListener(document.body, "mousemove", EBX_DebugTools.horizontalRulerFollowMouse, null, null);
  EBX_Loader.stackKeyListener(EBX_Utils.keyCodes.ESCAPE, EBX_DebugTools.hideHorizontalRuler);
};
EBX_DebugTools.horizontalRulerFollowMouse = function (event) {
  // Math.round because IE 10+ gives a decimal position, but it's better to have a stepper ruler to check aligns on pixel grid
  EBX_DebugTools.horizontalRulerEl.style.top = Math.round(event.clientY) - 10 + "px";
};
EBX_DebugTools.hideHorizontalRuler = function () {
  EBX_DebugTools.horizontalRulerEl.style.display = "none";
  YAHOO.util.Event.removeListener(document.body, "mousemove", EBX_DebugTools.horizontalRulerFollowMouse);
  EBX_Loader.removeKeyListener(EBX_Utils.keyCodes.ESCAPE, EBX_DebugTools.hideHorizontalRuler);
};

EBX_DebugTools.toolList.push(["Horizontal ruler", EBX_DebugTools.showHorizontalRuler]);
/*END HorizontalRuler */

/*START VerticalRuler */
EBX_DebugTools.verticalRulerEl = null;
EBX_DebugTools.showVerticalRuler = function () {
  if (EBX_DebugTools.verticalRulerEl === null) {
    EBX_DebugTools.verticalRulerEl = document.createElement("div");
    EBX_DebugTools.verticalRulerEl.style.position = "fixed";
    EBX_DebugTools.verticalRulerEl.style.borderLeft = "1px solid black";
    EBX_DebugTools.verticalRulerEl.style.borderRight = "1px solid black";
    EBX_DebugTools.verticalRulerEl.style.opacity = "0.3";
    EBX_DebugTools.verticalRulerEl.style.width = "1px";
    EBX_DebugTools.verticalRulerEl.style.top = "0";
    EBX_DebugTools.verticalRulerEl.style.height = "100%";
    document.body.appendChild(EBX_DebugTools.verticalRulerEl);
  }

  EBX_DebugTools.verticalRulerEl.style.display = "";

  YAHOO.util.Event.addListener(document.body, "mousemove", EBX_DebugTools.verticalRulerFollowMouse, null, null);
  EBX_Loader.stackKeyListener(EBX_Utils.keyCodes.ESCAPE, EBX_DebugTools.hideVerticalRuler);
};
EBX_DebugTools.verticalRulerFollowMouse = function (event) {
  EBX_DebugTools.verticalRulerEl.style.left = event.clientX - 10 + "px";
};
EBX_DebugTools.hideVerticalRuler = function () {
  EBX_DebugTools.verticalRulerEl.style.display = "none";
  YAHOO.util.Event.removeListener(document.body, "mousemove", EBX_DebugTools.verticalRulerFollowMouse);
  EBX_Loader.removeKeyListener(EBX_Utils.keyCodes.ESCAPE, EBX_DebugTools.hideVerticalRuler);
};

EBX_DebugTools.toolList.push(["Vertical ruler", EBX_DebugTools.showVerticalRuler]);
/*END VerticalRuler */

/*START VerticalRulerLarge */
EBX_DebugTools.verticalRulerLargeEl = null;
EBX_DebugTools.showVerticalRulerLarge = function () {
  if (EBX_DebugTools.verticalRulerLargeEl === null) {
    EBX_DebugTools.verticalRulerLargeEl = document.createElement("div");
    EBX_DebugTools.verticalRulerLargeEl.style.position = "fixed";
    EBX_DebugTools.verticalRulerLargeEl.style.borderLeft = "3px double grey";
    EBX_DebugTools.verticalRulerLargeEl.style.borderRight = "3px double grey";
    EBX_DebugTools.verticalRulerLargeEl.style.opacity = "0.5";
    EBX_DebugTools.verticalRulerLargeEl.style.padding = "0 1px";
    EBX_DebugTools.verticalRulerLargeEl.style.top = "0";
    //		EBX_DebugTools.verticalRulerLargeEl.style.width = "5px";
    EBX_DebugTools.verticalRulerLargeEl.style.height = "100%";

    var verticalRulerChildEl = document.createElement("div");
    verticalRulerChildEl.style.backgroundColor = "black";
    verticalRulerChildEl.style.width = "1px";
    verticalRulerChildEl.style.height = "100%";
    //		verticalRulerChildEl.style.borderLeft = "3px double red";
    //		verticalRulerChildEl.style.borderRight = "3px double red";

    EBX_DebugTools.verticalRulerLargeEl.appendChild(verticalRulerChildEl);

    document.body.appendChild(EBX_DebugTools.verticalRulerLargeEl);
  }

  EBX_DebugTools.verticalRulerLargeEl.style.display = "";

  YAHOO.util.Event.addListener(document.body, "mousemove", EBX_DebugTools.verticalRulerLargeFollowMouse, null, null);
  EBX_Loader.stackKeyListener(EBX_Utils.keyCodes.ESCAPE, EBX_DebugTools.hideVerticalRulerLarge);
};
EBX_DebugTools.verticalRulerLargeFollowMouse = function (event) {
  EBX_DebugTools.verticalRulerLargeEl.style.left = event.clientX - 20 + "px";
};
EBX_DebugTools.hideVerticalRulerLarge = function () {
  EBX_DebugTools.verticalRulerLargeEl.style.display = "none";
  YAHOO.util.Event.removeListener(document.body, "mousemove", EBX_DebugTools.verticalRulerLargeFollowMouse);
  EBX_Loader.removeKeyListener(EBX_Utils.keyCodes.ESCAPE, EBX_DebugTools.hideVerticalRulerLarge);
};

EBX_DebugTools.toolList.push(["Vertical ruler Large", EBX_DebugTools.showVerticalRulerLarge]);
/** END VerticalRulerLarge */

/** START debug tools * */

YAHOO.util.Event.onDOMReady(EBX_DebugTools.init);

/** END debug tools * */

/** START Constants * */
function EBX_Constants() {

}

EBX_Constants.getRequestLink = function (eventName, parameterMap) {
  var requestLink = EBX_Constants.baseURLForRequest + eventName;

  if (parameterMap !== undefined) {
    var map = parameterMap.getMap();
    for (var key in map) {
      requestLink += "&" + key + "=" + map[key];
    }
  }
  return requestLink;
};

/** END Constants * */

/** START Map * */

function EBX_Map() {
  this.map = [];

  this.put = function (key, val) {
    this.map[key] = val;
  };

  this.get = function (key) {
    return this.map[key];
  };

  this.getMap = function () {
    return this.map;
  };

  this.isKeyExists = function (key) {
    return this.map[key] !== undefined;
  };
}

/** END Map * */

EBX_Utils.focusDummyInputToSolveIEFocusBugOnModalClose = function () {

  var dummyId = "ebx_dummyInputToSolveIEFocusBugOnModalClose";
  var dummyInput = document.getElementById(dummyId);

  if (dummyInput === null) {
    dummyInput = document.createElement("input");
    dummyInput.setAttribute('id', dummyId);
    dummyInput.setAttribute('type', 'text');
    dummyInput.setAttribute('style', 'position:fixed; left:-20px; right:-20px; width:10px;');
  }

  document.body.appendChild(dummyInput);

  dummyInput.focus();
  dummyInput.select();
};

EBX_Utils.invisibleMaskClassName = "ebx_InvisibleMask";
EBX_Utils.interactivMaskClassName = "ebx_InteractivMask";
EBX_Utils.tooltipClassName = "ebx_Tooltip";
EBX_Utils.tooltipArrowClassName = "ebx_TooltipArrow";
EBX_Utils.tooltipTopClassName = "ebx_TooltipTop";
EBX_Utils.tooltipBottomClassName = "ebx_TooltipBottom";

// This variable indicates if the close button is displayed on the edge of a modal.
// In the case of legacy, this button is always on the edge regardless of the modal size.
// In the case of Hybrid Mode, the close button should not be displayed on the edge of large modal.
EBX_Utils.isCloseButtonOnPopupEdge = "ebx_CloseButtonOnPopupEdge";

EBX_Utils.internalPopupId = "ebx_InternalPopup";
EBX_Utils.internalPopupMinWidth = 200;
EBX_Utils.internalPopupMinHeight = 100;
EBX_Utils.currentInternalPopup = null;

EBX_Utils.isInternalPopup_CloseCallIsMadeByParent = false;
EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself = false;

EBX_Utils.closeInternalPopupReturnState_OK_closed = 1;
EBX_Utils.closeInternalPopupReturnState_KO_blockedByUser = 2;
EBX_Utils.closeInternalPopupReturnState_KO_waitingForPageReload = 3;

EBX_Utils.disableInternalPopupMessage = null;

EBX_Utils.submitInInternalPopup = function (frameName, url, postData) {
  var form = document.createElement("form");
  form.setAttribute("method", "post");
  form.setAttribute("action", url);
  form.setAttribute("target", frameName);
  form.setAttribute("style", "display:none;");

  //CP-17769: have to save reference aside in case some field names override form methods.
  // For more details, see https://developer.mozilla.org/fr/docs/Web/API/HTMLFormElement, quotes :
  // > Named inputs are added to their owner form instance as properties, and can overwrite
  // > native properties if they share the same name (eg a form with an input named action
  // > will have its action property return that input instead of the form's action HTML attribute).
  var formSubmit = form.submit;
  var formAppendChild = form.appendChild;

  if (postData) {
    for (var key in postData) {
      if (postData.hasOwnProperty(key)) {
        var value = postData[key];

        var createInput = (function (key) {
          return function (item) {
            var input = document.createElement("input");

            input.setAttribute("name", key);
            input.setAttribute("value", item);

            formAppendChild.call(form, input);
          };
        })(key);

        if (Array.isArray(value)) {
          EBX_Utils.forEach(value, createInput);
        } else {
          createInput(value);
        }

      }
    }
  }

  document.body.appendChild(form);
  formSubmit.call(form);
  document.body.removeChild(form);
};

EBX_Utils.openInternalPopupInParentWindow = function (url, width, height, options) {
  EBX_Utils.internalPopupHandler.EBX_Utils.openInternalPopup(url, width, height, options, window);
};

EBX_Utils.internalPopupReferrer = window;
EBX_Utils.openInternalPopup = function (url, width, height, options, referrer) {
  if (EBX_Utils.disableInternalPopupMessage !== null && ((options === undefined) || (options !== undefined
      && !options.isSystem))) {
    ebx_alert(EBX_Utils.disableInternalPopupMessage);
    return;
  }

  if (EBX_Utils.internalPopupHandler !== window) {
    EBX_Utils.openInternalPopupInParentWindow(url, width, height, options);
    return;
  }

  if (referrer == null) {
    referrer = window;
  }

  EBX_Utils.internalPopupReferrer = referrer;

  var isCentered = true;
  var isDimmed = true;
  var isResizable = true;
  var isCloseButtonDisplayed = true;
  var isResizeRestrainedToMinSize = false;
  var contextElement = null;
  var postData = null;
  var isCloseButtonOnPopupEdge = true;

  if (options !== undefined) {

    if (options.contextElement !== undefined) {
      contextElement = options.contextElement;
    }

    // having a context element causes isCenter turned to off
    if (options.isCentered === false || contextElement !== null) {
      isCentered = false;
    }

    // having a isCenter turned to off causes isResizable turned to off
    // because the resize feature is a special-dynamic-mirror-resize-amazing-behavior
    if (options.isResizable === false || isCentered === false) {
      isResizable = false;
    }

    if (options.isDimmed === false) {
      isDimmed = false;
    }

    if (options.isCloseButtonDisplayed === false) {
      isCloseButtonDisplayed = false;
    }

    if (options.isResizeRestrainedToMinSize === true) {
      isResizeRestrainedToMinSize = true;
    }

    if (options.postData != null) {
      postData = options.postData;
    }

    if (options.isCloseButtonOnPopupEdge != null) {
      isCloseButtonOnPopupEdge = options.isCloseButtonOnPopupEdge;
    }
  }

  var constrainToViewport = true, x = null, y = null;
  var setInteractiveMask = false;

  // if one of width or height is not correct or not defined, iframe is resized to fill the workspace.
  if (isNaN(parseInt(width)) || isNaN(parseInt(height))) {
    url += EBX_Utils.openInternalPopupURLSuffix;
    url += EBX_Utils.openInternalPopupWorkspaceMode;

    // update new-ui breadcrumb to be sure the popup can be closed
    var pageStack = EBX_Utils.getCurrentPageStack();
    pageStack.push({
      pageId: "__tmp__",
      isLoading: true
    });

    EBX_Utils.notifyContextChange(
        undefined,
        undefined,
        pageStack);

    // large size special configuration
    isResizable = false;
    constrainToViewport = false;
    setInteractiveMask = true;
    isCentered = false;

    var bounds = EBX_Utils.getBoundsOfInternalPopupToFitWindow();

    x = bounds.x;
    y = bounds.y;
    width = bounds.width;
    height = bounds.height;

    YAHOO.util.Event.addListener(window, "resize", EBX_Utils.autoResizeInternalPopupToFitWindowWithDelay);
  } else {
    url += EBX_Utils.openInternalPopupModalMode;

    var maxWidth = parseInt(document.body.offsetWidth) - 2 * YAHOO.widget.Overlay.VIEWPORT_OFFSET;
    var maxHeight = parseInt(document.body.offsetHeight) - 2 * YAHOO.widget.Overlay.VIEWPORT_OFFSET;

    if (width > maxWidth) {
      width = maxWidth;
    }
    if (height > maxHeight) {
      height = maxHeight;
    }
  }

  // convert URL parameters to post data
  (function () {
    var fullPostData = {};
    // we accept postData to be a boolean or an object containing data to post
    if (postData) {
      if (typeof postData === "object") {
        for (var key in postData) {
          if (!postData.hasOwnProperty(key)) {
            continue;
          }

          var value = postData[key];
          if (Array.isArray(value)) {
            fullPostData[key] = value;
          } else {
            fullPostData[key] = [value];
          }
        }
      }

      /*
       * This function splits the given string in two, on the first appearance of the separator.
       * This is to be opposed to the built-in split which either splits the given string while there
       * is a separator. The built-in version can have a limit but this is applied only after the whole
       * string has been split and won't return the remaining as a whole if it contains the separator.
       * Builtin: "a/b/c/d".split("/", 2)
       *   => ["a", "b"]
       * This version: split("a/b/c/d", "/")
       *   => ["a", "b/c/d"]
       */
      function split(s, separator) {
        var index = s.indexOf(separator);
        if (index >= 0) {
          return [
            s.substring(0, index),
            s.substring(index + 1)
          ];
        }

        return [s];
      }

      var urlSplit = split(url, "?");
      url = urlSplit[0];
      var paramString = urlSplit[1];

      if (paramString != null && paramString.length > 0) {
        var paramStrings = paramString.split("&");

        for (var i in paramStrings) {
          var s = paramStrings[i];
          if (s.length === 0) {
            continue;
          }

          var parts = split(s, "=");
          var paramName = decodeURIComponent(parts[0]);
          var paramValue = parts[1];
          if (paramValue == null) {
            paramValue = "";
          }

          var postValue = fullPostData[paramName];
          if (postValue == null) {
            postValue = [];
            fullPostData[paramName] = postValue;
          }

          paramValue = paramValue.replace(/\+/g, "%20");
          paramValue = decodeURIComponent(paramValue);
          postValue.push(paramValue);
        }
      }

      postData = fullPostData;
    } else {
      postData = null;
    }
  })();

  EBX_Utils.currentInternalPopup = new YAHOO.widget.Panel(EBX_Utils.internalPopupId, {
    visible: false,
    draggable: false,
    fixedcenter: isCentered,
    modal: true,
    close: isCloseButtonDisplayed,
    constraintoviewport: constrainToViewport,
    width: width + "px",
    height: height + "px",
    x: x,
    y: y
  });

  EBX_Utils.currentInternalPopup._doClose = function (e) {
    var iframeEl = document.getElementById(this.ebx_iframeId); // iframe can be legacy or New UI.
    if (!iframeEl.contentWindow.EBX_Utils) { // EBX_Utils is defined for legacy or New UI iframes.
      // iFrame has already been reset.
      iframeEl = null;
    } else {
      // Check if legacy iFrame is surrounded by a New UI iFrame.
      var legacyComponentId = iframeEl.contentWindow.EBX_Utils.EBX_LEGACY_COMPONENT_ID;
      if (legacyComponentId) {
        // May be null if iFrame was already removed by React.
        iframeEl = iframeEl.contentWindow.document.getElementById(legacyComponentId); // iframe can only be legacy.
        if (iframeEl && !iframeEl.contentWindow.EBX_Loader) {  // EBX_Loader is defined only for legacy iframes.
          // iframe has already been reset.
          iframeEl = null;
        }
      }
    }

    if (iframeEl) {
      // ask to child iFrame to close its internal popup before
      var closeReturnState = null;
      try {
        iframeEl.contentWindow.EBX_Utils.isInternalPopup_CloseCallIsMadeByParent = true;
        closeReturnState = iframeEl.contentWindow.EBX_Utils.closeInternalPopup();
      } catch (e) {
        closeReturnState = EBX_Utils.closeInternalPopupReturnState_OK_closed;
      }
      if (closeReturnState !== EBX_Utils.closeInternalPopupReturnState_OK_closed) {
        if (closeReturnState === EBX_Utils.closeInternalPopupReturnState_KO_waitingForPageReload) {
          // recursive relay
          EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself = true;
        }
        return closeReturnState;
      }

      // check unload before changing the src or destroy the iFrame
      var unLoadResult = undefined;
      try {
        unLoadResult = iframeEl.contentWindow.EBX_Loader.onbeforeunload();
      } catch (e) {
      }
      if (unLoadResult !== undefined) {
        if (confirm(unLoadResult + "\n" + EBX_LocalizedMessage.confirmLine2Popup) === false) {
          return EBX_Utils.closeInternalPopupReturnState_KO_blockedByUser;
        }
      }

      // no modification, or the user wants to discard them
      // so delete the onbeforeunload before unload the iFrame
      try {
        iframeEl.contentWindow.onbeforeunload = undefined;
      } catch (e) {
      }

      // if the iframe has a actionClosePopup, call it
      var actionClosePopup = null;
      try {
        actionClosePopup = iframeEl.contentWindow.EBX_Loader.actionClosePopup;
      } catch (e) {
      }
      if (actionClosePopup !== null) {
        iframeEl.contentWindow.setTimeout(actionClosePopup, 0);
        // page reload will call parent.EBX_Utils.closeInternalPopup() when it will be ready
        // in this case, the current window have an internal popup shall close itself
        // by calling parent.EBX_Utils.closeInternalPopup()
        EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself = true;
        return EBX_Utils.closeInternalPopupReturnState_KO_waitingForPageReload;
      }

      // if the iFrame has a urlLogout, navigate on it
      var urlLogout = null;
      try {
        urlLogout = iframeEl.contentWindow.EBX_Loader.urlLogout;
      } catch (e) {
      }
      if (urlLogout !== null) {
        if (iframeEl.src) {
          iframeEl.src = urlLogout;
        } else { // <object>
          iframeEl.data = urlLogout;
        }
        // page reload will call parent.EBX_Utils.closeInternalPopup() when it will be ready
        // in this case, the current window have an internal popup shall close itself
        // by calling parent.EBX_Utils.closeInternalPopup()
        EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself = true;
        return EBX_Utils.closeInternalPopupReturnState_KO_waitingForPageReload;
      }
    }  // iframeEl

    if (e !== undefined) {
      YAHOO.util.Event.preventDefault(e);
    }
    YAHOO.util.Event.removeListener(window, "resize", EBX_Utils.autoResizeInternalPopupToFitWindowWithDelay);
    this.destroy();

    if (EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself === true
        && EBX_Utils.isInternalPopup_CloseCallIsMadeByParent === true) {
      // case when the close of current window was waiting for the refresh of child (or myself)
      var closeResult = parent.EBX_Utils.closeInternalPopup();

      // reset value (useful for top window)
      EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself = false;
      EBX_Utils.isInternalPopup_CloseCallIsMadeByParent = false;
      if (closeResult == EBX_Utils.closeInternalPopupReturnState_KO_blockedByUser) {
        // notify newUI of cancellation of waiting
        EBX_Utils.notifyCloseChildCancelledByUser()
      }
    }

    // #13328 [UMBRELLA] Focus problems on Internet Explorer
    if (EBX_LayoutManager.isIE || EBX_LayoutManager.browser == "IE") {
      EBX_Utils.focusDummyInputToSolveIEFocusBugOnModalClose();
    }

    //Check that there is at least one APV compatible field, we update all nodes modified by a sub session
    if (Object.getOwnPropertyNames(EBX_FormNodeIndex.nodes).length !== 0) {
      referrer.EBX_FormPresenter.updateFromSubSession();
    }

    //Do not make redirection when closing
    if (!EBX_LayoutManager.isAnMDMComponent()) {
      EBX_Utils.notifyContextChange(
          undefined,
          window.EBX_HybridModeDisplayedContextInfo,
          EBX_Utils.getCurrentPageStack());
    }

    return EBX_Utils.closeInternalPopupReturnState_OK_closed;
  };

  EBX_Utils.currentInternalPopup.ebx_iframeId = EBX_Utils.internalPopupId + "_frame";
  var frameName = ebx_getContainerWindow().name;
  if (!frameName) {
    frameName = EBX_Utils.currentInternalPopup.ebx_iframeId;
  } else {
    frameName += "_0";
  }

  var tmpInnerHTML = [];
  tmpInnerHTML.push("<iframe");
  tmpInnerHTML.push(" id='", EBX_Utils.currentInternalPopup.ebx_iframeId, "'");
  tmpInnerHTML.push(" name='", frameName, "'");
  tmpInnerHTML.push(" src='", (postData == null) ? url : "about:blank", "'");
  tmpInnerHTML.push(" width='100%'");
  tmpInnerHTML.push(" height='100%'");
  tmpInnerHTML.push(" align='middle'");
  tmpInnerHTML.push(" scrolling='auto'");
  tmpInnerHTML.push(" frameborder='0'>");
  tmpInnerHTML.push("</iframe>");
  EBX_Utils.currentInternalPopup.setBody(tmpInnerHTML.join(""));

  EBX_Utils.currentInternalPopup.render(document.body);
  if (contextElement !== null) {
    EBX_Utils.currentInternalPopup.cfg.setProperty('context', [contextElement, 'tl', 'bl']);
  }

  if (postData != null) {
    EBX_Utils.submitInInternalPopup(frameName, url, postData);
  }

  EBX_Utils.currentInternalPopup.show();

  var mask = document.getElementById(EBX_Utils.internalPopupId + "_mask");

  if (isDimmed === false) {
    EBX_Utils.addCSSClass(mask, EBX_Utils.invisibleMaskClassName);
  }
  if (setInteractiveMask === true) {
    EBX_Utils.addCSSClass(mask, EBX_Utils.interactivMaskClassName);
  }

  if (isCloseButtonOnPopupEdge) {
    var popup = document.getElementById(EBX_Utils.internalPopupId);
    EBX_Utils.addCSSClass(popup, EBX_Utils.isCloseButtonOnPopupEdge);
  }

  // close when click on back
  YAHOO.util.Event.addListener(mask, "click", EBX_Utils.closeInternalPopup, null, null);
  mask.title = EBX_LocalizedMessage.innerPopup_returnToThisScreen;

  if (isResizable === true) {
    var resize = new YAHOO.util.Resize(EBX_Utils.internalPopupId, {
      handles: ["br"],
      useShim: true,
      minHeight: EBX_Utils.internalPopupMinHeight,
      minWidth: EBX_Utils.internalPopupMinWidth,
      proxy: true
    });
    resize.originalHeight = height;
    resize.originalWidth = width;
    resize.originalLeft = EBX_Utils.currentInternalPopup.element.offsetLeft;
    resize.originalTop = EBX_Utils.currentInternalPopup.element.offsetTop;

    resize.on("startResize", function (args) {

      var D = YAHOO.util.Dom;

      var clientRegion = D.getClientRegion();
      var elRegion = D.getRegion(this.element);

      resize.set("maxWidth", clientRegion.right - elRegion.left - YAHOO.widget.Overlay.VIEWPORT_OFFSET);
      resize.set("maxHeight", clientRegion.bottom - elRegion.top - YAHOO.widget.Overlay.VIEWPORT_OFFSET);

      var minWidth = EBX_Utils.internalPopupMinWidth;
      var minHeight = EBX_Utils.internalPopupMinHeight;
      if (isResizeRestrainedToMinSize) {
        minWidth = width;
        minHeight = height;
      }

      resize.set("minWidth", (clientRegion.width + minWidth) / 2 - elRegion.left);
      resize.set("minHeight", (clientRegion.height + minHeight) / 2 - elRegion.top);
    }, EBX_Utils.currentInternalPopup, true);

    resize.on("proxyResize", function (args) {
      var proxy = resize._proxy;
      var panelHeight = args.height;
      var panelWidth = args.width;

      var heightDiff = panelHeight - resize.originalHeight;
      var widthDiff = panelWidth - resize.originalWidth;

      var targetHeight = resize.originalHeight + heightDiff * 2;
      var targetLeft = resize.originalLeft - widthDiff;
      var targetWidth = resize.originalWidth + widthDiff * 2;
      var targetTop = resize.originalTop - heightDiff;

      proxy.style.left = targetLeft + "px";
      proxy.style.top = targetTop + "px";
      proxy.style.width = targetWidth + "px";
      proxy.style.height = targetHeight + "px";
    }, null, true);

    resize.on("endResize", function (args) {
      var panelHeight = args.height;
      var panelWidth = args.width;

      var heightDiff = panelHeight - resize.originalHeight;
      var widthDiff = panelWidth - resize.originalWidth;

      var targetHeight = resize.originalHeight + heightDiff * 2;
      var targetWidth = resize.originalWidth + widthDiff * 2;

      this.cfg.setProperty("height", targetHeight + "px");
      this.cfg.setProperty("width", targetWidth + "px");
      this.moveTo(resize.originalLeft - widthDiff, resize.originalTop - heightDiff);

      args.target.originalHeight = targetHeight;
      args.target.originalWidth = targetWidth;
      args.target.originalLeft = resize.originalLeft - widthDiff;
      args.target.originalTop = resize.originalTop - heightDiff;
    }, EBX_Utils.currentInternalPopup, true);
  }
};

EBX_Utils.previousResizeInternalPopupTimeout = null;

EBX_Utils.autoResizeInternalPopupToFitWindowWithDelay = function () {
  if (!EBX_LayoutManager.delayResizeBodyLayout) {
    EBX_Utils.autoResizeInternalPopupToFitWindow();
    return;
  }

  if (EBX_Utils.previousResizeInternalPopupTimeout !== null) {
    window.clearTimeout(EBX_Utils.previousResizeInternalPopupTimeout);
  }
  EBX_Utils.previousResizeInternalPopupTimeout = window
      .setTimeout(EBX_Utils.autoResizeInternalPopupToFitWindow, EBX_Utils.InternalPopupResizeDelay);
};

EBX_Utils.autoResizeInternalPopupToFitWindow = function () {
  if (EBX_Utils.currentInternalPopup === null || EBX_Utils.currentInternalPopup.cfg === null) {
    return;
  }

  var bounds = EBX_Utils.getBoundsOfInternalPopupToFitWindow();

  EBX_Utils.currentInternalPopup.cfg.setProperty("height", bounds.height + "px");
  EBX_Utils.currentInternalPopup.cfg.setProperty("width", bounds.width + "px");
};

EBX_Utils.getBoundsOfInternalPopupToFitWindow = function () {
  var bounds = {};

  if (window.EBX_HybridModePageInfo !== undefined) {
    // Component is displayed in hybrid mode.
    bounds.width = parseInt(document.body.offsetWidth);
    bounds.height = parseInt(document.body.offsetHeight);
    bounds.x = 0;
    bounds.y = 0;
    return bounds;
  }

  var popupMarginTop = null;

  if (EBX_LayoutManager.isHeaderPaneDisplayed()) {
    popupMarginTop = 40;
  }

  if (popupMarginTop === null) {
    var workspaceTitleH2 = EBX_LayoutManager.getWorkspaceTitleH2();

    if (workspaceTitleH2 !== null) {
      popupMarginTop = workspaceTitleH2.offsetHeight;
    }
  }

  // extra fallback powa:
  // if the header pane is not displayed and if the workspace title does not exist,
  // maybe the workspace is an iFrame, probably with EBX® and no header pane, but a workspace title,
  // so set an approximation of workspace title usual height
  if (popupMarginTop === null) {
    if (EBX_Utils.matchCSSClass(document.body, "ebx_density_10")) {
      popupMarginTop = 48;
    } else if (EBX_Utils.matchCSSClass(document.body, "ebx_density_20")) {
      popupMarginTop = 70;
    } else {
      // throw in the towel!
      popupMarginTop = 0;
    }
  }

  var isEmbedded = EBX_LayoutManager.isEmbedded({
    considersEBXPerspectiveAsNotEBX: true
  });

  if (isEmbedded) {
    bounds.width = parseInt(document.body.offsetWidth);
    bounds.height = parseInt(document.body.offsetHeight - popupMarginTop);
    bounds.x = 0;
    bounds.y = popupMarginTop;
  } else {
    bounds.width = parseInt(document.body.offsetWidth - 20); // 20 = 2x10 for left + right margin
    bounds.height = parseInt(document.body.offsetHeight - (popupMarginTop + 10)); // 10 for bottom margin
    bounds.x = 10;
    bounds.y = popupMarginTop;
  }

  return bounds;
};

EBX_Utils.closeInternalPopup = function () {
  if (EBX_Utils.currentInternalPopup !== null && EBX_Utils.currentInternalPopup.body !== null) {
    return EBX_Utils.currentInternalPopup._doClose();
  }
  // search subsession iframe
  subSessionIFrame = EBX_Utils.getSubSessionIFrame();
  if (subSessionIFrame !== null && subSessionIFrame.contentWindow.body !== null) {
    return EBX_Utils._doCloseSubSession(subSessionIFrame);
  }
  return EBX_Utils.closeInternalPopupReturnState_OK_closed;
};

EBX_Utils._doCloseSubSession = function (iframeEl) {
  if (!iframeEl.contentWindow.EBX_Utils) { // EBX_Utils is defined for legacy or New UI iframes.
    // iFrame has already been reset.
    iframeEl = null;
  } else {
    // Check if legacy iFrame is surrounded by a New UI iFrame.
    var legacyComponentId = iframeEl.contentWindow.EBX_Utils.EBX_LEGACY_COMPONENT_ID;
    if (legacyComponentId) {
      // May be null if iFrame was already removed by React.
      iframeEl = iframeEl.contentWindow.document.getElementById(legacyComponentId); // iframe can only be legacy.
      if (iframeEl && !iframeEl.contentWindow.EBX_Loader) {  // EBX_Loader is defined only for legacy iframes.
        // iframe has already been reset.
        iframeEl = null;
      }
    }
  }
  if (iframeEl) {
    // ask to child iFrame to close its internal popup before
    var closeReturnState = null;
    try {
      iframeEl.contentWindow.EBX_Utils.isInternalPopup_CloseCallIsMadeByParent = true;
      closeReturnState = iframeEl.contentWindow.EBX_Utils.closeInternalPopup();
    } catch (e) {
      closeReturnState = EBX_Utils.closeInternalPopupReturnState_OK_closed;
    }
    if (closeReturnState !== EBX_Utils.closeInternalPopupReturnState_OK_closed) {
      if (closeReturnState === EBX_Utils.closeInternalPopupReturnState_KO_waitingForPageReload) {
        // recursive relay
        EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself = true;
      }
      return closeReturnState;
    }

    // check unload before changing the src or destroy the iFrame
    var unLoadResult = undefined;
    try {
      unLoadResult = iframeEl.contentWindow.EBX_Loader.onbeforeunload();
    } catch (e) {
    }
    if (unLoadResult !== undefined) {
      if (confirm(unLoadResult + "\n" + EBX_LocalizedMessage.confirmLine2Popup) === false) {
        return EBX_Utils.closeInternalPopupReturnState_KO_blockedByUser;
      }
    }

    // no modification, or the user wants to discard them
    // so delete the onbeforeunload before unload the iFrame
    try {
      iframeEl.contentWindow.onbeforeunload = undefined;
      iframeEl.contentWindow.EBX_Loader.onbeforeunload = function () {
      };
    } catch (e) {
      console.error(e)
    }

    if (EBX_Utils.getCurrentPageStack().length === 1) {
      // should not close root subsession in workflow
      EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself = false;
      EBX_Utils.isInternalPopup_CloseCallIsMadeByParent = false;
      return EBX_Utils.closeInternalPopupReturnState_OK_closed;
    }

    // simply clear iframe src for subsession
    if (iframeEl.src) {
      iframeEl.src = "about:blank";
    } else {
      iframeEl.data = "about:blank"
    }
  }  // iframeEl

  YAHOO.util.Event.removeListener(window, "resize", EBX_Utils.autoResizeInternalPopupToFitWindowWithDelay);
  //this.destroy();

  if (EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself === true
      && EBX_Utils.isInternalPopup_CloseCallIsMadeByParent === true) {
    // case when the close of current window was waiting for the refresh of child (or myself)
    //var closeResult = parent.EBX_Utils.closeInternalPopup();
    EBX_Utils.notifyContextChange(
        undefined,
        undefined,
        EBX_Utils.getCurrentPageStack());

    // reset value (useful for top window)
    EBX_Utils.isInternalPopup_WaitingForChildToCloseMyself = false;
    EBX_Utils.isInternalPopup_CloseCallIsMadeByParent = false;
  }

  // #13328 [UMBRELLA] Focus problems on Internet Explorer
  if (EBX_LayoutManager.isIE || EBX_LayoutManager.browser == "IE") {
    EBX_Utils.focusDummyInputToSolveIEFocusBugOnModalClose();
  }

  //Check that there is at least one APV compatible field, we update all nodes modified by a sub session
  if (Object.getOwnPropertyNames(EBX_FormNodeIndex.nodes).length !== 0) {
    EBX_FormPresenter.updateFromSubSession();
  }

  //Do not make redirection when closing
  EBX_Utils.notifyContextChange(
      undefined,
      undefined,
      EBX_Utils.getCurrentPageStack());

  return EBX_Utils.closeInternalPopupReturnState_OK_closed;
};

EBX_Utils.isForcedClose = false;

EBX_Utils.closeSelf = function () {
  var closePopupReturnState = EBX_Utils.closeInternalPopup();
  if (closePopupReturnState !== EBX_Utils.closeInternalPopupReturnState_OK_closed) {
    return closePopupReturnState;
  }

  // considers that the page is not fully loader, so it can be closed
  //  (the user was not able to modify form data, neither open a child popup)
  if (window.EBX_Loader == null) {
    return EBX_Utils.closeInternalPopupReturnState_OK_closed;
  }

  var message = EBX_Loader.onbeforeunload();

  if (message == null) {
    return EBX_Utils.closeInternalPopupReturnState_OK_closed;
  }

  if (confirm(message)) {
    EBX_Utils.isForcedClose = true;
    return EBX_Utils.closeInternalPopupReturnState_OK_closed;
  }

  return EBX_Utils.closeInternalPopupReturnState_KO_blockedByUser;
};

EBX_Utils.openInternalPopupExportResult = function (url) {
  EBX_Utils.openInternalPopup(url, 500, 250, {
    isCloseButtonDisplayed: false
  });
};
EBX_Utils.openInternalPopupWithSize = function (url, width, height, options) {
  EBX_Utils.openInternalPopup(url, width, height, options);
};
EBX_Utils.openInternalPopupMediumSize = function (url) {
  EBX_Utils.openInternalPopup(url, 800, 400);
};
EBX_Utils.openInternalPopupMediumSizeHostedClose = function (url, options) {
  var actualOptions;
  if (!options) {
    actualOptions = {
      isCloseButtonDisplayed: false
    };
  } else {
    actualOptions = {};
    for (var key in options) {
      if (!options.hasOwnProperty(key)) {
        continue;
      }

      actualOptions[key] = options[key];
    }

    actualOptions.isCloseButtonDisplayed = false;
  }

  EBX_Utils.openInternalPopup(url, 800, 400, actualOptions);
};
EBX_Utils.openInternalPopupLargeSize = function (url) {
  //
  EBX_Utils.openInternalPopup(url, null, null, {
    isCloseButtonOnPopupEdge: false
  });
};
EBX_Utils.openInternalPopupLargeSizeHostedClose = function (url, isSystem, postData) {

  EBX_Utils.openInternalPopup(url, null, null, {
    isCloseButtonDisplayed: false,
    isSystem: (isSystem !== undefined) ? isSystem : false,
    postData: postData
  });
};

// This method is called in hybrid mode when a popup opens.
EBX_Utils.onHybridOpenPanel = function () {
  EBX_Utils.onHybridPanelChange();
};

// This method is called in hybrid mode when an error occurs and legacy session should not be reused.
EBX_Utils.onHybridError = function (stateId, isLoggedIn) {
  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    // Not in hybrid mode.
    return;
  }

  var callback = windowsStack[0]["EBX_HybridModeOnError"];
  if (!callback) {
    // No callback defined.
    return;
  }

  var data = {
    stateId: stateId,
    isLoggedIn: isLoggedIn
  }

  callback(JSON.stringify(data));
};

// This method is called in hybrid mode to get current and all parent iframe windows.
EBX_Utils.getWindowStackToHybridParentFrame = (function () {
  var windowStack = undefined;

  /**
   * Please keep in sync with LegacyComponent.getWindowStackToHybridParentFrame().
   */
  function getWindowStackToHybridParentFrame() {
    var ret = [];

    var win = window;

    do {
      if (!EBX_Utils.isWindowOnSameDomain(win)) {
        return null;
      }

      if (win.EBX_Utils["isHybridNotificationDisabled"]) {
        return null;
      }

      ret.push(win);
      if (win["EBX_HybridModeOnContextChange"]) {
        return ret.reverse();
      }

      if (win == win.top) {
        return null;
      }

      win = win.parent;
    } while (true);
  }

  return function () {
    if (windowStack === undefined) {
      windowStack = getWindowStackToHybridParentFrame();
    }

    return windowStack;
  };
})();

/**
 *
 * @param window {Window}
 * @return {boolean}
 */
EBX_Utils.isWindowOnSameDomain = function (window) {
  try {
    window.document;
    return true;
  } catch (e) {
    return false;
  }
};

window.EBX_HybridModeRootContextInfo = undefined;
window.EBX_HybridModeDisplayedContextInfo = undefined;
window.EBX_HybridModePageInfo = undefined;

// In hybrid mode, sets all titles. If not in hybrid mode does nothing.
EBX_Utils.onHybridPanelChange = function () {
  EBX_Utils.notifyContextChange(
      window.EBX_HybridModeRootContextInfo,
      window.EBX_HybridModeDisplayedContextInfo,
      EBX_Utils.getCurrentPageStack());
};

EBX_Utils.notifyContextChange = function (rootContext, displayedContext, pageStack) {
  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    // Not in hybrid mode.
    return;
  }

  var callback = windowsStack[0]["EBX_HybridModeOnContextChange"];
  if (!callback) {
    // No callback defined.
    return;
  }
  var data = {
    rootContext: rootContext,
    displayedContext: displayedContext,
    pageStack: pageStack,
    pageId: window.EBX_PageId
  };

  callback(JSON.stringify(data));
};

EBX_Utils.notifyCloseChildCancelledByUser = function () {
  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    // Not in hybrid mode.
    return;
  }

  var callback = windowsStack[0]["EBX_HybridModeOnCloseChildCancelledByUser"];
  if (!callback) {
    // No callback defined.
    return;
  }

  callback();
};

/**
 * Please keep in sync with LegacyComponent.getCurrentPageStack().
 */
EBX_Utils.getCurrentPageStack = function () {
  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (windowsStack == null) {
    return [];
  }

  var pages = [];

  for (var i in windowsStack) {
    var win = windowsStack[i];

    if (win.EBX_HybridModePageInfo) {
      win.EBX_HybridModePageInfo.pageId = win.EBX_PageId;
      pages.push(win.EBX_HybridModePageInfo);
    }
  }

  return pages;
};

// This method is called in hybrid mode to get the legacy window using its page id.
EBX_Utils.getHybridFrameWindowByPageId = function (pageId) {
  if (!pageId) {
    console.error("Page id cannot by undefined or null.");
    return;
  }

  var win = window;

  // Find legacy top window. Current window is any window in the stack of legacy windows.
  while (!win.parent["EBX_HybridModeOnContextChange"]) {
    if (win == win.top) {
      console.error("Cannot find top legacy window.");
      return;
    }

    win = win.parent;
  }

  // Find the window using pageId.
  win = EBX_Utils.getChildPageMatching(win, function (window) {
    return window.EBX_PageId === pageId;
  });

  return win;
};

EBX_Utils.getChildPageMatching = function (window, predicate) {
  if (window.EBX_Utils == null) {
    return;
  }

  if (predicate(window)) {
    return window;
  }

  var children = window.document.getElementsByTagName("iframe");
  for (var childId = 0; childId < children.length; childId++) {
    var contentWindow = children[childId].contentWindow;

    var matchingChild = EBX_Utils.getChildPageMatching(contentWindow, predicate);
    if (matchingChild != null) {
      return matchingChild;
    }
  }

  children = window.document.getElementsByTagName("object");
  for (childId = 0; childId < children.length; childId++) {
    contentWindow = children[childId].contentWindow;
    if (contentWindow == null) {
      continue;
    }

    matchingChild = EBX_Utils.getChildPageMatching(contentWindow, predicate);
    if (matchingChild != null) {
      return matchingChild;
    }
  }
};

// Closes a popup.
EBX_Utils.closePopupByPageId = function (pageId) {
  var win = EBX_Utils.getHybridFrameWindowByPageId(pageId);
  if (win == null) {
    return EBX_Utils.closeInternalPopupReturnState_OK_closed;
  }

  return win.EBX_Utils.closeInternalPopup();
}

// Changes content of an iframe.
EBX_Utils.setLocationByPageId = function (pageId, url) {
  var win = EBX_Utils.getHybridFrameWindowByPageId(pageId);
  if (win == null) {
    return;
  }

  win.location = url;
}

/**
 * Returns true if current density applied is DisplayDensity.COMPACT.
 */
//@EBXAddonAPI
EBX_Utils.isDisplayDensityCompact = function () {
  // ebx_display_density_is_compact is initialized by server.
  // noinspection JSUnresolvedVariable
  return ebx_display_density_is_compact;
};

EBX_Utils.processSynchronizedEvent = function (type, params) {
  var event;
  var clickElement;
  switch (type) {
    case "MouseEvent":
      event = window.document.createEvent("MouseEvent");
      event.initMouseEvent(params.typeArg, params.canBubbleArg, params.cancelableArg, window, params.detailArg,
          params.screenXArg, params.screenYArg,
          params.clientXArg, params.clientYArg, params.ctrlKeyArg, params.altKeyArg, params.shiftKeyArg,
          params.metaKeyArg, params.buttonArg,
          params.relatedTargetArg);
      clickElement = window.document.body; // dispatch event from the root
      clickElement.dispatchEvent(event);
      break;
    default:
      console.error("Unknown synchronized event type:", type);
      break;
  }
};

EBX_Utils.cancelRequest = function (cancelableRequestID) {
  var url = EBX_Constants.ajaxCancelRequest;
  url += EBX_Constants.ajaxCancelRequestParamCancelableID + encodeURIComponent(cancelableRequestID);

  new YAHOO.util.XHRDataSource().sendRequest(url, null);
};

// See doc in index.d.ts
EBX_Utils.createHighlightTooltip = function createHighlightTooltip(elementToAttach, options) {
  var tooltipElement;

  var text = (options && options.text) || "?";
  var position = (options && options.position) || "top";
  var displayed = (options && options.displayed) || false;

  var clearTransition;

  function remove() {
    if (tooltipElement == null) {
      return;
    }

    tooltipElement.parentElement.removeChild(tooltipElement);
    tooltipElement = null;
  }

  function show() {
    if (tooltipElement == null) {
      return;
    }
    if (displayed) {
      return;
    }

    refresh();
    displayed = true;

    if (clearTransition != null) {
      clearTransition();
    }

    requestAnimationFrame(function () {
      tooltipElement.style.display = "";
      requestAnimationFrame(function () {
        tooltipElement.style.opacity = 1;
        tooltipElement.style.transform = "";
      });
    });
  }

  function hide() {
    if (tooltipElement == null) {
      return;
    }
    if (!displayed) {
      return;
    }

    displayed = false;
    tooltipElement.style.opacity = 0;
    tooltipElement.style.transform = "scale(0)";

    var timeoutId = setTimeout(function () {
      tooltipElement.style.display = "none";
      clearTransition = null;
    }, 200);

    clearTransition = function () {
      clearTimeout(timeoutId);
      clearTransition = null;
    }
  }

  function toggle() {
    if (displayed) {
      hide();
    } else {
      show();
    }
  }

  function setText(newText) {
    text = newText;

    refresh();
  }

  function setPosition(newPosition) {
    position = newPosition;

    refresh();
  }

  function refresh() {
    if (tooltipElement == null) {
      return;
    }

    // text
    EBX_Utils.forEach(tooltipElement.childNodes, function (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        tooltipElement.removeChild(child);
      }
    });

    var textElement = document.createTextNode(text);
    tooltipElement.appendChild(textElement);

    // position
    var contentRect = elementToAttach.getBoundingClientRect();

    var style = tooltipElement.style;
    style.top = null;
    style.bottom = null;
    style.left = (contentRect.left - 5) + "px";

    EBX_Utils.removeCSSClass(tooltipElement, EBX_Utils.tooltipTopClassName);
    EBX_Utils.removeCSSClass(tooltipElement, EBX_Utils.tooltipBottomClassName);

    switch (position) {
      case "top":
        style.bottom = (document.documentElement.clientHeight - contentRect.top + 10) + "px";
        EBX_Utils.addCSSClass(tooltipElement, EBX_Utils.tooltipTopClassName);
        break;
      case "bottom":
        style.top = (contentRect.bottom + 10) + "px";
        EBX_Utils.addCSSClass(tooltipElement, EBX_Utils.tooltipBottomClassName);
        break;
    }
  }

  // create tooltip
  {
    tooltipElement = document.createElement("div");
    EBX_Utils.addCSSClass(tooltipElement, EBX_Utils.tooltipClassName);

    // create arrow
    {
      var arrowElement = document.createElement("div");
      EBX_Utils.addCSSClass(arrowElement, EBX_Utils.tooltipArrowClassName);

      tooltipElement.appendChild(arrowElement);
    }

    refresh();
    displayed = !displayed;
    if (!displayed) {
      show();
    } else {
      hide();
    }

    document.body.appendChild(tooltipElement);
  }

  return {
    remove: remove,
    show: show,
    hide: hide,
    toggle: toggle,
    setText: setText,
    setPosition: setPosition
  };
};

EBX_Utils.TooltipHolder = function () {
  this.tooltips = [];
  this.hideTimeout = null;

  this.addTooltip = function (element, tooltipOptions, onBeforeShow, onBeforeHide) {
    if (element == null) {
      return;
    }

    var tooltip = EBX_Utils.createHighlightTooltip(element, tooltipOptions);

    this.tooltips.push({
      tooltip: tooltip,
      onBeforeShow: onBeforeShow ? function () {
        return onBeforeShow(element);
      } : EBX_Utils.returnTrue,
      onBeforeHide: onBeforeHide ? function () {
        return onBeforeHide(element);
      } : EBX_Utils.returnTrue
    });
  }.bind(this);

  this.showAll = function (delay) {
    EBX_Utils.forEach(this.tooltips, function (tooltip) {
      if (tooltip.onBeforeShow()) {
        tooltip.tooltip.show();
      }
    });

    if (this.hideTimeout != null) {
      window.clearTimeout(this.hideTimeout);
    }

    if (delay != null) {
      this.hideTimeout = window.setTimeout(this.hideAll, delay);
    } else {
      this.hideTimeout = null;
    }
  }.bind(this);

  this.hideAll = function () {
    EBX_Utils.forEach(this.tooltips, function (tooltip) {
      if (tooltip.onBeforeHide()) {
        tooltip.tooltip.hide();
      }
    });

    if (this.hideTimeout != null) {
      window.clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = null;
  }.bind(this);
};

/**
 * Notifies parent to refresh its dataspace tree if visible.
 */
EBX_Utils.invalidateDataspaceTree = function () {
  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    return;
  }
  var callback = windowsStack[0]["EBX_HybridInvalidateDataspaceTree"];
  if (!callback) {
    return;
  }
  callback();
};


/**
 * Current field padding bottom which depends of the density applied.
 *
 * Set by server.
 */
EBX_Utils.FieldVerticalPadding;
/**
 * Horizontal padding in fields.
 * Set by server
 */
EBX_Utils.FieldHorizontalPadding;

EBX_Utils.notifySidebar = function (type, data) {
  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    // Not in hybrid mode.
    return;
  }

  var callback = windowsStack[0]["EBX_HybridModeOnSidebarEvent"];
  if (!callback) {
    // No callback defined.
    return;
  }

  if (data != null) {
    callback(type, JSON.stringify(data));
  } else {
    callback(type, data);
  }
};

/**
 * Indicates whether a targetString begins with a substring. Both strings are supplied as arguments.
 * @param aTargetString {string}
 * @param aSubstring {string}
 * @return {boolean}
 */
EBX_Utils.stringStartsWith = function (aTargetString, aSubstring) {
  return aTargetString != null && aTargetString.indexOf(aSubstring) === 0;
};

EBX_Utils.debounce = function (f, interval, zis) {
  var timeout = null;
  interval = interval || 300;

  return function () {
    var zis = zis || this;
    var args = arguments;

    function functionToApply() {
      f.apply(zis, args);
    }

    clearTimeout(timeout);
    timeout = setTimeout(functionToApply, interval);
  }
};

/**
 * Temporary annotation to disable methods.
 */
EBX_Utils.Disabled = function (defaultResult) {
  return function (target, name, descriptor) {
    descriptor.value = function () {
      console.groupCollapsed("Calling disabled method: " + name);
      console.trace();
      console.groupEnd();
      return defaultResult;
    }
  }
};

(function () {
  function shallowComparator(o0, o1) {
    if (o0 === o1) {
      return true;
    }
    if (o0 == null || o1 == null) {
      return false;
    }

    var type = typeof o0;
    if (type !== typeof o1) {
      return false;
    }

    if (type === "object") {
      return shallowObjectComparator(o0, o1);
    }

    return false;
  }

  function shallowObjectComparator(o0, o1) {
    var o0Keys = Object.getOwnPropertyNames(o0);
    var o1Keys = Object.getOwnPropertyNames(o1);

    if (o0Keys.length !== o1Keys.length) {
      return false;
    }

    for (var i in o0Keys) {
      var key = o0Keys[i];
      if (o1Keys.indexOf(key) === -1) {
        return false;
      }

      if (o0[key] !== o1[key]) {
        return false;
      }
    }

    return true;
  }

  EBX_Utils.memoize = function (f) {
    var hasResult = false;
    var cachedParams;
    var cachedResult;

    return function (params) {
      if (!hasResult || !shallowComparator(cachedParams, params)) {
        hasResult = true;
        cachedParams = params;
        cachedResult = f(params);
      }

      return cachedResult;
    }
  };
})();

(function () {
  EBX_Utils.createElement = function createElement(name, attributes) {
    var children = [];
    for (var i = 2; i < arguments.length; i++) {
      children.push(arguments[i]);
    }

    var tag = document.createElement(name);

    if (attributes) {
      for (var key in attributes) {
        if (!attributes.hasOwnProperty(key)) {
          continue;
        }

        var value = attributes[key];

        if (typeof value === "function") {
          if (key.indexOf("on") === 0) {
            key = key.substr(2);
          }
          tag.addEventListener(key, value);
        } else {
          tag.setAttribute(key, value);
        }
      }
    }

    appendChildren(tag, children);

    return tag;
  };

  EBX_Utils.createDiv = makeCreateSpecificTag("div");
  EBX_Utils.createButton = makeCreateSpecificTag("button");

  function appendChildren(element, children) {
    if (!children) {
      return;
    }

    if (Array.isArray(children)) {
      EBX_Utils.forEach(children, function (child) {
        appendChildren(element, child);
      })
    } else if (typeof children === "string") {
      var child = document.createTextNode(children);
      element.appendChild(child);
    } else {
      element.appendChild(children);
    }
  }

  function makeCreateSpecificTag(name) {
    return function (attributes) {
      var args = [name];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }

      return EBX_Utils.createElement.apply(null, args);
    }
  }
})();
