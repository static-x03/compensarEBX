package com.orchestranetworks.ps.admin.devartifacts.impl;

import java.io.*;
import java.util.*;

import com.onwbp.adaptation.*;
import com.onwbp.base.text.*;
import com.orchestranetworks.history.repository.*;
import com.orchestranetworks.instance.*;
import com.orchestranetworks.ps.accessrule.*;
import com.orchestranetworks.ps.adaptationfilter.*;
import com.orchestranetworks.ps.admin.devartifacts.adaptationfilter.*;
import com.orchestranetworks.ps.admin.devartifacts.addon.adix.*;
import com.orchestranetworks.ps.admin.devartifacts.addon.dama.*;
import com.orchestranetworks.ps.admin.devartifacts.config.*;
import com.orchestranetworks.ps.admin.devartifacts.constants.*;
import com.orchestranetworks.ps.admin.devartifacts.modifier.*;
import com.orchestranetworks.ps.admin.devartifacts.util.*;
import com.orchestranetworks.ps.constants.*;
import com.orchestranetworks.ps.procedure.*;
import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.ps.util.addon.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;

/**
 * Core implementation of dev artifacts service
 */
public abstract class DevArtifactsBase implements DevArtifactsConstants
{
	public static final String PARAM_ENVIRONMENT_COPY = "environmentCopy";

	protected static final String DATA_MODEL_SCHEMA_LOCATION_PREFIX = "urn:ebx:module:";

	private static final String MATCHES_NONE_MESSAGE_TEMPLATES_PREDICATE = "osd:is-null("
		+ AdminUtil.getWorkflowModelsConfigurationMessageTemplateIdPath().format() + ")";

	protected DevArtifactsConfig config;

	// Counter for number of errors that have occurred within the current dev artifacts run.
	private int errorCount = 0;

	protected DevArtifactsBase()
	{
		this(null);
	}

	protected DevArtifactsBase(DevArtifactsConfig config)
	{
		this.config = config;
	}

	/**
	 * Process the given table
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param table
	 *            the table
	 * @param folder
	 *            the folder to read from or write to
	 * @param filename
	 *            the filename to read from or write to, without the suffix
	 * @param predicate
	 *            the predicate to apply to the table, or <code>null</code>. (If specified, will
	 *            take precedence over <code>filter</code>.)
	 * @param filter
	 *            the programmatic filter to apply to the table, or <code>null</code>
	 * @param artifactFileModifier
	 *            the modifier, if data needs to be modified upon processing, or <code>null</code> if not
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected abstract void processTable(
		ProcedureContext pContext,
		AdaptationTable table,
		File folder,
		String filename,
		String predicate,
		AdaptationFilter filter,
		ArtifactFileModifier artifactFileModifier)
		throws DevArtifactsException;

	/**
	 * Process the given group
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param dataSet
	 *            the data set
	 * @param groupNode
	 *            the node for the group
	 * @param folder
	 *            the folder to read from or write to
	 * @param filename
	 *            the filename to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected abstract void processGroup(
		ProcedureContext pContext,
		Adaptation dataSet,
		SchemaNode groupNode,
		File folder,
		String filename)
		throws DevArtifactsException;

	/**
	 * Process the given data set as XML
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param dataSet
	 *            the data set
	 * @param folder
	 *            the folder to read from or write to
	 * @param filePrefix
	 *            the prefix of the file (prior to the data set name)
	 * @param artifactFileModifier
	 *            the modifier, if data needs to be modified upon processing, or <code>null</code> if not
	 * @param suppressTriggers
	 *            indicator of whether or not triggers should be suppressed
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected abstract void processDataSetDataXML(
		ProcedureContext pContext,
		Adaptation dataSet,
		File folder,
		String filePrefix,
		ArtifactFileModifier artifactFileModifier,
		boolean suppressTriggers)
		throws DevArtifactsException;

	/**
	 * Process the given data set's file for its properties (such as label and owner)
	 * 
	 * @param locale
	 *            the session's locale
	 * @param masterDataSpaceName
	 *            the name of the master data space. This is needed for when the filename is specified
	 *            to contain the data space name, but we're importing into child data spaces.
	 *            If <code>null</code>, will assume the name of the <code>dataSpace</code> passed in.
	 * @param qualifyDataSet
	 *            Whether to qualify the data set with the data space name in the file,
	 *            if the configuration specifies to in general. (Will be ignored if the config doesn't specify to.)
	 * @param dataSpace
	 *            the data space
	 * @param dataSetName
	 *            the data set name
	 * @param folder
	 *            the folder to read from or write to
	 * @param filePrefix
	 *            the prefix of the file (prior to the data set name)
	 * @return the properties
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected abstract Properties processDataSetDataPropertiesFile(
		Locale locale,
		String masterDataSpaceName,
		boolean qualifyDataSet,
		AdaptationHome dataSpace,
		AdaptationName dataSetName,
		File folder,
		String filePrefix)
		throws DevArtifactsException;

	/**
	 * Process the given data set's properties (such as label and owner)
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param props
	 *            the properties
	 * @param qualifyDataSet
	 *            Whether to qualify the data set with the data space name in the file,
	 *            if the configuration specifies to in general. (Will be ignored if the config doesn't specify to.)
	 * @param dataSet
	 *            the data set
	 * @param folder
	 *            the folder to read from or write to
	 * @param filePrefix
	 *            the prefix of the file (prior to the data set name)
	 * @throws IOException
	 *             if there was an exception
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected abstract void processDataSetDataProperties(
		ProcedureContext pContext,
		Properties props,
		boolean qualifyDataSet,
		Adaptation dataSet,
		File folder,
		String filePrefix)
		throws DevArtifactsException;

	/**
	 * Process all of the artifacts
	 * 
	 * @param repo
	 *            the repository
	 * @param session
	 *            the session
	 * @param environmentCopy
	 *            whether to process the environment copy artifacts
	 * @throws OperationException
	 *             if there was an exception
	 */
	public void processArtifacts(Repository repo, Session session, boolean environmentCopy)
		throws OperationException
	{
		Role authorizedRole = config.getAuthorizedRole();
		if (authorizedRole != null && !session.isUserInRole(authorizedRole))
		{
			throw OperationException.createError(
				"Must be in role " + authorizedRole.getRoleName() + " to process artifacts.");
		}

		File adminFolder;
		File permissionsFolder;
		File dataFolder;
		File workflowsFolder;
		File perspectivesFolder;
		File addonAdixFolder;
		File addonDamaFolder;
		File addonMameFolder;

		if (environmentCopy)
		{
			adminFolder = config.getCopyEnvironmentAdminFolder();
			permissionsFolder = config.getCopyEnvironmentPermissionsFolder();
			dataFolder = config.getCopyEnvironmentDataFolder();
			workflowsFolder = config.getCopyEnvironmentWorkflowsFolder();
			perspectivesFolder = config.getCopyEnvironmentPerspectivesFolder();
			addonAdixFolder = config.getCopyEnvironmentAddonAdixFolder();
			addonDamaFolder = config.getCopyEnvironmentAddonDamaFolder();
			addonMameFolder = config.getCopyEnvironmentAddonMameFolder();
		}
		else
		{
			adminFolder = config.getAdminFolder();
			permissionsFolder = config.getPermissionsFolder();
			dataFolder = config.getDataFolder();
			workflowsFolder = config.getWorkflowsFolder();
			perspectivesFolder = config.getPerspectivesFolder();
			addonAdixFolder = config.getAddonAdixFolder();
			addonDamaFolder = config.getAddonDamaFolder();
			addonMameFolder = config.getAddonMameFolder();
		}

		processAdminData(repo, session, adminFolder);
		processPerspectivesData(repo, session, perspectivesFolder);

		processAddonsData(repo, session, adminFolder);
		// TODO: Rest of addons will follow suit with these eventually
		processAddonAdixData(repo, session, addonAdixFolder);
		processAddonDamaData(repo, session, addonDamaFolder);
		processAddonMameData(repo, session, addonMameFolder);

		processDataSpacesPermissions(
			session,
			config.getDataSpacesForPermissions(),
			permissionsFolder);
		processDataSetPermissions(
			repo,
			session,
			config.getDataSetsForPermissions(),
			permissionsFolder);
		processDataTables(repo, session, config.getTablesForData(), dataFolder, DATA_PREFIX);
		processMessageTemplates(repo, session, workflowsFolder);
		processWorkflowModels(
			repo,
			session,
			config.getWorkflowModels(),
			workflowsFolder,
			WORKFLOW_PREFIX);

		if (environmentCopy)
		{
			processDMA(repo, session, config.getCopyEnvironmentDMAFolder());
		}
	}

	/**
	 * Process the administration data
	 * 
	 * @param repo
	 *            the repository
	 * @param session
	 *            the session
	 * @param folder
	 *            the folder to read from or write to
	 * @throws OperationException
	 *             if there was an exception
	 */
	protected void processAdminData(Repository repo, Session session, File folder)
		throws OperationException
	{
		processAdminDataSetPermissions(repo, session, folder);
		processDirectoryData(repo, session, folder);
		processGlobalPermissionsData(repo, session, folder);
		processViewsData(repo, session, folder);
		processTasksData(repo, session, folder);
		processWorkflowAdminConfigurationData(repo, session, folder);
		processHistorizationProfiles(repo, session, folder);
		processAddonRegistrations(repo, session, folder);
	}

	/**
	 * Process the permissions for the administration data sets
	 * 
	 * @param repo
	 *            the repository
	 * @param session
	 *            the session
	 * @param folder
	 *            the folder to read from or write to
	 * @throws OperationException
	 *             if there was an exception
	 */
	protected void processAdminDataSetPermissions(Repository repo, Session session, File folder)
		throws OperationException
	{
		if (config.isProcessAdminDataSetPermissions()
			&& !DevArtifactsConstants.TENANT_POLICY_MULTI.equals(config.getTenantPolicy()))
		{
			Set<Adaptation> dataSets = AdminUtil.getAdminDataSets(repo);
			for (Adaptation dataSet : dataSets)
			{
				Procedure proc = new Procedure()
				{
					@Override
					public void execute(final ProcedureContext pContext) throws Exception
					{
						try
						{
							processDataSetPermissions(pContext, null, false, dataSet, folder);
						}
						catch (DevArtifactsException ex)
						{
							registerException(ArtifactCategory.ADMIN_DATA_SET_PERMISSIONS, ex);
						}
					}
				};
				ProcedureExecutor.executeProcedure(proc, session, dataSet);
			}
		}
	}

	private void processDirectoryData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessDirectoryData())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessDirectoryData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.DIRECTORY, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, session, AdminUtil.getDirectoryDataSpace(repo));
		}
	}

	/**
	 * Process the directory data
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessDirectoryData(ProcedureContext pContext, final File folder)
		throws DevArtifactsException
	{
		Adaptation directoryDataSet = AdminUtil.getDirectoryDataSet(pContext.getAdaptationHome());
		AdaptationTable usersRolesTable = AdminUtil.getDirectoryUsersRolesTable(directoryDataSet);
		AdaptationTable rolesInclusionsTable = AdminUtil
			.getDirectoryRolesInclusionsTable(directoryDataSet);
		AdaptationTable rolesTable = AdminUtil.getDirectoryRolesTable(directoryDataSet);

		processRolesTable(pContext, rolesTable, folder);

		// If there's a roles predicate specified, then need to capture the roles that match
		// and use that when processing the roles inclusions and users roles table
		Set<String> roleNames;
		String tenantRolesPredicate = config.getTenantRolesPredicate();
		if (tenantRolesPredicate == null)
		{
			roleNames = null;
		}
		else
		{
			roleNames = new HashSet<>();
			RequestResult requestResult = rolesTable.createRequestResult(tenantRolesPredicate);
			try
			{
				for (Adaptation roleRecord; (roleRecord = requestResult.nextAdaptation()) != null;)
				{
					roleNames.add(roleRecord.getOccurrencePrimaryKey().format());
				}
			}
			finally
			{
				requestResult.close();
			}
		}
		processRolesInclusionsTable(pContext, rolesInclusionsTable, roleNames, folder, DATA_PREFIX);

		processUsersRolesTable(pContext, usersRolesTable, roleNames, folder, DATA_PREFIX);

		if (!DevArtifactsConstants.TENANT_POLICY_MULTI.equals(config.getTenantPolicy()))
		{
			AdaptationTable salutationsTable = AdminUtil
				.getDirectorySalutationsTable(directoryDataSet);
			SchemaNode mailingListGroup = AdminUtil.getDirectoryMailingListGroup(directoryDataSet);
			SchemaNode policyGroup = AdminUtil.getDirectoryPolicyGroup(directoryDataSet);
			processTable(
				pContext,
				salutationsTable,
				folder,
				DATA_PREFIX + getTableFilename(salutationsTable),
				null,
				null,
				null);
			processGroup(
				pContext,
				directoryDataSet,
				mailingListGroup,
				folder,
				DATA_PREFIX + directoryDataSet.getAdaptationName().getStringName() + "_"
					+ getGroupFilename(mailingListGroup));
			processGroup(
				pContext,
				directoryDataSet,
				policyGroup,
				folder,
				DATA_PREFIX + directoryDataSet.getAdaptationName().getStringName() + "_"
					+ getGroupFilename(policyGroup));
		}
	}

	/**
	 * Process the roles table
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param rolesTable
	 *            the roles table
	 * @param folder
	 *            the folder to read from or write to
	 * @throws OperationException
	 *             if there was an exception
	 */
	protected void processRolesTable(
		ProcedureContext pContext,
		AdaptationTable rolesTable,
		File folder)
		throws DevArtifactsException
	{
		String tenantPolicy = config.getTenantPolicy();
		String sharedRolesPredicate = config.getTenantSharedRolesPredicate();
		String rolesPredicate = config.getTenantRolesPredicate();
		ArtifactFileModifier modifier;
		// If doing an import, may need to do special processing for the emails
		if (config instanceof ImportDevArtifactsConfig)
		{
			// Fill a map with emails for all existing roles that meet the predicates
			Map<String, String> roleEmailMap = new HashMap<>();
			if (!DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
			{
				fillRoleEmailMap(roleEmailMap, rolesTable, sharedRolesPredicate);
			}
			fillRoleEmailMap(roleEmailMap, rolesTable, rolesPredicate);
			// If there are no existing emails, then don't need to use a modifier at all
			if (roleEmailMap.isEmpty())
			{
				modifier = null;
			}
			// Otherwise, create the modifier that will handle keeping the emails that were in
			// the existing records when the artifact file doesn't have an email. We don't want to
			// clear emails since they can vary between environments, and only want to change the
			// email if it's actually specified in the artifact file.
			else
			{
				modifier = new DirectoryRoleArtifactFileModifier(rolesTable, roleEmailMap);
			}
		}
		// For export, no modifier is needed
		else
		{
			modifier = null;
		}

		if (!DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
		{
			processTable(
				pContext,
				rolesTable,
				folder,
				DATA_PREFIX + SHARED_ROLES_PREFIX + getTableFilename(rolesTable),
				sharedRolesPredicate,
				null,
				modifier);
		}
		processTable(
			pContext,
			rolesTable,
			folder,
			DATA_PREFIX + getTableFilename(rolesTable),
			rolesPredicate,
			null,
			modifier);
	}

	private static void fillRoleEmailMap(
		Map<String, String> roleEmailMap,
		AdaptationTable rolesTable,
		String predicate)
	{
		Path emailPath = AdminUtil.getDirectoryRolesEmailPath();
		StringBuilder bldr = new StringBuilder("osd:is-not-null(").append(emailPath.format())
			.append(")");
		if (predicate != null)
		{
			bldr.append(" and (").append(predicate).append(")");
		}
		RequestResult requestResult = rolesTable.createRequestResult(bldr.toString());
		try
		{
			for (Adaptation roleRecord; (roleRecord = requestResult.nextAdaptation()) != null;)
			{
				roleEmailMap.put(
					roleRecord.getOccurrencePrimaryKey().format(),
					roleRecord.getString(AdminUtil.getDirectoryRolesEmailPath()));
			}
		}
		finally
		{
			requestResult.close();
		}
	}

	/**
	 * Process the roles inclusions table
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param rolesInclusionsTable
	 *            the roles inclusions table
	 * @param restrictedRoleNames
	 *            the role names to restrict the processing to
	 * @param folder
	 *            the folder to read from or write to
	 * @param filePrefix
	 *            the prefix of the file (prior to the table name)
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void processRolesInclusionsTable(
		ProcedureContext pContext,
		AdaptationTable rolesInclusionsTable,
		Set<String> restrictedRoleNames,
		File folder,
		String filePrefix)
		throws DevArtifactsException
	{
		AdaptationFilter filter;
		String tenantRolesPredicate = config.getTenantRolesPredicate();
		if (tenantRolesPredicate == null)
		{
			filter = null;
		}
		else
		{
			// Create a filter that handles the role being in the specified list
			// for either of the 2 role fields
			List<AdaptationFilter> filters = Arrays.asList(
				new FieldValueInCollectionAdaptationFilter(
					AdminUtil.getDirectoryRolesInclusionsEncompassingRolePath(),
					restrictedRoleNames),
				new FieldValueInCollectionAdaptationFilter(
					AdminUtil.getDirectoryRolesInclusionsIncludedRolePath(),
					restrictedRoleNames));
			filter = new CompoundAdaptationFilter(filters);
		}

		String rolesInclusionsTableFilename = filePrefix + getTableFilename(rolesInclusionsTable);
		processTable(
			pContext,
			rolesInclusionsTable,
			folder,
			rolesInclusionsTableFilename,
			null,
			filter,
			null);
	}

	/**
	 * Process the users roles table, and the users associated with them
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param usersRolesTable
	 *            the users roles table
	 * @param restrictedRoleNames
	 *            the role names to restrict the processing to
	 * @param folder
	 *            the folder to read from or write to
	 * @param filePrefix
	 *            the prefix of the file (prior to the table name)
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected abstract void processUsersRolesTable(
		ProcedureContext pContext,
		AdaptationTable usersRolesTable,
		Set<String> restrictedRoleNames,
		File folder,
		String filePrefix)
		throws DevArtifactsException;

	/**
	 * Get the filter used to decide which users to process. By default, returns a
	 * {@link FieldValueInCollectionAdaptationFilter}
	 * which processes all users in the given set, but can be overridden for different behavior.
	 * 
	 * @param userPath
	 *            the path to the user field
	 * @param users
	 *            the users
	 * @return the filter
	 */
	protected AdaptationFilter getUsersFilter(Path userPath, Set<String> users)
	{
		return new FieldValueInCollectionAdaptationFilter(userPath, users);
	}

	private void processGlobalPermissionsData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessGlobalPermissionsData())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessGlobalPermissionsData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.GLOBAL_PERMISSIONS, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, session, AdminUtil.getGlobalPermissionsDataSpace(repo));
		}
	}

	/**
	 * Process the global permissions data
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessGlobalPermissionsData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		AdaptationHome globalPermissionsDataSpace = pContext.getAdaptationHome();
		Adaptation globalPermissionsDataSet = AdminUtil
			.getGlobalPermissionsDataSet(globalPermissionsDataSpace);
		AdaptationTable globalPermissionsTable = AdminUtil
			.getGlobalPermissionsTable(globalPermissionsDataSet);

		Set<Role> roles = findTenantRoles(globalPermissionsDataSpace.getRepository());
		AdaptationFilter filter = new GlobalPermissionsAdaptationFilter(
			roles,
			config.getTenantPolicy(),
			null);
		processTable(
			pContext,
			globalPermissionsTable,
			folder,
			DATA_PREFIX + getTableFilename(globalPermissionsTable),
			null,
			filter,
			null);
	}

	private Set<Role> findTenantRoles(Repository repo)
	{
		Set<Role> roles = new HashSet<>();
		String tenantRolesPredicate = config.getTenantRolesPredicate();
		if (tenantRolesPredicate != null)
		{
			Adaptation directoryDataSet = AdminUtil.getDirectoryDataSet(repo);
			AdaptationTable rolesTable = AdminUtil.getDirectoryRolesTable(directoryDataSet);

			RequestResult requestResult = rolesTable.createRequestResult(tenantRolesPredicate);
			try
			{
				for (Adaptation roleRecord; (roleRecord = requestResult.nextAdaptation()) != null;)
				{
					roles.add(Role.forSpecificRole(roleRecord.getOccurrencePrimaryKey().format()));
				}
			}
			finally
			{
				requestResult.close();
			}
		}
		return roles;
	}

	private void processViewsData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessViewsData())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessViewsData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.VIEWS, ex);
					}
				}
			};
			ProcedureExecutor.executeProcedure(proc, session, AdminUtil.getViewsDataSpace(repo));
		}
	}

	/**
	 * Process the views data
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessViewsData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		Adaptation viewsDataSet = AdminUtil.getViewsDataSet(pContext.getAdaptationHome());
		AdaptationTable customViewsTable = AdminUtil.getCustomViewsTable(viewsDataSet);
		AdaptationFilter customViewsFilter = new ViewsAdaptationFilter(
			null,
			AdminUtil.getCustomViewsSchemaKeyPath(),
			AdminUtil.getCustomViewsPublicationNamePath());
		processTable(
			pContext,
			customViewsTable,
			folder,
			DATA_PREFIX + getTableFilename(customViewsTable),
			null,
			customViewsFilter,
			null);

		AdaptationTable defaultViewsTable = AdminUtil.getDefaultViewsTable(viewsDataSet);
		AdaptationFilter defaultViewsFilter = new ViewsAdaptationFilter(
			AdminUtil.getDefaultViewsViewPath(),
			AdminUtil.getCustomViewsSchemaKeyPath(),
			AdminUtil.getCustomViewsPublicationNamePath());
		processTable(
			pContext,
			defaultViewsTable,
			folder,
			DATA_PREFIX + getTableFilename(defaultViewsTable),
			null,
			defaultViewsFilter,
			null);

		AdaptationTable viewsGroupsTable = AdminUtil.getViewsGroupsTable(viewsDataSet);
		AdaptationFilter viewsGroupsFilter = new ViewsAdaptationFilter(
			null,
			AdminUtil.getViewsGroupsSchemaKeyPath(),
			null);
		processTable(
			pContext,
			viewsGroupsTable,
			folder,
			DATA_PREFIX + getTableFilename(viewsGroupsTable),
			null,
			viewsGroupsFilter,
			null);

		AdaptationTable viewsPermissionsTable = AdminUtil.getViewsPermissionsTable(viewsDataSet);
		AdaptationFilter viewsPermissionsFilter = new ViewsAdaptationFilter(
			null,
			AdminUtil.getViewsPermissionsSchemaKeyPath(),
			null);
		processTable(
			pContext,
			viewsPermissionsTable,
			folder,
			DATA_PREFIX + getTableFilename(viewsPermissionsTable),
			null,
			viewsPermissionsFilter,
			null);
	}

	private void processTasksData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessTasksData())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessTasksData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.TASKS, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, session, AdminUtil.getTaskSchedulerDataSpace(repo));
		}
	}

	/**
	 * Process the tasks
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessTasksData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		Adaptation taskSchedulerDataSet = AdminUtil
			.getTaskSchedulerDataSet(pContext.getAdaptationHome());
		AdaptationTable tasksTable = AdminUtil.getTasksTable(taskSchedulerDataSet);
		AdaptationFilter filter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(config.getTenantPolicy())) ? null : new TaskAdaptationFilter();
		processTable(
			pContext,
			tasksTable,
			folder,
			DATA_PREFIX + getTableFilename(tasksTable),
			null,
			filter,
			null);
	}

	/**
	 * Process the perspectives data
	 * 
	 * @param repo
	 *            the repository
	 * @param session
	 *            the session
	 * @param folder
	 *            the folder to read from or write to
	 * @throws OperationException
	 *             if there was an exception
	 */
	protected void processPerspectivesData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessPerspectivesData())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessPerspectivesData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.PERSPECTIVES, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, session, AdminUtil.getPerspectivesDataSpace(repo));
		}
	}

	private void doProcessPerspectivesData(ProcedureContext pContext, File folder)
		throws DevArtifactsException, OperationException
	{
		AdaptationHome perspectivesDataSpace = pContext.getAdaptationHome();
		Adaptation perspectivesDataSet = AdminUtil.getPerspectivesDataSet(perspectivesDataSpace);

		doProcessPerspectivesDataSet(
			pContext,
			folder,
			perspectivesDataSet.getAdaptationName().getStringName(),
			true);

		String tenantPolicy = config.getTenantPolicy();
		// For single & multi-admin, we process the recommended perspectives
		if (!DevArtifactsConstants.TENANT_POLICY_MULTI.equals(tenantPolicy))
		{
			// This is a separate data space than the perspectives themselves, so it's processed
			// in a separate procedure
			final AdaptationHome perspectivePrefsDataSpace = AdminUtil
				.getPerspectivePrefsDataSpace(perspectivesDataSpace.getRepository());

			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessRecommendedPerspectives(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.PERSPECTIVES, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, pContext.getSession(), perspectivePrefsDataSpace);
		}
	}

	/**
	 * Process the recommended perspectives
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessRecommendedPerspectives(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		Adaptation perspectivePrefsDataSet = AdminUtil
			.getPerspectivePrefsDataSet(pContext.getAdaptationHome());
		AdaptationTable recommendedPerspectivesTable = AdminUtil
			.getRecommendedPerspectivesTable(perspectivePrefsDataSet);
		processTable(
			pContext,
			recommendedPerspectivesTable,
			folder,
			DATA_PREFIX + getTableFilename(recommendedPerspectivesTable),
			null,
			null,
			null);
	}

	private void processWorkflowAdminConfigurationData(
		Repository repo,
		Session session,
		final File folder)
		throws OperationException
	{
		if (!DevArtifactsConstants.TENANT_POLICY_MULTI.equals(config.getTenantPolicy()))
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessWorkflowAdminConfigurationData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.WORKFLOW_ADMIN_CONFIG, ex);
					}
				}
			};
			ProcedureExecutor.executeProcedure(
				proc,
				session,
				AdminUtil.getWorkflowAdminConfigurationDataSpace(repo));
		}
	}

	/**
	 * Process the workflow configuration info in the administration section
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessWorkflowAdminConfigurationData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		Adaptation dataSet = AdminUtil
			.getWorkflowAdminConfigurationDataSet(pContext.getAdaptationHome());
		String dataSetName = dataSet.getAdaptationName().getStringName();

		SchemaNode interfaceCustomizationGroup = AdminUtil
			.getWorkflowAdminConfigurationInterfaceCustomizationGroup(dataSet);
		processGroup(
			pContext,
			dataSet,
			interfaceCustomizationGroup,
			folder,
			DATA_PREFIX + dataSetName + "_" + getGroupFilename(interfaceCustomizationGroup));

		SchemaNode prioritesConfigurationGroup = AdminUtil
			.getWorkflowAdminConfigurationPrioritiesConfigurationGroup(dataSet);
		processGroup(
			pContext,
			dataSet,
			prioritesConfigurationGroup,
			folder,
			DATA_PREFIX + dataSetName + "_" + getGroupFilename(prioritesConfigurationGroup));
	}

	private void processHistorizationProfiles(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessHistorizationProfiles())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessHistorizationProfiles(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.HISTORIZATION_PROFILES, ex);
					}
				}
			};
			ProcedureExecutor.executeProcedure(proc, session, AdminUtil.getHistoryDataSpace(repo));
		}
	}

	/**
	 * Process the historization profiles
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessHistorizationProfiles(ProcedureContext pContext, final File folder)
		throws DevArtifactsException
	{
		Adaptation dataSet = AdminUtil.getHistoryDataSet(pContext.getAdaptationHome());
		AdaptationTable historizationProfileTable = AdminUtil.getHistorizationProfileTable(dataSet);
		processTable(
			pContext,
			historizationProfileTable,
			folder,
			DATA_PREFIX + getTableFilename(historizationProfileTable),
			null,
			new HistorizationProfileAdaptationFilter(),
			null);
	}

	private void processAddonRegistrations(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessAddonRegistrations()
			&& !DevArtifactsConstants.TENANT_POLICY_MULTI.equals(config.getTenantPolicy()))
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessAddonRegistrations(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.ADDON_REGISTRATIONS, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, session, AdminUtil.getAddonsRegistrationDataSpace(repo));
		}
	}

	/**
	 * Process the add-on registrations
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessAddonRegistrations(ProcedureContext pContext, final File folder)
		throws DevArtifactsException
	{
		Adaptation dataSet = AdminUtil.getAddonsRegistrationDataSet(pContext.getAdaptationHome());
		AdaptationTable addonRegistrationsTable = AdminUtil.getRegisteredAddonsTable(dataSet);
		processTable(
			pContext,
			addonRegistrationsTable,
			folder,
			DATA_PREFIX + getTableFilename(addonRegistrationsTable),
			null,
			null,
			null);
	}

	protected void doProcessPerspectivesDataGroups(
		ProcedureContext pContext,
		File folder,
		Adaptation dataSet)
		throws DevArtifactsException
	{
		SchemaNode allowedProfilesGroup = AdminUtil.getPerspectivesAllowedProfilesGroup(dataSet);
		processGroup(
			pContext,
			dataSet,
			allowedProfilesGroup,
			folder,
			PERSPECTIVE_PREFIX + dataSet.getAdaptationName().getStringName() + "_"
				+ getGroupFilename(allowedProfilesGroup));

		SchemaNode menuGroup = AdminUtil.getPerspectivesMenuGroup(dataSet);
		processGroup(
			pContext,
			dataSet,
			menuGroup,
			folder,
			PERSPECTIVE_PREFIX + dataSet.getAdaptationName().getStringName() + "_"
				+ getGroupFilename(menuGroup));

		SchemaNode ergonomicsGroup = AdminUtil.getPerspectivesErgonomicsGroup(dataSet);
		processGroup(
			pContext,
			dataSet,
			ergonomicsGroup,
			folder,
			PERSPECTIVE_PREFIX + dataSet.getAdaptationName().getStringName() + "_"
				+ getGroupFilename(ergonomicsGroup));

		SchemaNode defaultOptionsGroup = AdminUtil.getPerspectivesDefaultOptionsGroup(dataSet);
		processGroup(
			pContext,
			dataSet,
			defaultOptionsGroup,
			folder,
			PERSPECTIVE_PREFIX + dataSet.getAdaptationName().getStringName() + "_"
				+ getGroupFilename(defaultOptionsGroup));

		SchemaNode colorsGroup = AdminUtil.getPerspectivesColorsGroup(dataSet);
		processGroup(
			pContext,
			dataSet,
			colorsGroup,
			folder,
			PERSPECTIVE_PREFIX + dataSet.getAdaptationName().getStringName() + "_"
				+ getGroupFilename(colorsGroup));
	}

	protected abstract void doProcessPerspectivesDataSet(
		ProcedureContext pContext,
		File folder,
		String dataSetName,
		boolean root)
		throws DevArtifactsException;

	/**
	 * Get whether the perspective data set with the given name should be processed
	 * 
	 * @param dataSetName the perspective data set name
	 * @param root whether the perspective data set is the root (i.e. the advanced perspective)
	 * @return
	 */
	protected boolean shouldProcessPerspectiveDataSet(String dataSetName, boolean root)
	{
		String tenantPolicy = config.getTenantPolicy();
		// If it's single tenant, all perspectives get processed.
		// If it's multi-admin, we always process the root.
		if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy)
			|| (DevArtifactsConstants.TENANT_POLICY_MULTI_ADMIN.equals(tenantPolicy) && root))
		{
			return true;
		}
		// If it's multi, we never process the root
		if (DevArtifactsConstants.TENANT_POLICY_MULTI.equals(tenantPolicy) && root)
		{
			return false;
		}
		// We process it if the tenant explicitly lists it
		if (config.getTenantPerspectives().contains(dataSetName))
		{
			return true;
		}
		// We process it if it starts with the string specified as the prefix by the tenant
		String tenantPerspectivesPrefix = config.getTenantPerspectivesPrefix();
		return (tenantPerspectivesPrefix != null
			&& dataSetName.startsWith(tenantPerspectivesPrefix));
	}

	public void clearErrorCount()
	{
		errorCount = 0;
	}

	public int getErrorCount()
	{
		return errorCount;
	}

	public void registerException(ArtifactCategory category, DevArtifactsException exception)
	{
		errorCount++;

		StringBuilder bldr = new StringBuilder(LOG_PREFIX).append(" Error");
		if (category != null)
		{
			bldr.append(" in ").append(category.getValue());
		}
		String artifact = exception.getArtifact();
		if (artifact != null)
		{
			bldr.append(" (").append(artifact).append(")");
		}
		bldr.append(": ").append(exception.getMessage());
		DevArtifactsUtil.getLog().error(bldr.toString(), exception);
	}

	/**
	 * Return Summary message describing artifact errors.
	 * Final user message upon completion of dev artifacts service.
	 * Prints either a Success message or an error indicating the number of failed artifacts.
	 */
	public UserMessage getDevArtifactsOutcome()
	{
		StringBuilder bldr = new StringBuilder();
		if (config instanceof ImportDevArtifactsConfig)
		{
			bldr.append("Import");
		}
		else
		{
			bldr.append("Export");
		}
		UserMessage msg;
		if (errorCount == 0)
		{
			bldr.append(" succeeded.");
			msg = UserMessage.createInfo(bldr.toString());
		}
		else
		{
			bldr.append(" completed with ").append(errorCount).append(
				" errors. See kernel.log for details.");
			msg = UserMessage.createError(bldr.toString());
		}
		return msg;
	}

	/**
	 * Process the addons data and permissions
	 * 
	 * @param repo
	 *            the repository
	 * @param session
	 *            the session
	 * @param folder
	 *            the folder to read from or write to
	 * @throws OperationException
	 *             if there was an exception
	 */
	protected void processAddonsData(Repository repo, Session session, File folder)
		throws OperationException
	{
		// TODO: For now, only the admin tenant handles these addons
		if (!DevArtifactsConstants.TENANT_POLICY_MULTI.equals(config.getTenantPolicy()))
		{
			// TODO: Adix and Dama are handled elsewhere since they get their own folders.
			//       Eventually, the others will follow suit.
			if (config.isProcessAddonDqidData())
			{
				processAddonDqidData(repo, session, folder);
			}
			if (config.isProcessAddonDmdvData())
			{
				processAddonDmdvData(repo, session, folder);
			}
		}
	}

	private void processAddonAdixData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessAddonAdixData())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						processAddonAdixDataExchangeDataSpaceData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.ADDON_ADIX, ex);
					}
				}
			};
			ProcedureExecutor.executeProcedure(
				proc,
				session,
				AddonAdixAdminUtil.getAddonAdixDataExchangeDataSpace(repo));

			proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						processAddonAdixDataModelingDataSpaceData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.ADDON_ADIX, ex);
					}
				}
			};
			ProcedureExecutor.executeProcedure(
				proc,
				session,
				AddonAdixAdminUtil.getAddonAdixDataModelingDataSpace(repo));
		}
	}

	/**
	 * Process the adix (Data Exchange) addon data related to the Data Exchange data space
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void processAddonAdixDataExchangeDataSpaceData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		AdaptationHome adixDataExchangeDataSpace = pContext.getAdaptationHome();
		Adaptation adixDataExchangeDataSet = AddonAdixAdminUtil
			.getAddonAdixDataExchangeDataSet(adixDataExchangeDataSpace);

		if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(config.getTenantPolicy())
			|| config.getAddonAdixTenantPrefix() != null)
		{
			final AddonAdixDevArtifactsCache cache = new AddonAdixDevArtifactsCache();
			cache.load(config, adixDataExchangeDataSet);

			processAdixDataExchangeTenantTables(pContext, adixDataExchangeDataSet, folder, cache);

			if (!DevArtifactsConstants.TENANT_POLICY_MULTI.equals(config.getTenantPolicy()))
			{
				String prefix = ADDON_ADIX_DATA_EXCHANGE_PREFIX
					+ adixDataExchangeDataSet.getAdaptationName().getStringName() + "_";
				SchemaNode rootNode = adixDataExchangeDataSet.getSchemaNode();

				SchemaNode importPreferenceGroupNode = rootNode
					.getNode(AddonAdixAdminUtil.ADDON_ADIX_IMPORT_PREFERENCE_GROUP_PATH);
				processGroup(
					pContext,
					adixDataExchangeDataSet,
					importPreferenceGroupNode,
					folder,
					prefix + getGroupFilename(importPreferenceGroupNode));
			}

			if (config.isProcessAdminDataSetPermissions())
			{
				processDataSetPermissions(pContext, null, false, adixDataExchangeDataSet, folder);
			}
		}
	}

	protected void processAdixDataExchangeTenantTables(
		ProcedureContext pContext,
		Adaptation adixDataExchangeDataSet,
		File folder,
		AddonAdixDevArtifactsCache cache)
		throws DevArtifactsException
	{
		// Need to disable blocking constraints because otherwise won't be able to do the deletes
		// as needed in adix tables
		pContext.setBlockingConstraintsDisabled(true);

		// Disable triggers because some tables have triggers that cause odd behavior
		// and they shouldn't really be needed since the input files should have everything required
		pContext.setTriggerActivation(false);

		String tenantPolicy = config.getTenantPolicy();
		if (!DevArtifactsConstants.TENANT_POLICY_MULTI.equals(tenantPolicy))
		{
			// TODO: This was introduced after 5.9.5. Prior, it was handled in Data Modeling.
			//       Once we stop supporting previous versions, we can remove this check for the node.
			SchemaNode adixGlobalPermissionsTableNode = adixDataExchangeDataSet.getSchemaNode()
				.getNode(AddonAdixAdminUtil.ADDON_ADIX_GLOBAL_PERMISSION_TABLE_PATH);
			if (adixGlobalPermissionsTableNode != null)
			{
				AdaptationTable adixGlobalPermissionTable = adixDataExchangeDataSet
					.getTable(AddonAdixAdminUtil.ADDON_ADIX_GLOBAL_PERMISSION_TABLE_PATH);
				Set<Role> tenantRoles = findTenantRoles(
					pContext.getAdaptationHome().getRepository());
				processTable(
					pContext,
					adixGlobalPermissionTable,
					folder,
					ADDON_ADIX_PREFIX + getTableFilename(adixGlobalPermissionTable),
					null,
					new GlobalPermissionsAdaptationFilter(
						tenantRoles,
						tenantPolicy,
						AddonAdixAdminUtil.ADDON_ADIX_GLOBAL_PERMISSION_PROFILE_PATH),
					null);
			}

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_DEFAULT_OPTION_IMPORT_EXPORT_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_STYLE_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_VALIDATOR_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_DATE_TIME_PATTERN_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_JNDI_DATA_SOURCE_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_SQL_DATA_SOURCE_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_TRANSFORMATION_FUNCTION_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_MAPPING_TYPE_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_DATA_TYPE_TABLE_PATH);

			processAdixDataExchangeTenantTable(
				pContext,
				folder,
				cache,
				adixDataExchangeDataSet,
				AddonAdixAdminUtil.ADDON_ADIX_APPLICATION_TYPE_TABLE_PATH);
		}

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_APPLICATION_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_PROPERTY_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_OBJECT_CLASS_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_OBJECT_CLASS_PROPERTY_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_APPLICATION_OBJECT_CLASS_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_PATH_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_APPLICATION_BY_TYPE_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_TABLE_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_TABLE_HIERARCHICAL_VIEW_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_FIELD_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_FIELD_HIERARCHICAL_VIEW_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_APPLICATION_BY_TYPE_VERSION_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_APPLICATION_INTERFACE_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_APPLICATION_INTERFACE_CONFIGURATION_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_TABLE_MAPPING_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_TABLE_MAPPING_CONFIGURATION_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_FIELD_MAPPING_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_FIELD_MAPPING_TRANSFORMATION_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_ADDITIONAL_FIELD_MAPPING_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_ADDITIONAL_FIELD_MAPPING_TRANSFORMATION_TABLE_PATH);

		processAdixDataExchangeTenantTable(
			pContext,
			folder,
			cache,
			adixDataExchangeDataSet,
			AddonAdixAdminUtil.ADDON_ADIX_FIELD_MAPPING_CONFIGURATION_TABLE_PATH);
	}

	private void processAdixDataExchangeTenantTable(
		ProcedureContext pContext,
		File folder,
		AddonAdixDevArtifactsCache cache,
		Adaptation adixDataExchangeDataSet,
		Path tablePath)
		throws DevArtifactsException
	{
		AdaptationTable table = adixDataExchangeDataSet.getTable(tablePath);
		processTable(
			pContext,
			table,
			folder,
			ADDON_ADIX_DATA_EXCHANGE_PREFIX + getTableFilename(table),
			null,
			AddonAdixAdaptationFilterFactory
				.createFilter(cache, config.getAddonAdixPreferencePrefix(), tablePath),
			null);
	}

	/**
	 * Process the adix (Data Exchange) addon data related to the Data Modeling data space
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void processAddonAdixDataModelingDataSpaceData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		AdaptationHome adixDataModelingDataSpace = pContext.getAdaptationHome();
		Adaptation adixDataModelingDataSet = AddonAdixAdminUtil
			.getAddonAdixDataModelingDataSet(adixDataModelingDataSpace);

		if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(config.getTenantPolicy())
			|| config.getAddonAdixTenantPrefix() != null)
		{
			processAdixDataModelingTenantTables(pContext, adixDataModelingDataSet, folder);
		}

		if (config.isProcessAdminDataSetPermissions()
			&& !DevArtifactsConstants.TENANT_POLICY_MULTI.equals(config.getTenantPolicy()))
		{
			processDataSetPermissions(pContext, null, false, adixDataModelingDataSet, folder);
		}
	}

	private void processAdixDataModelingTenantTables(
		ProcedureContext pContext,
		Adaptation adixDataModelingDataSet,
		File folder)
		throws DevArtifactsException
	{
		String tenantPrefix = config.getAddonAdixTenantPrefix();
		AdaptationTable dataModelTable = adixDataModelingDataSet
			.getTable(AddonAdixAdminUtil.ADDON_ADIX_DATA_MODELING_DATA_MODEL_TABLE_PATH);
		processTable(
			pContext,
			dataModelTable,
			folder,
			ADDON_ADIX_DATA_MODELING_PREFIX + getTableFilename(dataModelTable),
			null,
			(tenantPrefix == null) ? null
				: new AddonAdixDataModelCodeAdaptationFilter(tenantPrefix, null),
			null);

		AdaptationTable tableTable = adixDataModelingDataSet
			.getTable(AddonAdixAdminUtil.ADDON_ADIX_DATA_MODELING_TABLE_TABLE_PATH);
		processTable(
			pContext,
			tableTable,
			folder,
			ADDON_ADIX_DATA_MODELING_PREFIX + getTableFilename(tableTable),
			null,
			(tenantPrefix == null) ? null
				: new AddonAdixDataModelCodeAdaptationFilter(
					tenantPrefix,
					new Path[] {
							AddonAdixAdminUtil.ADDON_ADIX_DATA_MODELING_TABLE_DATA_MODEL_PATH }),
			null);

		AdaptationTable fieldTable = adixDataModelingDataSet
			.getTable(AddonAdixAdminUtil.ADDON_ADIX_DATA_MODELING_FIELD_TABLE_PATH);
		processTable(
			pContext,
			fieldTable,
			folder,
			ADDON_ADIX_DATA_MODELING_PREFIX + getTableFilename(fieldTable),
			null,
			(tenantPrefix == null) ? null
				: new AddonAdixDataModelCodeAdaptationFilter(
					tenantPrefix,
					new Path[] { AddonAdixAdminUtil.ADDON_ADIX_DATA_MODELING_FIELD_TABLE_FIELD_PATH,
							AddonAdixAdminUtil.ADDON_ADIX_DATA_MODELING_TABLE_DATA_MODEL_PATH }),
			null);

		// TODO: This goes away after 5.9.5 since it's handled by Global Permissions table
		//       in the Data Exchange data set.
		//       Once we stop supporting earlier versions, we can get rid of this.
		SchemaNode permissionsTableNode = adixDataModelingDataSet.getSchemaNode()
			.getNode(AddonAdixAdminUtil.ADDON_ADIX_DATA_MODELING_PERMISSIONS_TABLE_PATH);
		if (permissionsTableNode != null)
		{
			AdaptationTable permissionTable = adixDataModelingDataSet
				.getTable(AddonAdixAdminUtil.ADDON_ADIX_DATA_MODELING_PERMISSIONS_TABLE_PATH);
			Set<Role> tenantRoles = findTenantRoles(pContext.getAdaptationHome().getRepository());
			processTable(
				pContext,
				permissionTable,
				folder,
				ADDON_ADIX_DATA_MODELING_PREFIX + getTableFilename(permissionTable),
				null,
				new GlobalPermissionsAdaptationFilter(tenantRoles, config.getTenantPolicy(), null),
				null);
		}

		// No need to do Data Type Mapping table because no one's allowed to modify those
	}

	private void processAddonDamaData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessAddonDamaData())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessAddonDamaData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.ADDON_DAMA, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, session, AddonDamaAdminUtil.getAddonDamaDataSpace(repo));
		}
	}

	/**
	 * Process the dama (Digital Asset Manager) addon data
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessAddonDamaData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		AdaptationHome damaDataSpace = pContext.getAdaptationHome();
		Adaptation damaDataSet = AddonDamaAdminUtil.getAddonDamaDataSet(damaDataSpace);

		String tenantPolicy = config.getTenantPolicy();
		String tenantPrefix = config.getAddonDamaTenantPrefix();
		if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy) || tenantPrefix != null)
		{
			AdaptationTable driveTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_DRIVE_TABLE_PATH);
			String drivePathPrefix = config.getAddonDamaDrivePathPrefix();
			String drivePredicate = createDamaDrivePredicate(
				tenantPolicy,
				tenantPrefix,
				drivePathPrefix);
			ArtifactFileModifier artifactFileModifier;
			if (drivePathPrefix == null)
			{
				artifactFileModifier = null;
			}
			else
			{
				artifactFileModifier = new DamaDriveArtifactFileModifier(
					drivePathPrefix,
					driveTable,
					((config instanceof ImportDevArtifactsConfig) ? drivePredicate : null));
			}
			processTable(
				pContext,
				driveTable,
				folder,
				DATA_PREFIX + getTableFilename(driveTable),
				drivePredicate,
				null,
				artifactFileModifier);

			AdaptationTable imageConfigurationTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_IMAGE_CONFIGURATION_TABLE_PATH);
			String imageConfigurationPredicate = createAddonPrefixPredicate(
				tenantPolicy,
				AddonDamaAdminUtil.ADDON_DAMA_IMAGE_CONFIGURATION_CODE_PATH,
				AddonDamaAdminUtil.ADDON_DAMA_IMAGE_CONFIGURATION_CODE_PATH,
				tenantPrefix);
			processTable(
				pContext,
				imageConfigurationTable,
				folder,
				DATA_PREFIX + getTableFilename(imageConfigurationTable),
				imageConfigurationPredicate,
				null,
				null);

			AdaptationTable digitalAssetComponentTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_DIGITAL_ASSET_COMPONENT_TABLE_PATH);
			String digitalAssetComponentPredicate = createDamaDigitalAssetComponentPredicate(
				tenantPolicy,
				config.getModules());
			processTable(
				pContext,
				digitalAssetComponentTable,
				folder,
				DATA_PREFIX + getTableFilename(digitalAssetComponentTable),
				digitalAssetComponentPredicate,
				null,
				null);

			AdaptationTable viewConfigurationTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_VIEW_CONFIGURATION_TABLE_PATH);
			String viewConfigurationPredicate = createAddonPrefixPredicate(
				tenantPolicy,
				AddonDamaAdminUtil.ADDON_DAMA_VIEW_CONFIGURATION_CODE_PATH,
				AddonDamaAdminUtil.ADDON_DAMA_VIEW_CONFIGURATION_LABEL_PATH,
				tenantPrefix);
			processTable(
				pContext,
				viewConfigurationTable,
				folder,
				DATA_PREFIX + getTableFilename(viewConfigurationTable),
				viewConfigurationPredicate,
				null,
				null);

			AdaptationTable metadataTypeTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_METADATA_TYPE_TABLE_PATH);
			String metadataTypePredicate = createAddonPrefixPredicate(
				tenantPolicy,
				null,
				AddonDamaAdminUtil.ADDON_DAMA_METADATA_TYPE_CODE_PATH,
				tenantPrefix);
			processTable(
				pContext,
				metadataTypeTable,
				folder,
				DATA_PREFIX + getTableFilename(metadataTypeTable),
				metadataTypePredicate,
				null,
				null);

			AdaptationTable digitalAssetTypeTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_DIGITAL_ASSET_TYPE_TABLE_PATH);
			String digitalAssetTypePredicate = createAddonPrefixPredicate(
				tenantPolicy,
				AddonDamaAdminUtil.ADDON_DAMA_DIGITAL_ASSET_TYPE_BUSINESS_CODE_PATH,
				AddonDamaAdminUtil.ADDON_DAMA_DIGITAL_ASSET_TYPE_BUSINESS_CODE_PATH,
				tenantPrefix);
			processTable(
				pContext,
				digitalAssetTypeTable,
				folder,
				DATA_PREFIX + getTableFilename(digitalAssetTypeTable),
				digitalAssetTypePredicate,
				null,
				null);

			AdaptationTable driveTypeTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_DRIVE_TYPE_TABLE_PATH);
			String driveTypePredicate = createAddonPrefixPredicate(
				tenantPolicy,
				AddonDamaAdminUtil.ADDON_DAMA_DRIVE_TYPE_CODE_PATH,
				AddonDamaAdminUtil.ADDON_DAMA_DRIVE_TYPE_CODE_PATH,
				tenantPrefix);
			processTable(
				pContext,
				driveTypeTable,
				folder,
				DATA_PREFIX + getTableFilename(driveTypeTable),
				driveTypePredicate,
				null,
				null);

			AdaptationTable fileExtensionTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_FILE_EXTENSION_TABLE_PATH);
			String fileExtensionPredicate = createAddonPrefixPredicate(
				tenantPolicy,
				AddonDamaAdminUtil.ADDON_DAMA_FILE_EXTENSION_BUSINESS_CODE_PATH,
				AddonDamaAdminUtil.ADDON_DAMA_FILE_EXTENSION_BUSINESS_CODE_PATH,
				tenantPrefix);
			processTable(
				pContext,
				fileExtensionTable,
				folder,
				DATA_PREFIX + getTableFilename(fileExtensionTable),
				fileExtensionPredicate,
				null,
				null);

			AdaptationTable stateTable = damaDataSet
				.getTable(AddonDamaAdminUtil.ADDON_DAMA_STATE_TABLE_PATH);
			String statePredicate = createAddonPrefixPredicate(
				tenantPolicy,
				AddonDamaAdminUtil.ADDON_DAMA_STATE_CODE_PATH,
				AddonDamaAdminUtil.ADDON_DAMA_STATE_CODE_PATH,
				tenantPrefix);
			processTable(
				pContext,
				stateTable,
				folder,
				DATA_PREFIX + getTableFilename(stateTable),
				statePredicate,
				null,
				null);
		}

		if (config.isProcessAdminDataSetPermissions()
			&& !DevArtifactsConstants.TENANT_POLICY_MULTI.equals(tenantPolicy))
		{
			processDataSetPermissions(pContext, null, false, damaDataSet, folder);
		}
	}

	// Create the predicate to use with the DAMA Drive table
	private static String createDamaDrivePredicate(
		String tenantPolicy,
		String tenantPrefix,
		String drivePathPrefix)
	{
		String builtInRecordCondition = new StringBuilder("starts-with(")
			.append(AddonDamaAdminUtil.ADDON_DAMA_DRIVE_UUID_PATH.format())
			.append(",'")
			.append(DevArtifactsConstants.ADDON_BUILT_IN_RECORD_PREFIX)
			.append("')")
			.toString();
		String drivePathPrefixCondition = (drivePathPrefix == null) ? null
			: new StringBuilder("starts-with(")
				.append(AddonDamaAdminUtil.ADDON_DAMA_DRIVE_PHYSICAL_ROOT_PATH_PATH.format())
				.append(",")
				.append(XPathExpressionHelper.encodeLiteralStringWithDelimiters(drivePathPrefix))
				.append(")")
				.toString();
		StringBuilder bldr = new StringBuilder();
		// For single tenant, include records that are built-in or whose path starts with the drive path prefix
		if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
		{
			bldr.append(builtInRecordCondition);
			if (drivePathPrefix != null)
			{
				bldr.append(" or ").append(drivePathPrefixCondition);
			}
		}
		else
		{
			String tenantPrefixCondition = new StringBuilder("starts-with(")
				.append(AddonDamaAdminUtil.ADDON_DAMA_DRIVE_LABEL_PATH.format())
				.append(",")
				.append(XPathExpressionHelper.encodeLiteralStringWithDelimiters(tenantPrefix))
				.append(")")
				.toString();
			// For multi-admin, include records that are built-in, or if not built-in that start with the tenant prefix
			// (in whatever field it uses for this table) and whose path starts with the drive path prefix
			if (DevArtifactsConstants.TENANT_POLICY_MULTI_ADMIN.equals(tenantPolicy))
			{
				bldr.append(builtInRecordCondition).append(" or (").append(tenantPrefixCondition);
				if (drivePathPrefix != null)
				{
					bldr.append(" and ").append(drivePathPrefixCondition);
				}
				bldr.append(")");
			}
			// For multi, include records that start with the tenant prefix and whose path starts with the drive path prefix
			else
			{
				bldr.append(tenantPrefixCondition);
				if (drivePathPrefix != null)
				{
					bldr.append(" and ").append(drivePathPrefixCondition);
				}
			}
		}
		return bldr.toString();
	}

	// Create the predicate to use with the DAMA Digital Asset Component table
	private static String createDamaDigitalAssetComponentPredicate(
		String tenantPolicy,
		List<String> modules)
	{
		// For single tenant, there is no predicate. It just includes all records.
		if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
		{
			return null;
		}
		StringBuilder bldr = new StringBuilder();
		// For multi-admin, need to include those whose data model field has a module that starts with ebx-
		if (DevArtifactsConstants.TENANT_POLICY_MULTI_ADMIN.equals(tenantPolicy))
		{
			bldr.append("starts-with(")
				.append(
					AddonDamaAdminUtil.ADDON_DAMA_DIGITAL_ASSET_COMPONENT_DATA_MODEL_PATH.format())
				.append(",'")
				.append(DATA_MODEL_SCHEMA_LOCATION_PREFIX)
				.append("ebx-') or ");
		}
		// For both multi and multi-admin, include those whose data model field has a module in the tenant's list
		Iterator<String> iter = modules.iterator();
		while (iter.hasNext())
		{
			String module = iter.next();
			bldr.append("starts-with(")
				.append(
					AddonDamaAdminUtil.ADDON_DAMA_DIGITAL_ASSET_COMPONENT_DATA_MODEL_PATH.format())
				.append(",'")
				.append(DATA_MODEL_SCHEMA_LOCATION_PREFIX)
				.append(module)
				.append(":')");
			if (iter.hasNext())
			{
				bldr.append(" or ");
			}
		}
		return bldr.toString();
	}

	private void processAddonMameData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessAddonMameData())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessAddonMameData(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.ADDON_MAME, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, session, AddonMameAdminUtil.getAddonMameDataSpace(repo));
		}
	}

	/**
	 * Process the mame (Match and Merge) addon data
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessAddonMameData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		AdaptationHome mameDataSpace = pContext.getAdaptationHome();
		Adaptation mameConfigurationDataSet = AddonMameAdminUtil
			.getAddonMameConfigurationDataSet(mameDataSpace);

		String tenantPolicy = config.getTenantPolicy();

		AdaptationTable tableConfigurationTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_TABLE_PATH);
		AdaptationFilter tableConfigurationFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					null,
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			tableConfigurationTable,
			folder,
			DATA_PREFIX + getTableFilename(tableConfigurationTable),
			null,
			tableConfigurationFilter,
			null);

		AdaptationTable matchingProcessTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_MATCHING_PROCESS_TABLE_PATH);
		AdaptationFilter matchingProcessFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] {
							AddonMameAdminUtil.ADDON_MAME_MATCHING_PROCESS_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			matchingProcessTable,
			folder,
			DATA_PREFIX + getTableFilename(matchingProcessTable),
			null,
			matchingProcessFilter,
			null);

		AdaptationTable mergePolicyTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_MERGE_POLICY_TABLE_PATH);
		AdaptationFilter mergePolicyFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] {
							AddonMameAdminUtil.ADDON_MAME_MERGE_POLICY_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			mergePolicyTable,
			folder,
			DATA_PREFIX + getTableFilename(mergePolicyTable),
			null,
			mergePolicyFilter,
			null);

		AdaptationTable survivorFieldTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_SURVIVOR_FIELD_TABLE_PATH);
		AdaptationFilter survivorFieldFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] { AddonMameAdminUtil.ADDON_MAME_SURVIVOR_FIELD_MERGE_POLICY_PATH,
							AddonMameAdminUtil.ADDON_MAME_MERGE_POLICY_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			survivorFieldTable,
			folder,
			DATA_PREFIX + getTableFilename(survivorFieldTable),
			null,
			survivorFieldFilter,
			null);

		AdaptationTable mergeRelationsTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_MERGE_RELATIONS_TABLE_PATH);
		AdaptationFilter mergeRelationsFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] {
							AddonMameAdminUtil.ADDON_MAME_MERGE_RELATIONS_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			mergeRelationsTable,
			folder,
			DATA_PREFIX + getTableFilename(mergeRelationsTable),
			null,
			mergeRelationsFilter,
			null);

		AdaptationTable matchingFieldTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_MATCHING_FIELD_TABLE_PATH);
		AdaptationFilter matchingFieldFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] { AddonMameAdminUtil.ADDON_MAME_MATCHING_FIELD_MATCHING_PROCESS_PATH,
							AddonMameAdminUtil.ADDON_MAME_MATCHING_PROCESS_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			matchingFieldTable,
			folder,
			DATA_PREFIX + getTableFilename(matchingFieldTable),
			null,
			matchingFieldFilter,
			null);

		String tenantPrefix = config.getAddonMameTenantPrefix();

		AdaptationTable nodeFunctionTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_NODE_FUNCTION_TABLE_PATH);
		String nodeFunctionPredicate = createMameReferenceDataPredicate(
			tenantPolicy,
			AddonMameAdminUtil.ADDON_MAME_NODE_FUNCTION_IS_PREBUILT_PATH,
			AddonMameAdminUtil.ADDON_MAME_NODE_FUNCTION_NAME_PATH,
			tenantPrefix);
		processTable(
			pContext,
			nodeFunctionTable,
			folder,
			DATA_PREFIX + getTableFilename(nodeFunctionTable),
			nodeFunctionPredicate,
			null,
			null);

		AdaptationTable matchingAlgorithmTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_MATCHING_ALGORITHM_TABLE_PATH);
		String matchingAlgorithmPredicate = createMameReferenceDataPredicate(
			tenantPolicy,
			AddonMameAdminUtil.ADDON_MAME_MATCHING_ALGORITHM_IS_PREBUILT_PATH,
			AddonMameAdminUtil.ADDON_MAME_MATCHING_ALGORITHM_NAME_PATH,
			tenantPrefix);
		processTable(
			pContext,
			matchingAlgorithmTable,
			folder,
			DATA_PREFIX + getTableFilename(matchingAlgorithmTable),
			matchingAlgorithmPredicate,
			null,
			null);

		AdaptationTable recordSelectionTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_RECORD_SELECTION_POLICY_TABLE_PATH);
		String recordSelectionPredicate = createMameReferenceDataPredicate(
			tenantPolicy,
			AddonMameAdminUtil.ADDON_MAME_RECORD_SELECTION_POLICY_IS_PREBUILT_PATH,
			AddonMameAdminUtil.ADDON_MAME_RECORD_SELECTION_POLICY_NAME_PATH,
			tenantPrefix);
		processTable(
			pContext,
			recordSelectionTable,
			folder,
			DATA_PREFIX + getTableFilename(recordSelectionTable),
			recordSelectionPredicate,
			null,
			null);

		AdaptationTable mergeFunctionTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_MERGE_FUNCTION_TABLE_PATH);
		String mergeFunctionPredicate = createMameReferenceDataPredicate(
			tenantPolicy,
			AddonMameAdminUtil.ADDON_MAME_MERGE_FUNCTION_IS_PREBUILT_PATH,
			AddonMameAdminUtil.ADDON_MAME_MERGE_FUNCTION_NAME_PATH,
			tenantPrefix);
		processTable(
			pContext,
			mergeFunctionTable,
			folder,
			DATA_PREFIX + getTableFilename(mergeFunctionTable),
			mergeFunctionPredicate,
			null,
			null);

		AdaptationTable sourceTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_SOURCE_TABLE_PATH);
		String sourcePredicate = createMameReferenceDataPredicate(
			tenantPolicy,
			AddonMameAdminUtil.ADDON_MAME_SOURCE_IS_PREBUILT_PATH,
			AddonMameAdminUtil.ADDON_MAME_SOURCE_CODE_PATH,
			tenantPrefix);
		processTable(
			pContext,
			sourceTable,
			folder,
			DATA_PREFIX + getTableFilename(sourceTable),
			sourcePredicate,
			null,
			null);

		AdaptationTable tableTrustedSourceTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_TABLE_TRUSTED_SOURCE_TABLE_PATH);
		AdaptationFilter tableTrustedSourceFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] {
							AddonMameAdminUtil.ADDON_MAME_TABLE_TRUSTED_SOURCE_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			tableTrustedSourceTable,
			folder,
			DATA_PREFIX + getTableFilename(tableTrustedSourceTable),
			null,
			tableTrustedSourceFilter,
			null);

		AdaptationTable fieldTrustedSourceTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_FIELD_TRUSTED_SOURCE_TABLE_PATH);
		AdaptationFilter fieldTrustedSourceFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] {
							AddonMameAdminUtil.ADDON_MAME_FIELD_TRUSTED_SOURCE_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			fieldTrustedSourceTable,
			folder,
			DATA_PREFIX + getTableFilename(fieldTrustedSourceTable),
			null,
			fieldTrustedSourceFilter,
			null);

		AdaptationTable decisionTreeTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_DECISION_TREE_TABLE_PATH);
		AdaptationFilter decisionTreeFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] { AddonMameAdminUtil.ADDON_MAME_DECISION_TREE_MATCHING_PROCESS_PATH,
							AddonMameAdminUtil.ADDON_MAME_MATCHING_PROCESS_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			decisionTreeTable,
			folder,
			DATA_PREFIX + getTableFilename(decisionTreeTable),
			null,
			decisionTreeFilter,
			null);

		AdaptationTable decisionNodeTable = mameConfigurationDataSet
			.getTable(AddonMameAdminUtil.ADDON_MAME_DECISION_NODE_TABLE_PATH);
		AdaptationFilter decisionNodeFilter = (DevArtifactsConstants.TENANT_POLICY_SINGLE
			.equals(tenantPolicy))
				? null
				: new SchemaLocationAdaptationFilter(
					config,
					new Path[] { AddonMameAdminUtil.ADDON_MAME_DECISION_NODE_DECISION_TREE_PATH,
							AddonMameAdminUtil.ADDON_MAME_DECISION_TREE_MATCHING_PROCESS_PATH,
							AddonMameAdminUtil.ADDON_MAME_MATCHING_PROCESS_TABLE_CONFIGURATION_PATH },
					AddonMameAdminUtil.ADDON_MAME_TABLE_CONFIGURATION_DATA_MODEL_PATH);
		processTable(
			pContext,
			decisionNodeTable,
			folder,
			DATA_PREFIX + getTableFilename(decisionNodeTable),
			null,
			decisionNodeFilter,
			null);

		if (config.isProcessAdminDataSetPermissions()
			&& !DevArtifactsConstants.TENANT_POLICY_MULTI.equals(tenantPolicy))
		{
			processDataSetPermissions(pContext, null, false, mameConfigurationDataSet, folder);
		}
	}

	// Create the predicate to use with addon tables that only need to check for tenant prefix
	private static String createAddonPrefixPredicate(
		String tenantPolicy,
		Path builtInRecordFieldPath,
		Path tenantFieldPath,
		String tenantPrefix)
	{
		if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
		{
			return null;
		}
		StringBuilder bldr = new StringBuilder();
		if (DevArtifactsConstants.TENANT_POLICY_MULTI_ADMIN.equals(tenantPolicy)
			&& builtInRecordFieldPath != null)
		{
			bldr.append("starts-with(")
				.append(builtInRecordFieldPath.format())
				.append(",'")
				.append(DevArtifactsConstants.ADDON_BUILT_IN_RECORD_PREFIX)
				.append("')");
			if (tenantFieldPath != null)
			{
				bldr.append(" or ");
			}
		}
		if (tenantFieldPath != null)
		{
			bldr.append("starts-with(")
				.append(tenantFieldPath.format())
				.append(",")
				.append(XPathExpressionHelper.encodeLiteralStringWithDelimiters(tenantPrefix))
				.append(")");
		}
		return bldr.toString();
	}

	// Create a predicate used by the mame reference data tables, which contain an isPrebuilt field
	private static String createMameReferenceDataPredicate(
		String tenantPolicy,
		Path isPrebuiltFieldPath,
		Path tenantFieldPath,
		String tenantPrefix)
	{
		StringBuilder bldr = new StringBuilder(isPrebuiltFieldPath.format()).append(" = false");
		if (!DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
		{
			bldr.append(" and starts-with(")
				.append(tenantFieldPath.format())
				.append(",")
				.append(XPathExpressionHelper.encodeLiteralStringWithDelimiters(tenantPrefix))
				.append(")");
		}
		return bldr.toString();
	}

	private void processAddonDqidData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		Procedure proc = new Procedure()
		{
			@Override
			public void execute(ProcedureContext pContext) throws Exception
			{
				try
				{
					doProcessAddonDqidData(pContext, folder);
				}
				catch (DevArtifactsException ex)
				{
					registerException(ArtifactCategory.ADDON_DQID, ex);
				}
			}
		};
		ProcedureExecutor.executeProcedure(proc, session, AdminUtil.getAddonDqidDataSpace(repo));
	}

	/**
	 * Process the dqid (Insight) addon data
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessAddonDqidData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		Adaptation dqidDataSet = AdminUtil.getAddonDqidDataSet(pContext.getAdaptationHome());

		processDataSetDataXML(pContext, dqidDataSet, folder, ADDON_DQID_PREFIX, null, false);

		if (config.isProcessAdminDataSetPermissions())
		{
			processDataSetPermissions(pContext, null, false, dqidDataSet, folder);
		}
	}

	private void processAddonDmdvData(Repository repo, Session session, final File folder)
		throws OperationException
	{
		Procedure proc = new Procedure()
		{
			@Override
			public void execute(ProcedureContext pContext) throws Exception
			{
				try
				{
					doProcessAddonDmdvData(pContext, folder);
				}
				catch (DevArtifactsException ex)
				{
					registerException(ArtifactCategory.ADDON_DMDV, ex);
				}
			}
		};
		ProcedureExecutor.executeProcedure(proc, session, AdminUtil.getAddonDmdvDataSpace(repo));
	}

	/**
	 * Process the dmdv (Data Model and Data Visualization) addon data
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param session
	 *            the session
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessAddonDmdvData(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		Adaptation dmdvDataSet = AdminUtil.getAddonDmdvDataSet(pContext.getAdaptationHome());

		processDataSetDataXML(pContext, dmdvDataSet, folder, ADDON_DMDV_PREFIX, null, true);

		if (config.isProcessAdminDataSetPermissions())
		{
			processDataSetPermissions(pContext, null, false, dmdvDataSet, folder);
		}
	}

	/**
	 * Process the data tables
	 * 
	 * @param session
	 *            the session
	 * @param tablePredicates
	 *            the table/predicate pairs
	 * @param folder
	 *            the folder to read from or write to
	 * @param filePrefix
	 *            the prefix of the file (prior to the table names)
	 * @throws OperationException
	 *             if there was an exception
	 */
	protected void processDataTables(
		Repository repo,
		Session session,
		List<AdaptationTablePredicate> tablePredicates,
		final File folder,
		final String filePrefix)
		throws OperationException
	{
		if (!tablePredicates.isEmpty())
		{
			// Organize the table predicates into a map keyed by data space
			Map<AdaptationHome, Set<AdaptationTablePredicate>> dataSpaceTablePredicateMap = new LinkedHashMap<>();
			for (AdaptationTablePredicate tablePredicate : tablePredicates)
			{
				AdaptationHome dataSpace = tablePredicate.getTable()
					.getContainerAdaptation()
					.getHome();
				Set<AdaptationTablePredicate> tablePredicateSet = dataSpaceTablePredicateMap
					.get(dataSpace);
				if (tablePredicateSet == null)
				{
					tablePredicateSet = new HashSet<>();
					dataSpaceTablePredicateMap.put(dataSpace, tablePredicateSet);
				}
				tablePredicateSet.add(tablePredicate);
			}
			// Loop through and execute all table predicates for each data space in its own procedure
			// (since a procedure can only be executed against a single data space)
			for (Map.Entry<AdaptationHome, Set<AdaptationTablePredicate>> entry : dataSpaceTablePredicateMap
				.entrySet())
			{
				AdaptationHome dataSpace = entry.getKey();
				final Set<AdaptationTablePredicate> dataSpaceTablePredicates = entry.getValue();
				Procedure proc = new Procedure()
				{
					@Override
					public void execute(ProcedureContext pContext) throws Exception
					{
						try
						{
							for (AdaptationTablePredicate tablePredicate : dataSpaceTablePredicates)
							{
								processDataTable(
									pContext,
									tablePredicate,
									folder,
									filePrefix + getTableFilename(tablePredicate.getTable()));
							}
						}
						catch (DevArtifactsException ex)
						{
							registerException(ArtifactCategory.TABLE_DATA, ex);
						}
					}
				};
				ProcedureExecutor.executeProcedure(proc, session, dataSpace);
			}
		}
	}

	/**
	 * Process a data table
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param tablePredicate
	 *            the table/predicate pair
	 * @param folder
	 *            the folder to read from or write to
	 * @param filename
	 *            the filename to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void processDataTable(
		ProcedureContext pContext,
		AdaptationTablePredicate tablePredicate,
		File folder,
		String filename)
		throws DevArtifactsException
	{
		AdaptationTable table = tablePredicate.getTable();
		processTable(
			pContext,
			table,
			folder,
			filename,
			tablePredicate.getPredicate(),
			getFilterForDataTable(table),
			null);
	}

	/**
	 * Get the filter to use when processing the specified data table.
	 * By default returns <code>null</code>, but can be overridden to do specific filtering.
	 * 
	 * @param table
	 *            the table
	 * @return the filter
	 */
	protected AdaptationFilter getFilterForDataTable(AdaptationTable table)
	{
		return null;
	}

	/**
	 * Process the permissions for a list of data sets
	 * 
	 * @param repo
	 *            the repository
	 * @param session
	 *            the session
	 * @param dataSets
	 *            the data sets
	 * @param folder
	 *            the folder to read from or write to
	 * @throws OperationException
	 *            if there was an exception
	 */
	protected void processDataSetPermissions(
		Repository repo,
		Session session,
		List<Adaptation> dataSets,
		File folder)
		throws OperationException
	{
		for (Adaptation dataSet : dataSets)
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(final ProcedureContext pContext) throws Exception
				{
					try
					{
						processDataSetPermissions(pContext, null, true, dataSet, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.DATA_SET, ex);
					}
				}
			};
			ProcedureExecutor.executeProcedure(proc, session, dataSet);
		}
	}

	/**
	 * Process the permissions for a data set
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param masterDataSpaceName
	 *            the name of the master data space. This is needed for when the filename is specified
	 *            to contain the data space name, but we're importing into child data spaces.
	 *            If <code>null</code>, will use the data space of the data set passed in.
	 * @param qualifyDataSet
	 *            Whether to qualify the data set with the data space name in the file,
	 *            if the configuration specifies to in general. (Will be ignored if the config doesn't specify to.)
	 * @param dataSet
	 *            the data set
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void processDataSetPermissions(
		ProcedureContext pContext,
		String masterDataSpaceName,
		boolean qualifyDataSet,
		Adaptation dataSet,
		File folder)
		throws DevArtifactsException
	{
		String dataSpaceName = (masterDataSpaceName == null) ? dataSet.getHome().getKey().getName()
			: masterDataSpaceName;
		AdaptationTable permissionsTable = AdminPermissionsUtil.getDataSetPermissionsTable(dataSet);
		String filename = getPermissionsFilename(
			qualifyDataSet,
			config.isQualifyDataSetAndTableFileNames(),
			dataSpaceName,
			dataSet.getAdaptationName().getStringName());
		processTable(pContext, permissionsTable, folder, filename, null, null, null);

		Properties props = processDataSetDataPropertiesFile(
			pContext.getSession().getLocale(),
			dataSpaceName,
			qualifyDataSet,
			dataSet.getHome(),
			dataSet.getAdaptationName(),
			folder,
			PERMISSIONS_DATA_SET_PREFIX);
		processDataSetDataProperties(
			pContext,
			props,
			qualifyDataSet,
			dataSet,
			folder,
			PERMISSIONS_DATA_SET_PREFIX);
	}

	/**
	 * Process the permissions for the data spaces
	 * 
	 * @param session
	 *            the session
	 * @param dataSpaces
	 *            the data spaces
	 * @param folder
	 *            the folder to read from or write to
	 * @throws OperationException
	 *             if there was an exception
	 */
	protected void processDataSpacesPermissions(
		Session session,
		final List<AdaptationHome> dataSpaces,
		final File folder)
		throws OperationException
	{
		if (dataSpaces.isEmpty())
		{
			return;
		}
		Repository repo = dataSpaces.get(0).getRepository();
		// This utilizes a non-public API method, but there's no way to do it currently otherwise
		final AdaptationTable permissionsTable = AdminPermissionsUtil
			.getDataSpacesPermissionsTable(repo);

		Procedure proc = new Procedure()
		{
			@Override
			public void execute(ProcedureContext pContext) throws Exception
			{
				for (AdaptationHome dataSpace : dataSpaces)
				{
					try
					{
						processDataSpacePermissions(pContext, dataSpace, folder, permissionsTable);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.DATA_SPACE, ex);
					}
				}
			}
		};
		ProcedureExecutor
			.executeProcedure(proc, session, permissionsTable.getContainerAdaptation().getHome());
	}

	/**
	 * Process the permissions for a single data space
	 * 
	 * @param session
	 *            the session
	 * @param dataSpace
	 *            the data space
	 * @param folder
	 *            the folder to read from or write to
	 * @param permissionsTable
	 *            the permissions table
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void processDataSpacePermissions(
		ProcedureContext pContext,
		AdaptationHome dataSpace,
		File folder,
		AdaptationTable permissionsTable)
		throws DevArtifactsException
	{
		// There is one permissions table so you need to use a predicate to filter to the data space
		// you want
		processTable(
			pContext,
			permissionsTable,
			folder,
			PERMISSIONS_DATA_SPACE_PREFIX + dataSpace.getKey().getName(),
			AdminPermissionsUtil.DATA_SPACE_PERMISSIONS_DATA_SPACE_KEY_PATH.format() + "='"
				+ dataSpace.getKey().format() + "'",
			null,
			null);
	}

	private void processMessageTemplates(Repository repo, Session session, final File folder)
		throws OperationException
	{
		if (config.isProcessMessageTemplates())
		{
			Procedure proc = new Procedure()
			{
				@Override
				public void execute(ProcedureContext pContext) throws Exception
				{
					try
					{
						doProcessMessageTemplates(pContext, folder);
					}
					catch (DevArtifactsException ex)
					{
						registerException(ArtifactCategory.MESSAGE_TEMPLATES, ex);
					}
				}
			};
			ProcedureExecutor
				.executeProcedure(proc, session, AdminUtil.getWorkflowModelsDataSpace(repo));
		}
	}

	/**
	 * Process the Message templates
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected void doProcessMessageTemplates(ProcedureContext pContext, File folder)
		throws DevArtifactsException
	{
		Adaptation workflowModelsConfigurationDataSet = AdminUtil
			.getWorkflowModelsConfigurationDataSet(pContext.getAdaptationHome());
		AdaptationTable messageTemplatesTable = workflowModelsConfigurationDataSet
			.getTable(AdminUtil.getWorkflowModelsConfigurationMessageTemplateTablePath());
		String predicate;
		if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(config.getTenantPolicy()))
		{
			// Single tenant handles all message templates
			predicate = null;
		}
		else
		{
			Integer[] messageTemplateRange = config.getTenantMessageTemplateRange();
			Integer startId = messageTemplateRange[0];
			Integer endId = messageTemplateRange[1];
			// If no start was specified, or 0 was specified, and no end was specified,
			// then this tenant uses no templates so set the predicate to something that will never match
			if ((startId == null || startId.intValue() == 0) && messageTemplateRange[1] == null)
			{
				predicate = MATCHES_NONE_MESSAGE_TEMPLATES_PREDICATE;
			}
			// Otherwise construct the predicate on the ID based on start & end
			else
			{
				String idPathStr = AdminUtil.getWorkflowModelsConfigurationMessageTemplateIdPath()
					.format();
				StringBuilder bldr = new StringBuilder();
				if (!(startId == null || startId.intValue() == 0))
				{
					bldr.append(idPathStr).append(" >= ").append(startId);
					if (endId != null)
					{
						bldr.append(" and ");
					}
				}
				if (endId != null)
				{
					bldr.append(idPathStr).append(" <= ").append(endId);
				}
				predicate = bldr.toString();
			}
		}
		processTable(
			pContext,
			messageTemplatesTable,
			folder,
			DATA_PREFIX + getTableFilename(messageTemplatesTable),
			predicate,
			null,
			null);
	}

	/**
	 * Process the workflow models
	 * 
	 * @param repo
	 *            the repository
	 * @param session
	 *            the session
	 * @param wfModels
	 *            the names of the workflow models
	 * @param folder
	 *            the folder to read from or write to
	 * @param filePrefix
	 *            the prefix of the file (prior to the workflow model names)
	 * @throws OperationException
	 *             if there was an exception
	 */
	protected void processWorkflowModels(
		Repository repo,
		Session session,
		final List<String> wfModels,
		final File folder,
		final String filePrefix)
		throws OperationException
	{
		AdaptationHome wfDataSpace = AdminUtil.getWorkflowModelsDataSpace(repo);

		Procedure proc = new Procedure()
		{
			@Override
			public void execute(ProcedureContext pContext) throws Exception
			{
				try
				{
					for (String wfModel : wfModels)
					{
						processWorkflowModel(pContext, wfModel, folder, filePrefix);
					}
				}
				catch (DevArtifactsException ex)
				{
					registerException(ArtifactCategory.WORKFLOW_MODELS, ex);
				}
			}
		};
		ProcedureExecutor.executeProcedure(proc, session, wfDataSpace);
	}

	/**
	 * Process the given workflow model
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param wfModels
	 *            the names of the workflow models
	 * @param folder
	 *            the folder to read from or write to
	 * @param filePrefix
	 *            the prefix of the file (prior to the workflow model names)
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected abstract void processWorkflowModel(
		ProcedureContext pContext,
		String wfModel,
		File folder,
		String filePrefix)
		throws DevArtifactsException;

	private void processDMA(Repository repo, Session session, final File folder)
		throws OperationException
	{
		Procedure proc = new Procedure()
		{
			@Override
			public void execute(ProcedureContext pContext) throws Exception
			{
				try
				{
					doProcessDMA(pContext, folder);
				}
				catch (DevArtifactsException ex)
				{
					registerException(ArtifactCategory.DMA, ex);
				}
			}
		};
		ProcedureExecutor.executeProcedure(proc, session, AdminUtil.getDMADataSpace(repo));
	}

	/**
	 * Process the DMA
	 * 
	 * @param pContext
	 *            the procedure context
	 * @param folder
	 *            the folder to read from or write to
	 * @throws DevArtifactsException
	 *             if there was an exception
	 */
	protected abstract void doProcessDMA(ProcedureContext pContext, File folder)
		throws DevArtifactsException;

	/**
	 * Create a map of a data set and its tables, from the given tables (which can belong to
	 * different data sets).
	 * 
	 * @param tables
	 *            the tables
	 * @return a map of key = data set and value = list of tables for that data set
	 */
	protected static Map<Adaptation, List<AdaptationTable>> createMapOfDataSetTables(
		List<AdaptationTable> tables)
	{
		Map<Adaptation, List<AdaptationTable>> dataSetMap = new LinkedHashMap<>();
		for (AdaptationTable table : tables)
		{
			Adaptation dataSet = table.getContainerAdaptation();
			List<AdaptationTable> tableList;
			if (dataSetMap.containsKey(dataSet))
			{
				tableList = dataSetMap.get(dataSet);
			}
			else
			{
				tableList = new ArrayList<>();
			}
			tableList.add(table);
			dataSetMap.put(dataSet, tableList);
		}
		return dataSetMap;
	}

	/**
	 * Get the filename for the given table
	 * 
	 * @param table
	 *            the table
	 * @return the filename
	 */
	protected static String getTableFilename(AdaptationTable table)
	{
		return table.getTablePath().getLastStep().format();
	}

	/**
	 * Get the filename for the given group
	 * 
	 * @param groupNode
	 *            the node for the group
	 * @return the filename
	 */
	protected static String getGroupFilename(SchemaNode groupNode)
	{
		return groupNode.getPathInSchema().getLastStep().format();
	}

	/**
	 * Performs any post-processing required by the service.
	 * By default, clears the cache on {@link DefaultPermissionsUserManager}, but can be overridden
	 * to perform other actions.
	 * 
	 * @param repo
	 *            the repository
	 * @param session
	 *            the session
	 * @throws OperationException
	 *             if there was an exception
	 */
	public void postProcess(Repository repo, Session session) throws OperationException
	{
		DefaultPermissionsUserManager.getInstance().clearCache();
	}

	protected static String getPropertyValueOrNull(Properties props, String key)
	{
		String value = props.getProperty(key);
		if (value != null)
		{
			value = value.trim();
			if ("".equals(value))
			{
				value = null;
			}
		}
		return value;
	}

	protected static void modifyArtifactFile(
		File srcFile,
		BufferedWriter writer,
		ArtifactFileModifier artifactFileModifier,
		boolean export)
		throws IOException
	{
		BufferedReader reader = new BufferedReader(new FileReader(srcFile));
		try
		{
			for (String line; (line = reader.readLine()) != null;)
			{
				List<String> modifiedLines = export ? artifactFileModifier.modifyExport(line)
					: artifactFileModifier.modifyImport(line);
				if (modifiedLines == null)
				{
					writer.write(line);
					writer.newLine();
				}
				else if (!modifiedLines.isEmpty())
				{
					for (String modifiedLine : modifiedLines)
					{
						writer.write(modifiedLine);
						writer.newLine();
					}
				}
			}
		}
		finally
		{
			reader.close();
		}
	}

	protected static String getFullXMLArtifactFilename(File folder, String filename)
	{
		return getFullArtifactFilename(folder, filename, ".xml");
	}

	protected static String getFullPropertiesArtifactFilename(File folder, String filename)
	{
		return getFullArtifactFilename(folder, filename, ".properties");
	}

	private static String getFullArtifactFilename(File folder, String filename, String extension)
	{
		return new StringBuilder(folder.getAbsolutePath()).append(File.separator)
			.append(filename)
			.append(extension)
			.toString();
	}

	protected static String getPermissionsFilename(
		boolean qualifyDataSet,
		boolean qualifyDataSetAndTableFileNames,
		String dataSpaceName,
		String dataSetName)
	{
		StringBuilder bldr = new StringBuilder(PERMISSIONS_DATA_SET_PREFIX);
		if (qualifyDataSet && qualifyDataSetAndTableFileNames)
		{
			bldr.append(dataSpaceName).append(FILE_NAME_SEPARATOR);
		}
		return bldr.append(dataSetName).toString();
	}

	public DevArtifactsConfig getConfig()
	{
		return config;
	}

	public void setConfig(DevArtifactsConfig config)
	{
		this.config = config;
	}

	private class ViewsAdaptationFilter implements AdaptationFilter
	{
		private Path viewPath;
		private Path schemaKeyPath;
		private Path publicationNamePath;

		public ViewsAdaptationFilter(Path viewPath, Path schemaKeyPath, Path publicationNamePath)
		{
			this.viewPath = viewPath;
			this.schemaKeyPath = schemaKeyPath;
			this.publicationNamePath = publicationNamePath;
		}

		@Override
		public boolean accept(Adaptation record)
		{
			Adaptation recordToUse;
			if (viewPath == null)
			{
				recordToUse = record;
			}
			// If a path to view record was specified, then need to follow foreign key to get the view record
			else
			{
				recordToUse = AdaptationUtil.followFK(record, viewPath);
				if (recordToUse == null)
				{
					return false;
				}
			}

			// If there's no publication name field, accept it if policy is single tenant.
			// For multi and multi-admin, additional things need to be checked below.
			String tenantPolicy = config.getTenantPolicy();
			if (publicationNamePath == null)
			{
				if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
				{
					return true;
				}
			}
			// If table has a publication name field
			else
			{
				// Don't accept any that aren't published
				String publicationName = recordToUse.getString(publicationNamePath);
				if (publicationName == null)
				{
					return false;
				}

				// If single tenant, there's nothing more to do, it's accepted
				if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
				{
					return true;
				}

				// If not single tenant, then check the view publications for the tenant
				List<String> tenantViewPublications = config.getTenantViewPublications();
				if (tenantViewPublications.contains(publicationName))
				{
					return true;
				}
				String tenantViewPublicationsPrefix = config.getTenantViewPublicationsPrefix();
				if (tenantViewPublicationsPrefix != null
					&& publicationName.startsWith(tenantViewPublicationsPrefix))
				{
					return true;
				}
			}

			// Check the module
			String schemaKey = recordToUse.getString(schemaKeyPath);
			if (schemaKey == null)
			{
				return false;
			}
			int moduleStartInd = schemaKey.indexOf("module:") + 7;
			int moduleEndInd = schemaKey.indexOf(",", moduleStartInd + 1);
			if (moduleEndInd == -1)
			{
				moduleEndInd = schemaKey.indexOf(":", moduleStartInd + 1);
			}
			String module = schemaKey.substring(moduleStartInd, moduleEndInd).trim();
			return config.getModules().contains(module);
		}
	}

	public class GlobalPermissionsAdaptationFilter implements AdaptationFilter
	{
		private Set<Role> roles;
		private String tenantPolicy;
		private Path profilePath;

		public GlobalPermissionsAdaptationFilter(
			Set<Role> roles,
			String tenantPolicy,
			Path profilePath)
		{
			this.roles = roles;
			this.tenantPolicy = tenantPolicy;
			this.profilePath = profilePath;
		}

		@Override
		public boolean accept(Adaptation record)
		{
			String profileName = (profilePath == null) ? record.getOccurrencePrimaryKey().format()
				: record.getString(profilePath);
			Profile profile = Profile.parse(profileName);
			if (profile.isUserReference())
			{
				return false;
			}
			if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
			{
				return true;
			}
			if (profile.isBuiltIn())
			{
				return DevArtifactsConstants.TENANT_POLICY_MULTI_ADMIN.equals(tenantPolicy);
			}
			if (profile.isSpecificRole())
			{
				String roleName = profileName.substring(1);
				return roles.contains(Role.forSpecificRole(roleName));
			}
			return false;
		}
	}

	private class HistorizationProfileAdaptationFilter implements AdaptationFilter
	{
		private String tenantPolicy;
		private Set<String> dataSpaceNames;
		private Set<String> builtInHistorizationProfiles;

		public HistorizationProfileAdaptationFilter()
		{
			tenantPolicy = config.getTenantPolicy();
			// Collect the names of the data spaces to process in a set for faster processing
			dataSpaceNames = new HashSet<>();
			List<AdaptationHome> dataSpaces = config.getDataSpacesForPermissions();
			for (AdaptationHome dataSpace : dataSpaces)
			{
				dataSpaceNames.add(dataSpace.getKey().getName());
			}
			builtInHistorizationProfiles = new HashSet<>(
				Arrays.asList(AdminUtil.getBuiltInHistorizationProfiles()));
		}

		@Override
		public boolean accept(Adaptation record)
		{
			String profileName = record.getOccurrencePrimaryKey().format();
			// Don't process the built-in ones because they can never be changed or deleted
			if (builtInHistorizationProfiles.contains(profileName))
			{
				return false;
			}
			// single tenant processes all historization profiles
			if (DevArtifactsConstants.TENANT_POLICY_SINGLE.equals(tenantPolicy))
			{
				return true;
			}
			// HvmBranchConfiguration is not a public API class, but don't have much choice
			List<HvmBranchConfiguration> dataSpacesToHistorize = record
				.getList(AdminUtil.getHistorizationProfileBranchesConfigurationsPath());
			Iterator<HvmBranchConfiguration> iter = dataSpacesToHistorize.iterator();
			boolean found = false;
			while (!found && iter.hasNext())
			{
				HvmBranchConfiguration dataSpaceToHistorize = iter.next();
				String dataSpaceNameToHistorize = dataSpaceToHistorize.getBranch().substring(1);
				// multi-admin always processes the Reference data space
				if (DevArtifactsConstants.TENANT_POLICY_MULTI_ADMIN.equals(tenantPolicy)
					&& CommonConstants.REFERENCE_DATA_SPACE_NAME.equals(dataSpaceNameToHistorize))
				{
					found = true;
				}
				// Otherwise process it if it's in the set
				else
				{
					found = dataSpaceNames.contains(dataSpaceNameToHistorize);
				}
			}
			return found;
		}
	}

	private class TaskAdaptationFilter implements AdaptationFilter
	{
		@Override
		public boolean accept(Adaptation adaptation)
		{
			String moduleName = adaptation.getString(AdminUtil.getTasksModulePath());
			return DevArtifactsUtil
				.matchesTenantModule(config.getTenantPolicy(), config.getModules(), moduleName);
		}
	}
}