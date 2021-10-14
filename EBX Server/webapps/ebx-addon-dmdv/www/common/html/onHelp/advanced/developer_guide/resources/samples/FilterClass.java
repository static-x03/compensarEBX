package com.orchestranetworks.addon.test.dmdv.model;

import com.orchestranetworks.addon.dmdv.data.filter.*;
import com.orchestranetworks.schema.*;

public class FilterNodes implements DisplayFilter
{
	@Override
	public boolean accept(FilterContext context)
	{
		
		NodeContext factoryNodeContext = context.getLink().getEndNodeContext();
		Node factoryNode = factoryContext.getNode();
		Record factoryRecord = factoryNode.getRecord();
		String factoryName = factoryRecord.get(Path.parse("./factory")).toString();

		return !factoryName.contains("Factory");
	}
}
