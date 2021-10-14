package com.orchestranetworks.ps.service;

import java.util.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.ps.procedure.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.ui.selection.*;

/**
 * When you add (required) fields with a default value to the data model, these will appear as INHERITED/unset
 * in the corresponding table in the data set.  This service can be executed on a table to initialize the fields
 * to their default value.
 */
public class InitializeDefaultFieldValues extends AbstractUserService<TableViewEntitySelection>
{

	@Override
	public void execute(Session session) throws OperationException
	{
		ProcedureExecutor.executeProcedure(
			this::initDefaults,
			session,
			context.getEntitySelection().getDataset());
	}

	private void initDefaults(ProcedureContext pContext) throws OperationException
	{
		TableViewEntitySelection selection = context.getEntitySelection();
		AdaptationTable table = selection.getTable();
		SchemaNode rootNode = table.getTableOccurrenceRootNode();
		List<SchemaNode> fieldsWithDefault = new ArrayList<>();
		collectFields(rootNode.getNodeChildren(), fieldsWithDefault);

		RequestResult allResults = null;
		RequestResult selectedResults = selection.getSelectedRecords().execute();
		try
		{
			RequestResult rr;
			if (selectedResults.isEmpty())
			{
				allResults = selection.getAllRecords().execute();
				rr = allResults;
			}
			else
			{
				rr = selectedResults;
			}
			initDefaults(pContext, fieldsWithDefault, rr);
		}
		finally
		{
			selectedResults.close();
			if (allResults != null)
			{
				allResults.close();
			}
		}
	}

	private void initDefaults(
		ProcedureContext pContext,
		List<SchemaNode> fieldsWithDefault,
		RequestResult requestResult)
		throws OperationException
	{
		ModifyValuesProcedure mvp = new ModifyValuesProcedure();
		Adaptation next;
		while ((next = requestResult.nextAdaptation()) != null)
		{
			initDefaults(pContext, next, fieldsWithDefault, mvp);
		}
	}

	private void initDefaults(
		ProcedureContext pContext,
		Adaptation next,
		List<SchemaNode> fieldsWithDefault,
		ModifyValuesProcedure mvp)
		throws OperationException
	{
		mvp.clearValues();
		mvp.setAdaptation(next);
		for (SchemaNode schemaNode : fieldsWithDefault)
		{
			Path path = schemaNode.getPathInAdaptation();
			if (AdaptationValue.INHERIT_VALUE.equals(next.getValueWithoutResolution(path)))
			{
				mvp.setValue(path, schemaNode.getDefaultValue());
			}
		}
		if (!mvp.isEmpty())
		{
			mvp.execute(pContext);
		}
	}

	private void collectFields(SchemaNode[] nodes, List<SchemaNode> fieldsWithDefault)
	{
		for (SchemaNode node : nodes)
		{
			if (node.isTerminalValue() && node.getDefaultValue() != null
				&& node.getInheritanceProperties() == null)
			{
				fieldsWithDefault.add(node);
			}
			if (node.isComplex())
				collectFields(node.getNodeChildren(), fieldsWithDefault);
		}
	}
}
