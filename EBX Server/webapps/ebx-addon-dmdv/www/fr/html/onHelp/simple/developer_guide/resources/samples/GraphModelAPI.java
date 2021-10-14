package com.orchestranetworks.addon.test.dmdv.service.model;
import javax.servlet.http.*;
import com.orchestranetworks.addon.dmdv.model.extension.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.ui.*;

/**
 */
public final class GraphModelAPI
{
	private final ServiceContext sContext;

	public GraphModelAPI(HttpServletRequest req)
	{
		this.sContext = ServiceContext.getServiceContext(req);
	}

	public void callPage()
	{
		UIServiceComponentWriter writer = this.sContext.getUIComponentWriter();
		writer.add("<div id='GRAPH_MODEL_CONTAINER_TAB_DIV' style='height: 100%;'>");
		writer.add("<iframe id='GRAPH_MODEL_IFRAME' width='100%' height='100%'");

		CustomGraphModelFactory customGraphModelFactory = new DemoCustomGraphModelFactory();

		GraphModelSpec graphModelSpec = new GraphModelSpec(
			customGraphModelFactory,
			this.sContext.getSession());
		graphModelSpec.setDisplayGraphTitle(true);

		UIHttpManagerComponent comp = GraphModelHttpManagerComponentUtils.getComponentForGraphModelService(
			writer,
			this.sContext.getCurrentAdaptation(),
			graphModelSpec);

		String url = comp.getURIWithParameters();
		writer.add(" frameBorder='0' style='border-width: 0px; ' src='" + url + "'></iframe>");
		writer.add("</div>");
		writer.addJS_cr(
			"var GRAPH_MODEL_CONTAINER_TAB_DIV = document.getElementById('GRAPH_MODEL_CONTAINER_TAB_DIV');");

		writer.addJS_cr("function resizeGraphTabModel(size){");
		{
			writer.addJS_cr("GRAPH_MODEL_CONTAINER_TAB_DIV.style.width = size.w + 'px';");
			writer.addJS_cr("GRAPH_MODEL_CONTAINER_TAB_DIV.style.height = size.h + 'px';");
		}
		writer.addJS_cr("}");
		writer.addJS_addResizeWorkspaceListener("resizeGraphTabModel");

	}

}
