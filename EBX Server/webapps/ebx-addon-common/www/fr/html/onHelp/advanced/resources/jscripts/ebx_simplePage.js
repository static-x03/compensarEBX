function EBX_init() {
	EBX_printPageIfAsked();
}

YAHOO.util.Event.onDOMReady(EBX_init);

function EBX_printPageIfAsked() {
	var params = EBX_Utils.getUrlParams();

	if (params["print"] == "true") {
		window.print();
	}
}

var ebx_scrollShadow = null;
function EBX_getScrollShadow() {
	if (ebx_scrollShadow === null) {
		ebx_scrollShadow = document.getElementById("ebx_ScrollShadow");

		if (ebx_scrollShadow === null) {
			ebx_scrollShadow = document.createElement("div");
			ebx_scrollShadow.id = "ebx_ScrollShadow";
			document.body.appendChild(ebx_scrollShadow);
		}
	}
	return ebx_scrollShadow;
}

function EBX_displayShadowOnScroll() {
	var htmlEl = document.getElementsByTagName("html")[0];
	var bodyEl = document.body;
	if (htmlEl.scrollTop > 0 || bodyEl.scrollTop > 0) {
		EBX_getScrollShadow().style.display = "block";
	} else {
		EBX_getScrollShadow().style.display = "none";
	}
}

function EBX_initScrollShadow() {
	window.onscroll = EBX_displayShadowOnScroll;
}
