package com.orchestranetworks.ps.accessrule;

import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;

/**
 * Access Rule to hide a field on creation of a new record through the UI. Ignores if the record is created otherwise (like through an Import).
 * This rule uses the "_createdInUI" field to determine whether the creation of the new record is performed in the UI.
 *
 */
public class HideWhenCreatedInUiAccessRuleForCreate implements AccessRuleForCreate
{

	private Path createdInUiPath = Path.parse("./_createdInUi");
	// This is the path value assigned by default.
	//  -- can use alternate path if needed with constructor that takes a specific path

	public HideWhenCreatedInUiAccessRuleForCreate()
	{
	}

	public HideWhenCreatedInUiAccessRuleForCreate(Path createdInUiPath)
	{
		this.createdInUiPath = createdInUiPath;
	}

	@Override
	public AccessPermission getPermission(AccessRuleForCreateContext context)
	{
		// Hide the Property DataType-Specific Fields if we are creating the record in the UI 
		//   until the Data Type is specified
		//  Otherwise, allow it to be accessed (i.e. coming from an Import)
		if ((boolean) context.getValueContext().getValue(createdInUiPath))
		{
			return AccessPermission.getHidden();
		}
		else
		{
			return AccessPermission.getReadWrite();
		}
	}

}
