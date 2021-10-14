/*
 * Copyright Orchestra Networks 2000-2012. All rights reserved.
 */
package com.pers.mdm.pers.schemaextension;

import com.pers.mdm.pers.path.*;
import com.orchestranetworks.ps.accessrule.*;
import com.orchestranetworks.schema.*;

/**
 */
public class PersSchemaExtension implements SchemaExtensions
{
	@Override
	public void defineExtensions(SchemaExtensionsContext context)
	{
		AccessRulesManager manager = new AccessRulesManager(context);
		manager.setAccessRuleOnNodeAndAllDescendants(
			PersPaths._Root,
			false,
			new WorkflowAccessRule());
	}
}
