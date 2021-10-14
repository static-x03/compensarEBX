/*
  * Copyright Orchestra Networks 2000-2012. All rights reserved.
 */
package com.pers.mdm.common.schemaextension;

import com.pers.mdm.common.path.*;
import com.orchestranetworks.ps.accessrule.*;
import com.orchestranetworks.schema.*;

/**
 */
public class CommonReferenceSchemaExtension implements SchemaExtensions
{
	@Override
	public void defineExtensions(SchemaExtensionsContext context)
	{
		AccessRulesManager manager = new AccessRulesManager(context);
		manager.setAccessRuleOnNodeAndAllDescendants(
			CommonReferencePaths._Root,
			false,
			new WorkflowAccessRule());
	}
}
