package com.orchestranetworks.ps.trigger;

import java.util.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.schema.trigger.*;
import com.orchestranetworks.service.*;

/** 
 * Simple trigger is configured with paths to inherited fields that we would wish to reset to inherited
 * whenever the record is modified.  If no paths are supplied (via pathsToResetString), all inherited fields of the table will be
 * reset.  Additionally, this trigger can be configured with paths to reset to inherited only when their 
 * value matches the value that would be inherited (pathsToResetOnlyWhenValueMatchesString).
 */
public class ResetInheritedFieldsTrigger extends TableTrigger
{
	protected String pathsToResetString;
	protected String pathsToResetOnlyWhenValueMatchesString;
	private List<Path> pathsToReset;
	private List<Path> pathsToResetOnlyWhenValueMatches;

	public String getPathsToResetString()
	{
		return pathsToResetString;
	}

	public void setPathsToResetString(String pathsToResetString)
	{
		this.pathsToResetString = pathsToResetString;
	}

	public String getPathsToResetOnlyWhenValueMatchesString()
	{
		return pathsToResetOnlyWhenValueMatchesString;
	}

	public void setPathsToResetOnlyWhenValueMatchesString(String pathsToResetOnlyWhenValueMatchesString)
	{
		this.pathsToResetOnlyWhenValueMatchesString = pathsToResetOnlyWhenValueMatchesString;
	}

	@Override
	public void setup(TriggerSetupContext context)
	{
		SchemaNode node = context.getSchemaNode().getTableNode().getTableOccurrenceRootNode();
		if (pathsToReset == null)
		{
			if (pathsToResetString != null)
			{
				pathsToReset = PathUtils.convertStringToPathList(pathsToResetString, null);
				checkInherited(context, node, pathsToReset);
			}
			else
			{
				// if no paths are specified, assume user wants all inherited fields reset
				List<Path> paths = new ArrayList<>();
				AdaptationUtil.collectInheritedFields(node, paths);
				this.pathsToReset = paths;
			}
		}
		if (pathsToResetOnlyWhenValueMatches == null && pathsToResetOnlyWhenValueMatchesString != null)
		{
			pathsToResetOnlyWhenValueMatches = PathUtils.convertStringToPathList(pathsToResetOnlyWhenValueMatchesString, null);
			checkInherited(context, node, pathsToResetOnlyWhenValueMatches);
			if (pathsToResetString == null)
			{
				pathsToReset.removeAll(pathsToResetOnlyWhenValueMatches);
			}
		}
	}
	
	private static void checkInherited(TriggerSetupContext context, SchemaNode node, List<Path> paths) {
		// check each path represents an inherited field
		for (Path path : paths)
		{
			SchemaNode fieldNode = node.getNode(path);
			if (fieldNode == null || fieldNode.getInheritanceProperties() == null)
				context.addError("Path " + path.format() + " is not an inherited field");
		}
	}

	@Override
	public void handleBeforeModify(BeforeModifyOccurrenceContext aContext) throws OperationException
	{
		super.handleBeforeModify(aContext);
		doReset(aContext.getOccurrenceContextForUpdate());
	}

	@Override
	public void handleBeforeCreate(BeforeCreateOccurrenceContext aContext) throws OperationException
	{
		super.handleBeforeCreate(aContext);
		doReset(aContext.getOccurrenceContextForUpdate());
	}
	
	private void doReset(ValueContextForUpdate context) throws OperationException
	{
		for (Path path : pathsToReset)
		{
			context.setValueEnablingPrivilegeForNode(AdaptationValue.INHERIT_VALUE, path);
		}
		
		if (pathsToResetOnlyWhenValueMatches != null)
		{
			for (Path path : pathsToResetOnlyWhenValueMatches)
			{
				Object value = context.getValue(path);
				context.setValueEnablingPrivilegeForNode(AdaptationValue.INHERIT_VALUE, path);
				Object inheritValue = context.getValue(path);
				if (!Objects.equals(value, inheritValue))
				{
					context.setValueEnablingPrivilegeForNode(value, path);
				}
			}
		}
	}
}
