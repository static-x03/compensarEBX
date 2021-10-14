<%@page import="com.onwbp.base.repository.ModuleName"%>
<%@page import="com.orchestranetworks.ui.ResourceType"%>
<%@page import="com.orchestranetworks.ui.UICSSClasses"%>

<%@page import="com.orchestranetworks.addon.common._AddonInfo"%>
<%@page
	import="com.orchestranetworks.addon.common.ui.userservice.UserServiceContext"%>

<!doctype html>
<html class="yui-skin-sam">

<head>

<base href="<%= UserServiceContext.getContext().getBaseResourceURL() %>">
<!--[if IE]><script type="text/javascript">
    // Fix for IE ignoring relative base tags.
    (function() {
        var baseTag = document.getElementsByTagName('base')[0];
        baseTag.href = baseTag.href;
    })();
</script><![endif]-->  

<meta name="viewport" content="width=device-width, initial-scale=1">

<link href="<%=UserServiceContext.getContext().getURLForResource(ResourceType.STYLESHEET, "index.css")%>" rel="stylesheet" />
<link href="<%=UserServiceContext.getContext().getURLForResource(ResourceType.STYLESHEET, "styles.bundle.css")%>" rel="stylesheet" />

<script type="text/javascript">
	function includeEBXCSS(urlAttr) {

		var link = document.createElement('link');
		link.href = window.frameElement.getAttribute(urlAttr);
		link.rel = 'stylesheet';
		link.type = 'text/css';

		var head = document.getElementsByTagName('head')[0];
		var links = head.getElementsByTagName('link');

		// Check if the same style sheet has been loaded already.
		var isLoaded = false;
		for (var i = 0; i < links.length; i++) {
			var node = links[i];
			if (node.href.indexOf(link.href) > -1) {
				isLoaded = true;
			}
		}

		if (!isLoaded) {
			head.appendChild(link);
		}
	}

	function includeEBXJavaScript(urlAttr) {
		var script = document.createElement('script');
		script.src = window.frameElement.getAttribute(urlAttr);
		var head = document.getElementsByTagName('head')[0];
		head.appendChild(script);
	}

	includeEBXCSS("data-ebx-skin-css");
	includeEBXCSS("data-ebx-global-css");
	includeEBXCSS("data-ebx-images-svg-chrome-css");
	includeEBXCSS("data-ebx-custom-css");

	includeEBXJavaScript("data-ebx-global-js");
</script>
</head>

<body class="yui-layout">
	<app-root iconClass="<%= UICSSClasses.ICONS.ANIM_WAIT_BIG %>">
		<div id="contentDescription_waiting" class="<%= UICSSClasses.ICONS.ANIM_WAIT_BIG %>"></div>
	</app-root>
	<script type="text/javascript" src="<%=UserServiceContext.getContext().getURLForResource(ResourceType.JSCRIPT, "inline.bundle.js")%>"></script>
	<script type="text/javascript" src="<%=UserServiceContext.getContext().getURLForResource(ResourceType.JSCRIPT, "polyfills.bundle.js")%>"></script>
	<script type="text/javascript" src="<%=UserServiceContext.getContext().getURLForResource(ResourceType.JSCRIPT, "vendor.bundle.js")%>"></script>
	<script type="text/javascript" src="<%=UserServiceContext.getContext().getURLForResource(ResourceType.JSCRIPT, "main.bundle.js")%>"></script>
</body>
</html>