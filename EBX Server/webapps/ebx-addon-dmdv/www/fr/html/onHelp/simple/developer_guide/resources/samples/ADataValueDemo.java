/*
 * Copyright Orchestra Networks 2000-2008. All rights reserved.
 */
package com.orchestranetworks.addon.dmdv.userservice;

import com.onwbp.adaptation.*;
import com.orchestranetworks.addon.dmdv.data.ui.*;
import com.orchestranetworks.ui.*;
import com.orchestranetworks.ui.selection.*;
import com.orchestranetworks.userservice.*;

/**
 */
public class ADataValueDemo implements UserService<RecordEntitySelection>
{

	@Override
	public void setupObjectContext(
		UserServiceSetupObjectContext<RecordEntitySelection> context,
		UserServiceObjectContextBuilder builder)
	{
	}

	@Override
	public void setupDisplay(
		UserServiceSetupDisplayContext<RecordEntitySelection> context,
		UserServiceDisplayConfigurator config)
	{
		final Adaptation record = context.getEntitySelection().getRecord();

		if (record != null)
		{
			config.setContent(new UserServicePane()
			{
				@Override
				public void writePane(UserServicePaneContext context, UserServicePaneWriter writer)
				{
					String GRAPH_CONFIGURATION_NAME = "SupplyChainConfiguration";
					// Initiate an instance of Graph Data Specification and set the graph name to a working configuration
					GraphDataSpec graphSpec = new GraphDataSpec();
					graphSpec.setGraphConfigurationName(GRAPH_CONFIGURATION_NAME);

					// Prepare the necessary info: record selection and place holder for graph
					writer.add("<div id='" + GRAPH_CONFIGURATION_NAME + "' style='height:100%;'>");
					writer.add(
						"<iframe id='" + GRAPH_CONFIGURATION_NAME
							+ "_frame' width='100%' height='100%'");

					// Use GraphDataHttpManagerComponentUtils to generate a web component containing the graph
					UIHttpManagerComponent comp = GraphDataHttpManagerComponentUtils
						.getComponentForGraphDataService(writer, record, graphSpec);

					// Insert graph component URL into the prepared iframe to display
					String url = comp.getURIWithParameters();
					writer.add(
						" frameBorder='0' style='border-width: 0px; ' src='" + url + "'></iframe>");
					writer.add("</div>");
				}
			});
		}
	}

	@Override
	public void validate(UserServiceValidateContext<RecordEntitySelection> context)
	{
	}

	@Override
	public UserServiceEventOutcome processEventOutcome(
		UserServiceProcessEventOutcomeContext<RecordEntitySelection> context,
		UserServiceEventOutcome eventOutcome)
	{
		return null;
	}
}