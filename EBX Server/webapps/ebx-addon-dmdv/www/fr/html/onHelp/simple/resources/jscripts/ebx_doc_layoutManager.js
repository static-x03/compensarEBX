YAHOO.util.Event.throwErrors = true;

function EBX_LayoutManager() {
}

EBX_LayoutManager.init = function() {
	EBX_LayoutManager.renderBodyLayout();
	EBX_LayoutManager.initNavigationTree();
	////EBX_LayoutManager.initSearch();
	YAHOO.util.Event.onContentReady(EBX_LayoutManager.IFRAME_ID, EBX_LayoutManager.initIFrameInteractions);
};
YAHOO.util.Event.onDOMReady(EBX_LayoutManager.init);

EBX_LayoutManager.bodyUnits = function() {
};
EBX_LayoutManager.bodyUnits.workspace = {
	position: 'center',
	body: 'ebx_Workspace',
	gutter: 0
};
EBX_LayoutManager.bodyUnits.navigation = {
	position: 'left',
	width: 300,
	minWidth: 100,
	maxWidth: 800,
	body: 'ebx_Navigation',
	gutter: '0 5px 0 0',
	resize: true,
	useShim: true,
	collapseSize: 0,
	animate: false
};
EBX_LayoutManager.bodyUnits.header = {
	position: 'top',
	height: 40,
	body: "ebx_Header",
	gutter: 0
};

EBX_LayoutManager.navigationUnits = function() {
};
EBX_LayoutManager.navigationUnits.pages = {
	position: 'center',
	body: 'ebx_NavigationPages',
	scroll: true
};
EBX_LayoutManager.navigationUnits.toc = {
	position: 'bottom',
	height: 150,
	body: 'ebx_NavigationToc',
	gutter: '5px 0 0 0',
	collapseSize: -5,
	resize: true,
	scroll: true
};

EBX_LayoutManager.renderBodyLayout = function() {
	EBX_LayoutManager.bodyLayout = new YAHOO.widget.Layout({
		units: [EBX_LayoutManager.bodyUnits.workspace, EBX_LayoutManager.bodyUnits.navigation, EBX_LayoutManager.bodyUnits.header]
	});
	EBX_LayoutManager.bodyLayout.addListener("resize", EBX_LayoutManager.resizeWorkspace);
	EBX_LayoutManager.bodyLayout.addListener("render", EBX_LayoutManager.onRenderBodyLayout);
	EBX_LayoutManager.bodyLayout.render();
};
EBX_LayoutManager.onRenderBodyLayout = function() {
	EBX_LayoutManager.renderNavigationLayout();
};
EBX_LayoutManager.WorkspaceContentEl = null;
EBX_LayoutManager.resizeWorkspace = function(yuiResizeEvent) {
	var workspaceContentEl = EBX_LayoutManager.WorkspaceContentEl;
	if (workspaceContentEl === null) {
		workspaceContentEl = document.getElementById("ebx_WorkspaceContent");
		if (workspaceContentEl === null) {
			return;
		} else {
			EBX_LayoutManager.WorkspaceContentEl = workspaceContentEl;
		}
	}

	var workspaceContentParent = workspaceContentEl.parentNode;

	var takenSpace = 0;

	var child = workspaceContentParent.firstChild;
	do {
		if (child.nodeType === 1 && child !== workspaceContentEl && child.id !== EBX_LayoutManager.navigationExpandKnobId) {
			takenSpace += child.offsetHeight;
		}
	} while ((child = child.nextSibling));

	if ((yuiResizeEvent.sizes.center.h - takenSpace) >= 0) {
		document.getElementById(EBX_LayoutManager.IFRAME_ID).style.height = (yuiResizeEvent.sizes.center.h - takenSpace) + "px";
	}
};

EBX_LayoutManager.renderNavigationLayout = function() {
	var centerWrap = EBX_LayoutManager.bodyLayout.getUnitByPosition(EBX_LayoutManager.bodyUnits.navigation.position).get('wrap');
	EBX_LayoutManager.navigationLayout = new YAHOO.widget.Layout(centerWrap, {
		parent: EBX_LayoutManager.bodyLayout,
		units: [EBX_LayoutManager.navigationUnits.pages, EBX_LayoutManager.navigationUnits.toc]
	});
	EBX_LayoutManager.navigationLayout.render();
	EBX_LayoutManager.navigationLayout.getUnitByPosition(EBX_LayoutManager.navigationUnits.toc.position).collapse();
};

EBX_LayoutManager.navigationTree = null;
EBX_LayoutManager.initNavigationTree = function() {
	EBX_LayoutManager.navigationTree = new YAHOO.widget.TreeView("ebx_NavigationPagesList");

	EBX_LayoutManager.navigationTree.subscribe("clickEvent", function(arg) {
		arg.node.toggle();
		return false;
	});

	EBX_LayoutManager.navigationTree.render();

	// to compute the whole tree
	EBX_LayoutManager.navigationTree.expandAll();
	EBX_LayoutManager.navigationTree.collapseAll();

	// open the first level
	var firstLevelNodes = EBX_LayoutManager.navigationTree.getRoot().children;
	var i = firstLevelNodes.length;
	while (i--) {
		firstLevelNodes[i].expand();
	}
};

EBX_LayoutManager.baseURLForDocSearchCookieName = "ebx_BaseURLForDocSearch";
EBX_LayoutManager.initSearch = function() {
	var baseURL = YAHOO.util.Cookie.get(EBX_LayoutManager.baseURLForDocSearchCookieName, {
		path: "/"
	});

	if (baseURL === null) {
		return;
	}

	var docHeader = document.getElementById("ebx_Header");
	if (docHeader === null) {
		return;
	}

	var formHTML = [];
	formHTML.push("<form id=\"ebx_SearchForm\" method=\"post\" action=\"", baseURL, "\" target=\"", EBX_LayoutManager.IFRAME_ID, "\">");

	formHTML.push("<input type=\"text\" name=\"queryString\" class=\"ebx_queryInput\"/>");

	formHTML.push("<input type=\"image\" src=\"resources/images/symbols/ebx_search.png\" class=\"ebx_submitButton\"/>");

	formHTML.push("</form>");

	docHeader.innerHTML = formHTML.join("") + docHeader.innerHTML;

	document.getElementById("ebx_SearchForm").onsubmit = EBX_CheckSearchFormBeforeSubmit;
};
function EBX_CheckSearchFormBeforeSubmit() {
	var userQuery = document.getElementById("ebx_SearchForm").queryString.value;
	if (userQuery == "" || userQuery == "\"" || userQuery == "~" || userQuery.charAt(0) == "*" || userQuery.charAt(0) == "?")
		return false;

	return true;
}

EBX_LayoutManager.initIFrameInteractions = function() {
	YAHOO.util.Event.addListener(EBX_LayoutManager.IFRAME_ID, "load", EBX_LayoutManager.initFrame);

	//document.getElementById(EBX_LayoutManager.IFRAME_ID).style.visibility = "hidden";
	EBX_LayoutManager.initWorkspaceContent();
};

EBX_LayoutManager.IFRAME_ID = "ebx_WorkspaceContentFrame";
EBX_LayoutManager.PAGE_URL_PARAMETER_NAME = "page";
EBX_LayoutManager.initWorkspaceContent = function() {
	var pageURL = EBXUtils.getUrlParams()[EBX_LayoutManager.PAGE_URL_PARAMETER_NAME];
	if (pageURL != null) {
		window.setTimeout("document.getElementById(EBX_LayoutManager.IFRAME_ID).src = \"" + pageURL + "\";", 50);
	}
};

EBX_LayoutManager.initFrame = function() {
	document.getElementById(EBX_LayoutManager.IFRAME_ID).style.visibility = "hidden";
	var iFrameContentDocument = EBX_LayoutManager.getIFrameContentDocumentOrNull();
	var iFrameContentWindow = document.getElementById(EBX_LayoutManager.IFRAME_ID).contentWindow;
	if (iFrameContentDocument !== null) {
		try {
			EBX_LayoutManager.turnWorkspaceContentIntoEmbedMode(iFrameContentDocument);
			EBX_LayoutManager.initScrollShadow(iFrameContentWindow);
			EBX_LayoutManager.setTitleToWorkspace(iFrameContentDocument);
			EBX_LayoutManager.setTitleToWindow(iFrameContentDocument);
			EBX_LayoutManager.setPDFButtonHref(iFrameContentDocument);
			EBX_LayoutManager.setPrintButtonHref(iFrameContentDocument);
			EBX_LayoutManager.setSimplePageButtonHref(iFrameContentDocument);
			EBX_LayoutManager.setSeparatorVisibility(iFrameContentDocument);
			EBX_LayoutManager.setTocToNavigation(iFrameContentDocument);
			EBX_LayoutManager.selectTreeNodeLinkingFrame(iFrameContentDocument);
		} catch (e) {
			// sometimes (usually out of the server) contentDocument is accessible,
			// but not able to give some informations, for security reasons
			EBX_LayoutManager.clearMetaInfos();
		}
	} else {
		// case of unaccessible page in iframe (usually out of the server)
		// TODO CCH message approx "the page is incorrect"
		EBX_LayoutManager.clearMetaInfos();
	}
	// title may be not displayed or having 2 lines
	EBX_LayoutManager.bodyLayout.resize();
	document.getElementById(EBX_LayoutManager.IFRAME_ID).style.visibility = "visible";
};

EBX_LayoutManager.clearMetaInfos = function() {
	EBX_LayoutManager.clearWorkspaceTitle();
	EBX_LayoutManager.clearWindowTitle();
	EBX_LayoutManager.clearPDFButton();
	EBX_LayoutManager.clearPrintButton();
	EBX_LayoutManager.clearSimplePageButton();
	EBX_LayoutManager.hideSeparator();
	EBX_LayoutManager.clearNavigationToc();
	EBX_LayoutManager.clearTreeNodeSelection();
};

EBX_LayoutManager.getIFrameContentDocumentOrNull = function() {
	try {
		if (YAHOO.env.ua.ie && YAHOO.env.ua.ie < 8) {
			return document.getElementById(EBX_LayoutManager.IFRAME_ID).contentWindow.document;
		} else {
			return document.getElementById(EBX_LayoutManager.IFRAME_ID).contentDocument;
		}
	} catch (e) {
		return null;
	}
};

EBX_LayoutManager.turnWorkspaceContentIntoEmbedMode = function(iFrameContentDocument) {
	var iframeBody = iFrameContentDocument.getElementsByTagName("body")[0];

	EBXUtils.removeCSSClass(iframeBody, "ebx_simplePage");
	EBXUtils.addCSSClass(iframeBody, "ebx_embeddedPage");
};

EBX_LayoutManager.initScrollShadow = function(iFrameContentWindow) {
	try {
		iFrameContentWindow.EBX_initScrollShadow();
	} catch (e) {
	}
};

EBX_LayoutManager.workspaceTitleContentId = "ebx_WorkspaceTitleContent";
EBX_LayoutManager.workspaceControlsId = "ebx_WorkspaceControls";
EBX_LayoutManager.setTitleToWorkspace = function(iFrameContentDocument) {
	document.getElementById(EBX_LayoutManager.workspaceTitleContentId).style.display = "none";
	// disable all workspace controls if no title
	document.getElementById(EBX_LayoutManager.workspaceControlsId).style.display = "none";

	var firstH1Element = iFrameContentDocument.getElementsByTagName("h1")[0];

	if (!firstH1Element) {
		document.getElementById(EBX_LayoutManager.workspaceTitleContentId).innerHTML = "";
		return;
	}

	document.getElementById(EBX_LayoutManager.workspaceTitleContentId).innerHTML = firstH1Element.innerHTML;
	document.getElementById(EBX_LayoutManager.workspaceTitleContentId).style.display = "block";
	document.getElementById(EBX_LayoutManager.workspaceControlsId).style.display = "block";
};
EBX_LayoutManager.clearWorkspaceTitle = function() {
	document.getElementById(EBX_LayoutManager.workspaceTitleContentId).style.display = "none";
	// disable all workspace controls if no title
	document.getElementById(EBX_LayoutManager.workspaceControlsId).style.display = "none";
};

EBX_LayoutManager.initialWindowTitle = null;
EBX_LayoutManager.setTitleToWindow = function(iFrameContentDocument) {
	if (EBX_LayoutManager.initialWindowTitle === null) {
		EBX_LayoutManager.initialWindowTitle = document.title;
	}
	document.title = iFrameContentDocument.title;
};
EBX_LayoutManager.clearWindowTitle = function() {
	if (EBX_LayoutManager.initialWindowTitle !== null) {
		document.title = EBX_LayoutManager.initialWindowTitle;
	}
};

EBX_LayoutManager.separator1Id = "ebx_WorkspaceControlsSeparator1";
EBX_LayoutManager.separator2Id = "ebx_WorkspaceControlsSeparator2";
EBX_LayoutManager.setSeparatorVisibility = function(iFrameContentDocument) {

	var contentDocumentURL = iFrameContentDocument.URL;

	// search servlet
	if (contentDocumentURL && contentDocumentURL.indexOf(".html") < 0) {
		return;
	}

	if (document.getElementById(EBX_LayoutManager.separator1Id) !== null)
		document.getElementById(EBX_LayoutManager.separator1Id).style.visibility = "visible";
	if (document.getElementById(EBX_LayoutManager.separator2Id) !== null)
		document.getElementById(EBX_LayoutManager.separator2Id).style.visibility = "visible";
};
EBX_LayoutManager.hideSeparator = function() {
	if (document.getElementById(EBX_LayoutManager.separator1Id) !== null)
		document.getElementById(EBX_LayoutManager.separator1Id).style.visibility = "hidden";
	if (document.getElementById(EBX_LayoutManager.separator2Id) !== null)
		document.getElementById(EBX_LayoutManager.separator2Id).style.visibility = "hidden";
};

EBX_LayoutManager.PDFButtonId = "ebx_PDFButton";
EBX_LayoutManager.setPDFButtonHref = function(iFrameContentDocument) {

	var pdfButton = document.getElementById(EBX_LayoutManager.PDFButtonId);

	if (pdfButton !== null)
		document.getElementById(EBX_LayoutManager.PDFButtonId).style.visibility = "hidden";

	var contentDocumentURL = iFrameContentDocument.URL;

	if (!contentDocumentURL) {
		return;
	}

	// search servlet
	if (contentDocumentURL.indexOf(".html") < 0) {
		return;
	}

	if (pdfButton !== null)
		document.getElementById(EBX_LayoutManager.PDFButtonId).style.visibility = "visible";
};
EBX_LayoutManager.clearPDFButton = function() {
	var pdfButton = document.getElementById(EBX_LayoutManager.PDFButtonId);

	if (pdfButton !== null)
		document.getElementById(EBX_LayoutManager.PDFButtonId).style.visibility = "hidden";
};

EBX_LayoutManager.printButtonId = "ebx_PrintButton";
EBX_LayoutManager.setPrintButtonHref = function(iFrameContentDocument) {

	document.getElementById(EBX_LayoutManager.printButtonId).style.visibility = "hidden";

	var contentDocumentURL = iFrameContentDocument.URL;

	if (!contentDocumentURL) {
		return;
	}

	// search servlet
	if (contentDocumentURL.indexOf(".html") < 0) {
		return;
	}

	document.getElementById(EBX_LayoutManager.printButtonId).href = "javascript:EBX_LayoutManager.printPage();";
	document.getElementById(EBX_LayoutManager.printButtonId).style.visibility = "visible";
};
EBX_LayoutManager.clearPrintButton = function() {
	document.getElementById(EBX_LayoutManager.printButtonId).style.visibility = "hidden";
};

EBX_LayoutManager.printPopupName = "ebx_HelpBook";
EBX_LayoutManager.printPage = function() {
	var iFrameContentDocument = EBX_LayoutManager.getIFrameContentDocumentOrNull();
	if (iFrameContentDocument !== null) {
		var contentDocumentURL = iFrameContentDocument.URL;

		if (!contentDocumentURL) {
			return;
		}

		var popup = window.open(contentDocumentURL + "?print=true", EBX_LayoutManager.printPopupName, "toolbar=yes, menubar=no, location=no, scrollbars=yes, resizable=yes, width=850, height=600");
	} else {
		// case of unaccessible page in iframe (usually out of the server)
		// TODO CCH message approx "the page is incorrect"
	}
};

EBX_LayoutManager.simplePageButtonId = "ebx_SimplePageButton";
EBX_LayoutManager.setSimplePageButtonHref = function(iFrameContentDocument) {

	document.getElementById(EBX_LayoutManager.simplePageButtonId).style.visibility = "hidden";

	var contentDocumentURL = iFrameContentDocument.URL;

	if (!contentDocumentURL) {
		return;
	}

	// search servlet
	if (contentDocumentURL.indexOf(".html") < 0) {
		return;
	}

	document.getElementById(EBX_LayoutManager.simplePageButtonId).href = contentDocumentURL;
	document.getElementById(EBX_LayoutManager.simplePageButtonId).style.visibility = "visible";
};
EBX_LayoutManager.clearSimplePageButton = function() {
	document.getElementById(EBX_LayoutManager.simplePageButtonId).style.visibility = "hidden";
};

EBX_LayoutManager.setTocToNavigation = function(iFrameContentDocument) {
	var tocElement = iFrameContentDocument.getElementById("toc");

	if (!tocElement) {
		EBX_LayoutManager.clearNavigationToc();
		return;
	}

	var navigationTocBody = document.getElementById(EBX_LayoutManager.navigationUnits.toc.body);
	navigationTocBody.style.visibility = "hidden";
	navigationTocBody.innerHTML = tocElement.innerHTML;

	try {
		var tocTitle = document.getElementById("tocTitle");
		if (tocTitle) {
			var titleElement = iFrameContentDocument.getElementsByTagName("h1")[0];

			if (titleElement)
				tocTitle.innerHTML = "<a href=\"#\">" + titleElement.innerHTML + "</a>";
		}
	} catch (e) {
	}

	var aChildrenElements = EBXUtils.getRecursiveChildrenMatchingTagName(navigationTocBody, "A");
	var iFrameContentDocumentURL = iFrameContentDocument.URL;
	if (iFrameContentDocumentURL.lastIndexOf("#") > -1) {
		iFrameContentDocumentURL = iFrameContentDocumentURL.substr(0, iFrameContentDocumentURL.lastIndexOf("#"));
	}
	for (var i = 0; i < aChildrenElements.length; i++) {
		aChildrenElements[i].href = iFrameContentDocumentURL + aChildrenElements[i].href.substr(aChildrenElements[i].href.lastIndexOf("#"));
		aChildrenElements[i].target = "ebx_WorkspaceContentFrame";
	}

	navigationTocBody.style.visibility = "visible";
	EBX_LayoutManager.navigationLayout.getUnitByPosition(EBX_LayoutManager.navigationUnits.toc.position).expand();
};
EBX_LayoutManager.clearNavigationToc = function() {
	document.getElementById(EBX_LayoutManager.navigationUnits.toc.body).innerHTML = "";
	EBX_LayoutManager.navigationLayout.getUnitByPosition(EBX_LayoutManager.navigationUnits.toc.position).collapse();
};

EBX_LayoutManager.DOC_ID_META_NAME = "doc_id";
EBX_LayoutManager.LINK_FOR_DOC_PREFIX = "doc_";
EBX_LayoutManager.pagesTreeContainer = null;
EBX_LayoutManager.lastSelectedTreeNodeElement = null;
EBX_LayoutManager.selectTreeNodeLinkingFrame = function(iFrameContentDocument) {
	if (EBX_LayoutManager.lastSelectedTreeNodeElement != null) {
		EBXUtils.removeCSSClass(EBX_LayoutManager.lastSelectedTreeNodeElement, "ebx_Selected");
		EBX_LayoutManager.lastSelectedTreeNodeElement = null;
	}

	if (EBX_LayoutManager.pagesTreeContainer === null) {
		EBX_LayoutManager.pagesTreeContainer = EBX_LayoutManager.navigationLayout.getUnitByPosition(EBX_LayoutManager.navigationUnits.pages.position).body;
	}

	var metas = iFrameContentDocument.getElementsByTagName("meta");

	for (var i in metas) {
		if (metas[i].name == EBX_LayoutManager.DOC_ID_META_NAME) {
			var docId = metas[i].content;
			var foundElement = document.getElementById(EBX_LayoutManager.LINK_FOR_DOC_PREFIX + docId);
			if (foundElement != null) {
				var node = EBX_LayoutManager.navigationTree.getNodeByElement(foundElement);
				if (node != null) {
					EBXUtils.expandAllParentYUINodes(node);
					EBX_LayoutManager.lastSelectedTreeNodeElement = EBXUtils.getFirstParentMatchingCSSClass(node.getContentEl(), "ygtvtable");
					EBXUtils.addCSSClass(EBX_LayoutManager.lastSelectedTreeNodeElement, "ebx_Selected");
					// move scroll to view the selected node
					EBX_LayoutManager.pagesTreeContainer.scrollTop = EBX_LayoutManager.lastSelectedTreeNodeElement.offsetTop - EBX_LayoutManager.pagesTreeContainer.offsetHeight / 2;
				}
			}
			return;
		}
	}
};
EBX_LayoutManager.clearTreeNodeSelection = function() {
	if (EBX_LayoutManager.lastSelectedTreeNodeElement != null) {
		EBXUtils.removeCSSClass(EBX_LayoutManager.lastSelectedTreeNodeElement, "ebx_Selected");
		EBX_LayoutManager.lastSelectedTreeNodeElement = null;
	}
};
