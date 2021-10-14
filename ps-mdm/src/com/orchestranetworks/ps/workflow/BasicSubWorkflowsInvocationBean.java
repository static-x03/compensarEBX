/*
 * Copyright Orchestra Networks 2000-2012. All rights reserved.
 */
package com.orchestranetworks.ps.workflow;

import java.util.*;

import com.onwbp.adaptation.*;
import com.onwbp.base.text.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.workflow.*;

/**
 */
public abstract class BasicSubWorkflowsInvocationBean extends SubWorkflowsInvocationBean
{
	protected abstract List<String> determineSubWorkflowModels(DataContextReadOnly dataContext);

	protected abstract String getSubWorkflowLabel(
		ProcessLauncher launcher,
		DataContextReadOnly dataContext);

	protected abstract String getSubWorkflowDescription(
		ProcessLauncher launcher,
		DataContextReadOnly dataContext);

	@Override
	public void handleCreateSubWorkflows(SubWorkflowsCreationContext context)
		throws OperationException
	{
		List<String> subWorkflowModels = determineSubWorkflowModels(context);
		for (int i = 0; i < subWorkflowModels.size(); i++)
		{
			String subWorkflowModel = subWorkflowModels.get(i);
			ProcessLauncher launcher = context
				.registerSubWorkflow(AdaptationName.forName(subWorkflowModel), "subworkflow" + i);
			mapSubWorkflowInput(launcher, context);

			String label = getSubWorkflowLabel(launcher, context);
			if (label != null)
			{
				launcher.setLabel(UserMessage.createInfo(label));
			}
			String description = getSubWorkflowDescription(launcher, context);
			if (description != null)
			{
				launcher.setDescription(UserMessage.createInfo(description));
			}
		}
		context.launchSubWorkflows();
	}

	@Override
	public void handleCompleteAllSubWorkflows(SubWorkflowsCompletionContext context)
		throws OperationException
	{
		List<ProcessInstance> subWorkflows = context.getCompletedSubWorkflows();
		for (ProcessInstance subWorkflow : subWorkflows)
		{
			mapSubWorkflowOutput(subWorkflow, context);
		}
	}

	protected void mapSubWorkflowInput(ProcessLauncher launcher, DataContextReadOnly dataContext)
	{
		Set<String> paramsToMap = getInputParametersToMap(dataContext);
		for (String param : paramsToMap)
		{
			launcher.setInputParameter(param, dataContext.getVariableString(param));
		}
	}

	protected void mapSubWorkflowOutput(ProcessInstance processInstance, DataContext dataContext)
	{
		DataContextReadOnly subWorkflowDataContext = processInstance.getDataContext();
		Set<String> paramsToMap = getOutputParametersToMap(dataContext);
		for (String param : paramsToMap)
		{
			if (dataContext.isVariableDefined(param)
				&& subWorkflowDataContext.isVariableDefined(param))
			{
				dataContext
					.setVariableString(param, subWorkflowDataContext.getVariableString(param));
			}
		}
	}

	protected Set<String> getInputParametersToMap(DataContextReadOnly dataContext)
	{
		HashSet<String> params = new HashSet<>();

		params.add(WorkflowConstants.PARAM_MASTER_DATA_SPACE);
		params.add(WorkflowConstants.PARAM_WORKING_DATA_SPACE);
		params.add(WorkflowConstants.PARAM_DATA_SET);
		params.add(WorkflowConstants.PARAM_XPATH_TO_TABLE);
		params.add(WorkflowConstants.PARAM_RECORD);
		params.add(WorkflowConstants.PARAM_RECORD_NAME_VALUE);
		params.add(WorkflowConstants.PARAM_CURRENT_USER_ID);
		params.add(WorkflowConstants.PARAM_CURRENT_USER_LABEL);
		params.add(WorkflowConstants.PARAM_USER_TASK_CREATE_DATE_TIME);
		return params;
	}

	protected Set<String> getOutputParametersToMap(DataContextReadOnly dataContext)
	{
		HashSet<String> params = new HashSet<>();

		params.add(WorkflowConstants.PARAM_WORKING_DATA_SPACE);
		params.add(WorkflowConstants.PARAM_RECORD);
		params.add(WorkflowConstants.PARAM_RECORD_NAME_VALUE);
		params.add(WorkflowConstants.PARAM_CURRENT_USER_ID);
		params.add(WorkflowConstants.PARAM_CURRENT_USER_LABEL);
		params.add(WorkflowConstants.PARAM_USER_TASK_CREATE_DATE_TIME);
		return params;
	}
}
