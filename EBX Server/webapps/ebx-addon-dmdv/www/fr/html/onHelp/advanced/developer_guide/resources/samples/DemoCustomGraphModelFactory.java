package com.orchestranetworks.addon.test.dmdv.service.model;

import com.onwbp.base.text.*;
import com.orchestranetworks.addon.dmdv.model.extension.*;

/**
 */
public final class DemoCustomGraphModelFactory implements CustomGraphModelFactory
{
	public Diagram build()
	{
		Diagram diagram = new Diagram();

		// The Diagram must start with a root node.
		DatasetGroup rootNode = diagram.getRootNode();

		// Add model components relative to the root node. The following adds a Stores group with one table and two fields.
		DatasetGroup storeGroup = rootNode.addGroup("Stores");
		Table storeDescription = storeGroup.addTable("Description");
		storeDescription.addPrimaryKeyField("Identifier");
		storeDescription.addField("Address");
		// The following adds a Items group, a table, and updates the table label. Two of the fields are added to a table group. The final field is a FK to the Stores table.
		DatasetGroup itemGroup = rootNode.addGroup("Items");
		Table brandTable = itemGroup.addTable("brand");
		brandTable.setLabel(UserMessage.createInfo("Brand"));
		TableGroup brandTableGroup = brandTable.addGroup("Definition");
		brandTableGroup.addField("Name");
		brandTableGroup.addField("Comment");
		TableField storeForeignKey = brandTableGroup.addField("Store");
		storeForeignKey.setReferenceTable(storeDescription);

		return diagram;
	}

	// To get the default graph template, return a new GraphModelTemplate().
	public GraphModelTemplate getGraphModelTemplate()
	{
		
		return new GraphModelTemplate();
	}

}
