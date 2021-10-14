package com.orchestranetworks.ps.usertask;

import java.util.*;

import org.apache.commons.lang3.*;

import com.onwbp.base.text.*;
import com.orchestranetworks.instance.*;
import com.orchestranetworks.ps.workflow.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.workflow.*;

public class GeneralMaintenanceUserTask extends BasicUserTask
{
	/* 
	 * -- General Maintenance User Task and General Approver User Task Extensions can now be used with Multi-WorkItem User Tasks where each Work item is offered to a different Role and executed in Parallel.
	 * -- Also, there is new parameter named <useRoleNameForCurrentUserDataContextVariable> which will store the current user for a given role in a role-specific data context variable, 
	 *      so when there are multiple data entry roles or multiple approver roles in the workflow, the current user can be tracked for each of the roles, 
	 *      resulting in automatically allocating the current user when that role is needed for re-execution of a given user task.
	 * -- the roleName parameter can now be used in Multi-WorkItem User Tasks by concatenating the names of the various Roles for each work item into the RoleName Parameter field.
	 * -- the default delimiter will be a ";", but can be overriden to use something different if desired.
	 * -- if the new <useRoleNameForCurrentUserDataContextVariable> is set to true, 
	 *      then the current user data context variable for this task will default to a data context variable using the convention "currentUser" + <Role Name> where any spaces or & have been removed from the Role Name
	 * -- the <getDataContextVariableForRole(Role)> method can be overridden to use a different convention if desired
	 * --  (if this parameter is left unspecified or is set to false, then current user will be stored in the standard <currentUserId> or <currentApprover> data context field)
	
	 *  These should be especially useful in Maker/Checker workflows where there are "Enrichment Data Entry" user tasks involving 1 or more enrichment roles 
	 *     and also in situations where there are multiple Approvers required either approving in Parallel or in Sequence.
	 */

	private String roleName = null;
	private String roleNameDelimiter = ";";
	// roleName parameter can be used in Multi-WorkItem User Tasks by concatenating the names of the various Roles for each work item into the RoleName Parameter field.
	// -- the default delimiter will be a ";", but can be overridden to use something different if desired.

	private boolean useRoleNameForCurrentUserDataContextVariable = false;
	// if this parameter is set to true, then the current user data context variable for this task will default to a data context variable
	//  using the convention "currentUser" + <Role Name> where any spaces or & have been removed from the Role Name
	//  -- the <getDataContextVariableForRole(Role)> method can be overridden to use a different convention
	// (if this parameter is left unspecified or is set to false, then current user will be stored in the standard <currentUserId> data context field)

	private boolean performDatasetValidation = false;

	private boolean validateChangedRecordsOnly = false;
	// if this parameter is set to true, then only the records that have been changed for the dataset in the working dataspace will be validated
	//   -- This should only be used in lieu of full dataset validation in the following use cases:
	//         1) it is known that there are errors that may exist in the master dataspace prior to the start of the workflow and are not expected to be fixed in this workflow.
	//         2) the dataset is too large to do full dataset validation each time a user task is submitted
	//              -- please be aware that validation errors may occur in unchanged records as a side effect of the updates that were made in this work item.
	//              -- if this is a concern, you should either extend this class to specifically check for any known possibilities in your checkBeforeWorkitemCompletion method after calling super. checkBeforeWorkitemCompletion(),
	//                   -- Ordo full dataset validation in a script task following the user task, and then redirect back to this user task if new validation errors arise

	public String getRoleName()
	{
		return roleName;
	}

	public void setRoleName(String roleName)
	{
		this.roleName = roleName;
	}

	public boolean isPerformDatasetValidation()
	{
		return performDatasetValidation;
	}

	public void setPerformDatasetValidation(boolean performDatasetValidation)
	{
		this.performDatasetValidation = performDatasetValidation;
	}

	public boolean isValidateChangedRecordsOnly()
	{
		return validateChangedRecordsOnly;
	}

	public void setValidateChangedRecordsOnly(boolean performIncrementalDatasetValidation)
	{
		this.validateChangedRecordsOnly = performIncrementalDatasetValidation;
	}

	@Override
	public void handleCreate(final UserTaskCreationContext context) throws OperationException
	{
		WorkflowUtilities.setUserTaskCreateDateTime(context);
		List<Role> roles = getRolesForUserTask(context, context.getRepository());
		addUsersAndRoles(context, roles);
	}

	/**
	 * By default:
	 *   -- Allows for the RoleName Parameter to represent multiple roles using the role name delimiter parameter
	 *   -- Returns the role(s) for the specified role name(s) 
	 * 
	 * but can be overridden for different behavior.
	 * 
	 * @param context the data context
	 * @param repo the repository
	 * @return the roles
	 * @throws OperationException if an exception occurs
	 */
	protected List<Role> getRolesForUserTask(DataContext context, Repository repo)
		throws OperationException
	{
		List<Role> roles = new ArrayList<>();
		if (getRoleName() != null)
		{
			// allows for roleName parameter to represent multiple Multiple Roles
			for (String singleRoleName : StringUtils.split(getRoleName(), getRoleNameDelimiter()))
			{
				Role role = getRoleForUserTask(context, repo, singleRoleName);
				if (role != null)
				{
					roles.add(role);
				}
			}
		}
		return roles;
	}

	protected Role getRoleForUserTask(DataContext context, Repository repo, String roleName)
		throws OperationException
	{
		return Role.forSpecificRole(roleName);
	}

	protected void addUsersAndRoles(final UserTaskCreationContext context, final List<Role> roles)
		throws OperationException
	{
		for (Role role : roles)
		{
			addUserAndRole(context, role);
		}
	}

	@Override
	protected void addUserAndRole(UserTaskCreationContext context, Role userRole)
		throws OperationException
	{
		// Assign User as Current User if there is one already established for this userRole
		// use alternate DataContext variable for Current User if specified for this User Task
		if (isUseRoleNameForCurrentUserDataContextVariable())
		{
			UserReference userReference = WorkflowUtilities.getDesiredUserReference(
				context,
				context.getRepository(),
				getDataContextVariableForRole(userRole));
			addUserReferenceAndRole(context, userRole, userReference);
		}
		else
		{
			super.addUserAndRole(context, userRole);
		}
	}

	// Can override this method if a different convention is used for the current user data context variable for this role
	protected String getDataContextVariableForRole(Role userRole)
	{
		// By Default, will convert Role Name to acceptable Data ContextVariable and add a prefix of "currentUser"
		//  -- need to remove the "R" that EBX prepends to the role name when formating. 
		//  -- and also need to remove any Spaces and "&"s from the Role Name since they are not valid for Data Context Variable names
		return "currentUser" + userRole.format().substring(1).replace(" ", "").replace("&", "");
	}

	@Override
	public void checkBeforeWorkItemCompletion(UserTaskBeforeWorkItemCompletionContext context)
	{
		// For UNIT TESTING ONLY: If your Debug Configuration is set to
		// ignore completion criteria, then this check will be skipped
		// setup a duplicate Debug config with the following argument:
		// -DignoreCompletionCriteria=true
		if (!isCompletionCriteriaIgnored() && context.isAcceptAction())
		{
			if (validateChangedRecordsOnly)
			{
				performValidationOnWorkingDatasetForChangedRecordsOnly(context);
			}
			else if (performDatasetValidation)
			{
				try
				{
					List<Path> tablePathsToBeValidated = getTablePathsToBeValidated(context);
					if (tablePathsToBeValidated != null)
					{
						performValidationOnWorkingDataset(
							context,
							getTablePathsToBeValidated(context));
					}
					else
					{
						performValidationOnWorkingDataset(context);
					}
				}
				catch (OperationException e)
				{
					e.printStackTrace();
					context.reportMessage(
						UserMessage.createError("Error getting Table Paths to be Validated.", e));
				}
			}
		}
		super.checkBeforeWorkItemCompletion(context);
	}

	@Override
	public void handleWorkItemCompletion(final UserTaskWorkItemCompletionContext context)
		throws OperationException
	{
		// set the currentUserId and currentUserLabel variables in the Data
		// Context
		setCurrentUserIdAndLabel(context);
		super.handleWorkItemCompletion(context);

	}

	@Override
	public void setCurrentUserIdAndLabel(final UserTaskWorkItemCompletionContext context)
		throws OperationException
	{
		// Default behavior for a single work item user task is to set the Data Context Variables <currentUserid> and <currentUserLabel>
		// -- However, If this user task has multiple roles/work items, then do not set the current user id and label data context variable
		// -- And, If this user task is using alternate data context variable(s) for the user task, 
		//       then set the "currentUser<RoleName>" data context variable(s) instead of defaulting to the standard currentUser data context variables

		List<Role> roleList = getRolesForUserTask(context, context.getRepository());
		if (roleList.size() == 1)
		{
			if (isUseRoleNameForCurrentUserDataContextVariable())
			{
				String currentUserId = context.getCompletedWorkItem()
					.getUserReference()
					.getUserId();
				context.setVariableString(
					getDataContextVariableForRole(roleList.get(0)),
					currentUserId);
			}
			else
			{
				super.setCurrentUserIdAndLabel(context);
			}
		}
		else
		{
			// When there are multiple Work Items for the User Task, 
			//  we need to wait until the User Task has been completed to update the Data Context Variables
			if (context.checkAllWorkItemMatchStrategy())
			{
				for (Role role : roleList)
				{
					for (WorkItem workItem : context.getProcessInstance().getWorkItems())
					{
						if (role.equals(workItem.getOfferedToProfiles().get(0)))
						{
							String currentUserId = workItem.getUserReference().getUserId();
							context.setVariableString(
								getDataContextVariableForRole(role),
								currentUserId);

						}
					}
				}
			}
		}

	}

	@SuppressWarnings("unchecked")
	protected List<Path> getTablePathsToBeValidated(UserTaskBeforeWorkItemCompletionContext context)
		throws OperationException
	{
		String tablePathsToBeValidatedField = null;
		if (context.isVariableDefined(WorkflowConstants.PARAM_TABLE_PATHS_TO_BE_VALIDATED_FIELD))
		{
			tablePathsToBeValidatedField = context
				.getVariableString(WorkflowConstants.PARAM_TABLE_PATHS_TO_BE_VALIDATED_FIELD);
		}

		if (tablePathsToBeValidatedField == null)
		{
			return null;
		}
		// Use reflection to get the List of Table Paths to be validated from a static variable in a Class that is used by the rest of the workflow
		try
		{
			Class<?> tablePathsToBeValidatedClass = Class
				.forName(StringUtils.substringBeforeLast(tablePathsToBeValidatedField, "."));
			java.lang.reflect.Field fieldContainingList = tablePathsToBeValidatedClass
				.getField(StringUtils.substringAfterLast(tablePathsToBeValidatedField, "."));
			return (List<Path>) fieldContainingList.get(null);
		}
		catch (Exception e)
		{
			throw OperationException.createError(
				"Parameter 'tablePathsToBeValidatedField' must be a valid List of Paths.",
				e);
		}
	}

	public String getRoleNameDelimiter()
	{
		return roleNameDelimiter;
	}

	public void setRoleNameDelimiter(String roleNameDelimiter)
	{
		this.roleNameDelimiter = roleNameDelimiter;
	}

	public boolean isUseRoleNameForCurrentUserDataContextVariable()
	{
		return useRoleNameForCurrentUserDataContextVariable;
	}

	public void setUseRoleNameForCurrentUserDataContextVariable(
		boolean useRoleNameForCurrentUserDataContextVariable)
	{
		this.useRoleNameForCurrentUserDataContextVariable = useRoleNameForCurrentUserDataContextVariable;
	}

}
