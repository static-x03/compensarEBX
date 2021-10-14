/*
 * Copyright Orchestra Networks 2000-2012. All rights reserved.
 */
package com.orchestranetworks.ps.directory.dimensions;

import java.util.*;

import org.apache.commons.lang3.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.ps.customDirectory.*;
import com.orchestranetworks.ps.directory.alternatedirectories.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;

public abstract class CompoundDimensionsDirectory extends CustomDirectory
	implements AlternateDirectoryCapable
{
	private static final LoggingCategory LOG = LoggingCategory.getKernel();

	private static final String DEFAULT_PREFIX = "$";
	private static final String DEFAULT_SEPARATOR = "~";
	private static final String DEFAULT_IGNORE_COMPONENT_TOKEN = "%any%";
	private static final String DEFAULT_IGNORE_ROLE_LABEL = "(any role)";
	private static final String DEFAULT_IGNORE_DIMENSION_LABEL = "(any value)";

	protected CompoundDimensionsDirectoryCache cache;

	private boolean debugEnabled = LOG.isDebug();

	public CompoundDimensionsDirectory(AdaptationHome dataSpace)
	{
		this(dataSpace, true);
	}

	public CompoundDimensionsDirectory(AdaptationHome dataSpace, boolean passthroughParent)
	{
		super(dataSpace, passthroughParent);
	}

	protected abstract AdaptationTable getCompoundRoleTable();

	protected abstract AdaptationTable getCompoundRoleUserTable();

	protected abstract Path[] getDimensionPaths(AdaptationTable table);

	protected abstract Path getRolePath(AdaptationTable table);

	protected abstract Path getUserPath();

	protected abstract Path getIsPrimaryPath();

	protected Set<Role> getCompoundRolesIncludedBy(Role compoundRole)
	{
		return new HashSet<>();
	}

	protected Set<Role> getIncludedCompoundRoles(Role compoundRole)
	{
		return new HashSet<>();
	}

	@Override
	public List<Role> getAllAlternateDirectoryRoles()
	{
		return new ArrayList<>(getAllCompoundRoles());
	}

	@Override
	public List<Role> getAlternateDirectoryRolesForUser(UserReference user)
	{
		return new ArrayList<>(getCompoundRolesForUser(user));
	}

	protected Set<String> getRoleNamesToAlwaysCompound()
	{
		return null;
	}

	protected PartialCompoundRoleConfiguration[] getPartialCompoundRoleConfigurations()
	{
		return new PartialCompoundRoleConfiguration[0];
	}

	protected Set<List<String>> getValuesForPartialCompoundRoleConfiguration(
		Set<Path> dimensionsToIgnore)
	{
		return new HashSet<>();
	}

	protected boolean areDimensionsFullPrimaryKey()
	{
		return true;
	}

	protected String getPrefix()
	{
		return DEFAULT_PREFIX;
	}

	protected String getSeparator()
	{
		return DEFAULT_SEPARATOR;
	}

	protected String getIgnoreComponentToken()
	{
		return DEFAULT_IGNORE_COMPONENT_TOKEN;
	}

	protected String getIgnoreRoleLabel()
	{
		return DEFAULT_IGNORE_ROLE_LABEL;
	}

	protected String getIgnoreDimensionLabel(int dimensionIndex)
	{
		return DEFAULT_IGNORE_DIMENSION_LABEL;
	}

	protected boolean allowPartialCompoundRoles()
	{
		return getPartialCompoundRoleConfigurations().length != 0;
	}

	/**
	 * This simply calls <code>isUserInRole</code> in the parent directory class, but is needed for
	 * times when external callers need to check if a role is in the default EBX directory tables,
	 * not this extended directory.
	 * 
	 * @param user the user
	 * @param role the role
	 * @return whether it's in the parent directory
	 */
	public boolean isUserInRoleInParentDirectory(final UserReference user, final Role role)
	{
		return super.isUserInRole(user, role);
	}

	protected boolean isRoleNeverInCompoundRoleTable(Role role)
	{
		return false;
	}

	protected boolean isUserNeverInCompoundRoleTable(UserReference user)
	{
		return false;
	}

	@Override
	public boolean isUserInRole(UserReference user, Role role)
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: isUserInRole(" + user + "," + role + ")");
		}
		boolean returnVal;
		if (isRoleNeverInCompoundRoleTable(role) || isUserNeverInCompoundRoleTable(user))
		{
			if (debugEnabled)
			{
				LOG.debug("CompoundDimensionsDirectory: Don't need to check for compound role.");
			}
			returnVal = super.isUserInRole(user, role);
		}
		else
		{
			if (isCompoundRole(role))
			{
				if (cache == null)
				{
					returnVal = isUserInCompoundRole(user, role);
				}
				else
				{
					if (debugEnabled)
					{
						LOG.debug("CompoundDimensionsDirectory: Using cache.");
					}
					// TODO: Maybe instead we should put this code in Admin's schema extensions
					// so when the data space is initialized is when the directory is initialized
					if (!cache.isCacheInitialized())
					{
						cache.refreshCache();
					}
					Set<Role> cachedRoles = cache.getUserRoleCache().get(user);
					returnVal = cachedRoles != null && cachedRoles.contains(role);
				}
			}
			else
			{
				returnVal = super.isUserInRole(user, role);
			}
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	//	@Override
	//	public boolean isRoleStrictlyIncluded(Role aRole, Role anotherRole)
	//	{
	//		if (isCompoundRole(aRole) && isCompoundRole(anotherRole))
	//		{
	//			String anActualRoleName = getRoleNameForCompoundRole(aRole);
	//			String anotherActualRoleName = getRoleNameForCompoundRole(anotherRole);
	//			if (super.isRoleStrictlyIncluded(
	//				Role.forSpecificRole(anActualRoleName),
	//				Role.forSpecificRole(anotherActualRoleName)))
	//			{
	//				String aRoleName = aRole.getRoleName();
	//				String anotherRoleName = anotherRole.getRoleName();
	//				String sep = getSeparator();
	//				int anIndex = aRoleName.indexOf(sep);
	//				int anotherIndex = anotherRoleName.indexOf(sep);
	//				if (anIndex != -1 && anotherIndex != -1)
	//				{
	//					String aRoleRemainder = aRoleName.substring(anIndex);
	//					String anotherRoleRemainder = anotherRoleName.substring(anotherIndex);
	//					if (aRoleRemainder.equals(anotherRoleRemainder))
	//					{
	//						return true;
	//					}
	//				}
	//			}
	//			return false;
	//		}
	//		return super.isRoleStrictlyIncluded(aRole, anotherRole);
	//	}

	public boolean isCompoundRole(Role role)
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: isCompoundRole(" + role + ")");
		}
		boolean returnVal = role.getRoleName().startsWith(getPrefix());
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	protected boolean isUserInCompoundRole(UserReference user, Role compoundRole)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: isUserInCompoundRole(" + user + "," + compoundRole
					+ ")");
		}
		boolean returnVal = false;
		if (allowPartialCompoundRoles() && isPartialCompoundRole(compoundRole))
		{
			returnVal = isUserInPartialCompoundRole(user, compoundRole);
		}
		else
		{
			Adaptation record = lookupFullCompoundRoleRecordForUser(compoundRole, user);
			if (record == null)
			{
				Set<Role> includedByCompoundRoles = getCompoundRolesIncludedBy(compoundRole);
				Iterator<Role> iter = includedByCompoundRoles.iterator();
				while (!returnVal && iter.hasNext())
				{
					Role includedByCompoundRole = iter.next();
					returnVal = isUserInCompoundRole(user, includedByCompoundRole);
				}
			}
			else
			{
				AdaptationTable roleTable = getCompoundRoleTable();
				if (getRolePath(roleTable) == null)
				{
					Set<String> roleNamesToAlwaysCompound = getRoleNamesToAlwaysCompound();
					if (roleNamesToAlwaysCompound != null && !roleNamesToAlwaysCompound.isEmpty())
					{
						String compoundRoleRoleName = getRoleNameForCompoundRole(compoundRole);
						if (isUserInRoleInParentDirectory(
							user,
							Role.forSpecificRole(compoundRoleRoleName)))
						{
							returnVal = true;
						}
					}
				}
				else
				{
					returnVal = true;
				}
			}
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	public boolean isPartialCompoundRole(Role compoundRole)
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: isPartialCompoundRole(" + compoundRole + ")");
		}
		boolean returnVal = allowPartialCompoundRoles()
			&& compoundRole.getRoleName().indexOf(getIgnoreComponentToken()) != -1;
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	protected boolean isUserInPartialCompoundRole(UserReference user, Role partialCompoundRole)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: isUserInPartialCompoundRole(" + user + ", "
					+ partialCompoundRole + ")");
		}
		RequestResult requestResult = findPartialCompoundRoleRecordsForUser(
			partialCompoundRole,
			user);
		boolean returnVal = !requestResult.isEmpty();
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	protected RequestResult findPartialCompoundRoleRecordsForUser(
		Role partialCompoundRole,
		UserReference user)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: findPartialCompoundRoleRecordsForUser("
					+ partialCompoundRole + ", " + user + ")");
		}
		AdaptationTable table = getCompoundRoleUserTable();
		if (table == null)
		{
			return null;
		}
		Path userPath = getUserPath();
		String[] dimensionValues = getDimensionValuesForCompoundRole(partialCompoundRole);
		Path[] dimensionPaths = getDimensionPaths(table);

		StringBuilder bldr = new StringBuilder();
		bldr.append(userPath.format());
		bldr.append("=");
		bldr.append(encodeUserIdForPredicate(user.getUserId()));

		String ignoreValue = getIgnoreComponentToken();
		for (int i = 0; i < dimensionValues.length; i++)
		{
			String dimensionValue = dimensionValues[i];
			if (!ignoreValue.equals(dimensionValue))
			{
				Path dimensionPath = dimensionPaths[i];
				bldr.append(" and ");
				bldr.append(dimensionPath.format());
				bldr.append("=");
				bldr.append(encodeDimensionValueForPredicate(dimensionPath, dimensionValue));
			}
		}
		RequestResult returnVal = table.createRequestResult(bldr.toString());
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	protected Adaptation lookupFullCompoundRoleRecordForUser(
		Role fullCompoundRole,
		UserReference user)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: lookupFullCompoundRoleRecordForUser("
					+ fullCompoundRole + ", " + user + ")");
		}
		AdaptationTable roleTable = getCompoundRoleTable();
		AdaptationTable userTable = getCompoundRoleUserTable();
		Adaptation returnVal = null;
		if (userTable != null)
		{
			if (areDimensionsFullPrimaryKey())
			{
				if (roleTable == null)
				{
					returnVal = lookupFullCompoundRoleRecordForUserFromUserTable(
						fullCompoundRole,
						user);
				}
				else
				{
					returnVal = lookupFullCompoundRoleRecordForUserFromRoleTable(
						fullCompoundRole,
						user);
				}
			}
			else
			{
				String predicate = createRecordLookupPredicateForFullCompoundRole(
					fullCompoundRole,
					userTable,
					false,
					user);
				RequestResult requestResult = userTable.createRequestResult(predicate);
				try
				{
					returnVal = requestResult.nextAdaptation();
				}
				finally
				{
					requestResult.close();
				}
			}
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	protected Adaptation lookupFullCompoundRoleRecordForUserFromUserTable(
		Role fullCompoundRole,
		UserReference user)
	{
		AdaptationTable userTable = getCompoundRoleUserTable();
		PrimaryKey userTablePK = createFullCompoundRoleLookupPrimaryKey(
			fullCompoundRole,
			userTable,
			getRolePath(userTable),
			getDimensionPaths(userTable),
			user);
		return userTable.lookupAdaptationByPrimaryKey(userTablePK);
	}

	protected Adaptation lookupFullCompoundRoleRecordForUserFromRoleTable(
		Role fullCompoundRole,
		UserReference user)
	{
		AdaptationTable roleTable = getCompoundRoleTable();
		AdaptationTable userTable = getCompoundRoleUserTable();
		PrimaryKey roleTablePK = createFullCompoundRoleLookupPrimaryKey(
			fullCompoundRole,
			roleTable,
			getRolePath(roleTable),
			getDimensionPaths(roleTable),
			user);
		Path userPath = getUserPath();
		Path roleTableRolePath = getRolePath(roleTable);
		Path userTableRolePath = roleTableRolePath == null ? getRolePath(userTable) : null;
		Path[] pkPaths = userTable.getPrimaryKeySpec();
		Object[] pkValues = new Object[pkPaths.length];
		for (int i = 0; i < pkPaths.length; i++)
		{
			Path pkPath = Path.SELF.add(pkPaths[i]);
			if (userPath.equals(pkPath))
			{
				pkValues[i] = user.getUserId();
			}
			else if (userTableRolePath != null && userTableRolePath.equals(pkPath))
			{
				pkValues[i] = getRoleNameForCompoundRole(fullCompoundRole);
			}
			else
			{
				pkValues[i] = roleTablePK.format();
			}
		}
		PrimaryKey userTablePK = userTable.computePrimaryKey(pkValues);
		return userTable.lookupAdaptationByPrimaryKey(userTablePK);
	}

	private PrimaryKey createFullCompoundRoleLookupPrimaryKey(
		Role fullCompoundRole,
		AdaptationTable table,
		Path rolePath,
		Path[] dimensionPaths,
		UserReference user)
	{
		String[] dimensionValues = getDimensionValuesForCompoundRole(fullCompoundRole);
		Path[] pkPaths = table.getPrimaryKeySpec();
		Object[] pkValues = new Object[pkPaths.length];
		Path userPath = getUserPath();
		for (int i = 0; i < pkPaths.length; i++)
		{
			Path pkPath = Path.SELF.add(pkPaths[i]);
			if (rolePath != null && rolePath.equals(pkPath))
			{
				pkValues[i] = getRoleNameForCompoundRole(fullCompoundRole);
			}
			else if (userPath.equals(pkPath))
			{
				pkValues[i] = user.getUserId();
			}
			else
			{
				for (int j = 0; j < dimensionPaths.length; j++)
				{
					Path dimensionPath = dimensionPaths[j];
					if (dimensionPath.equals(pkPath))
					{
						pkValues[i] = getRecordValueForDimensionValue(
							table,
							dimensionPath,
							dimensionValues[j]);
						break;
					}
				}
			}
		}
		return table.computePrimaryKey(pkValues);
	}

	protected Object getRecordValueForDimensionValue(
		AdaptationTable table,
		Path dimensionPath,
		String dimensionValue)
	{
		return dimensionValue;
	}

	/**
	 * @deprecated Use {@link #createRecordLookupPredicateForFullCompoundRole(Role, AdaptationTable, boolean, UserReference) instead,
	 *             passing in <code>null</code> for the user
	 */
	@Deprecated
	protected String createRecordLookupPredicateForFullCompoundRole(
		Role fullCompoundRole,
		AdaptationTable table,
		boolean primaryOnly)
	{
		return createRecordLookupPredicateForFullCompoundRole(
			fullCompoundRole,
			table,
			primaryOnly,
			null);
	}

	protected String createRecordLookupPredicateForFullCompoundRole(
		Role fullCompoundRole,
		AdaptationTable table,
		boolean primaryOnly,
		UserReference user)
	{
		List<String> segments = new ArrayList<>();
		StringBuilder bldr = new StringBuilder();
		Path rolePath = getRolePath(table);
		if (rolePath != null)
		{
			bldr.append(rolePath.format());
			bldr.append("=");
			bldr.append(encodeRoleNameForPredicate(getRoleNameForCompoundRole(fullCompoundRole)));
			segments.add(bldr.toString());
			bldr = new StringBuilder();
		}

		String[] dimensionValues = getDimensionValuesForCompoundRole(fullCompoundRole);
		Path[] dimensionPaths = getDimensionPaths(table);
		for (int i = 0; i < dimensionValues.length; i++)
		{
			Path dimensionPath = dimensionPaths[i];
			bldr.append(dimensionPath.format());
			bldr.append("=");
			bldr.append(encodeDimensionValueForPredicate(dimensionPath, dimensionValues[i]));
			if (i < dimensionValues.length - 1)
			{
				bldr.append(" and ");
			}
		}
		segments.add(bldr.toString());
		bldr = new StringBuilder();

		if (primaryOnly)
		{
			bldr.append(getIsPrimaryPath().format());
			bldr.append("=true");
			segments.add(bldr.toString());
			bldr = new StringBuilder();
		}

		if (user != null)
		{
			bldr.append(getUserPath().format());
			bldr.append("= ");
			bldr.append(encodeUserIdForPredicate(user.getUserId()));
			segments.add(bldr.toString());
		}
		return StringUtils.join(segments, " and ");
	}

	protected String createRecordLookupPredicateForPartialCompoundRole(
		Role partialCompoundRole,
		AdaptationTable table,
		boolean primaryOnly)
	{
		StringBuilder bldr = new StringBuilder();
		String[] dimensionValues = getDimensionValuesForCompoundRole(partialCompoundRole);
		Path[] dimensionPaths = getDimensionPaths(table);
		String ignoreValue = getIgnoreComponentToken();
		boolean dimensionFound = false;
		for (int i = 0; i < dimensionValues.length; i++)
		{
			String dimensionValue = dimensionValues[i];
			if (!ignoreValue.equals(dimensionValue))
			{
				Path dimensionPath = dimensionPaths[i];
				if (dimensionFound)
				{
					bldr.append(" and ");
				}
				else
				{
					dimensionFound = true;
				}
				bldr.append(dimensionPath.format());
				bldr.append("=");
				bldr.append(encodeDimensionValueForPredicate(dimensionPath, dimensionValues[i]));
			}
		}
		if (primaryOnly)
		{
			bldr.append(" and ");
			bldr.append(getIsPrimaryPath().format());
			bldr.append("=true");
		}
		return bldr.toString();
	}

	private String createRecordLookupPredicateForCompoundRole(
		Role compoundRole,
		AdaptationTable table,
		boolean primaryOnly)
	{
		return (allowPartialCompoundRoles() && isPartialCompoundRole(compoundRole))
			? createRecordLookupPredicateForPartialCompoundRole(compoundRole, table, primaryOnly)
			: createRecordLookupPredicateForFullCompoundRole(
				compoundRole,
				table,
				primaryOnly,
				null);
	}

	public String getRoleNameForCompoundRole(Role compoundRole)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getRoleNameForCompoundRole(" + compoundRole + ")");
		}
		String compoundRoleName = compoundRole.getRoleName();
		String prefix = getPrefix();
		String sep = getSeparator();
		int sepIndex = compoundRoleName.indexOf(sep);
		String returnVal = sepIndex == -1 ? compoundRoleName.substring(prefix.length())
			: compoundRoleName.substring(prefix.length(), sepIndex);
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	public String[] getDimensionValuesForCompoundRole(Role compoundRole)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getDimensionValuesForCompoundRole(" + compoundRole
					+ ")");
		}
		String compoundRoleName = compoundRole.getRoleName();
		String sep = getSeparator();
		String[] returnVal = compoundRoleName
			.substring(compoundRoleName.indexOf(sep) + sep.length())
			.split(sep);
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + Arrays.toString(returnVal));
		}
		return returnVal;
	}

	public String[] getRoleNameAndDimensionValuesForCompoundRole(Role compoundRole)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getRoleNameAndDimensionValuesForCompoundRole("
					+ compoundRole + ")");
		}
		String[] dimensionValues = getDimensionValuesForCompoundRole(compoundRole);
		String[] arr = new String[dimensionValues.length + 1];
		arr[0] = getRoleNameForCompoundRole(compoundRole);
		for (int i = 0; i < dimensionValues.length; i++)
		{
			arr[i + 1] = dimensionValues[i];
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: arr = " + Arrays.toString(arr));
		}
		return arr;
	}

	@Override
	public String getRoleDescription(Role role, Locale locale)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getRoleDescription(" + role + "," + locale + ")");
		}
		if (isCompoundRole(role))
		{
			return getCompoundRoleDescription(role, locale);
		}
		return super.getRoleDescription(role, locale);
	}

	protected String getCompoundRoleDescription(Role compoundRole, Locale locale)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getCompoundRoleDescription(" + compoundRole + ","
					+ locale + ")");
		}
		return null;
	}

	@Override
	public String displaySpecificRole(Role role, Locale locale)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: displaySpecificRole(" + role + "," + locale + ")");
		}
		if (isCompoundRole(role))
		{
			return getCompoundRoleLabel(role, locale);
		}
		return super.displaySpecificRole(role, locale);
	}

	protected String getCompoundRoleLabel(Role compoundRole, Locale locale)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getCompoundRoleLabel(" + compoundRole + "," + locale
					+ ")");
		}
		StringBuilder bldr = new StringBuilder("[Compound of ");

		String compoundRoleName = compoundRole.getRoleName();
		String sep = getSeparator();
		String prefix = getPrefix();
		int sepIndex = compoundRoleName.indexOf(sep);
		String roleName = sepIndex == -1 ? compoundRoleName.substring(prefix.length())
			: compoundRoleName.substring(prefix.length(), sepIndex);

		boolean allowPartialCompoundRoles = allowPartialCompoundRoles();
		String ignoreValue = getIgnoreComponentToken();
		if (allowPartialCompoundRoles && ignoreValue.equals(roleName))
		{
			bldr.append(getIgnoreRoleLabel());
		}
		else
		{
			//  Need to get Role Label and remove the starting and ending brackets [...] that EBX uses to format the Role Label
			bldr.append(
				StringUtils.removeEnd(
					StringUtils.removeStart(
						displaySpecificRole(Role.forSpecificRole(roleName), locale),
						"["),
					"]"));
		}

		if (sepIndex != -1)
		{
			String[] dimensionValues = compoundRoleName
				.substring(compoundRoleName.indexOf(sep) + sep.length())
				.split(sep);
			for (int i = 0; i < dimensionValues.length; i++)
			{
				String dimensionValue = dimensionValues[i];
				bldr.append(" & ");
				if (allowPartialCompoundRoles && ignoreValue.equals(dimensionValue))
				{
					bldr.append(getIgnoreDimensionLabel(i));
				}
				else
				{
					bldr.append(getDimensionValueLabel(compoundRole, i, dimensionValue));
				}
			}
		}
		bldr.append("]");
		String returnVal = bldr.toString();
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	protected String getDimensionValueLabel(
		Role compoundRole,
		int dimensionIndex,
		String dimensionValue)
	{
		return dimensionValue;
	}

	@Override
	public List<Role> getAllSpecificRoles()
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: getAllSpecificRoles()");
		}
		List<Role> roles = super.getAllSpecificRoles();
		ArrayList<Role> allRoles = new ArrayList<>();
		allRoles.addAll(roles);
		if (cache == null)
		{
			Set<Role> compoundRoles = getAllCompoundRoles();
			allRoles.addAll(compoundRoles);
		}
		else
		{
			if (debugEnabled)
			{

				LOG.debug("CompoundDimensionsDirectory: Using cache.");
			}
			if (!cache.isCacheInitialized())
			{
				cache.refreshCache();
			}
			allRoles.addAll(cache.getRoleUserCache().keySet());
		}
		Comparator<Role> comparator = getRoleComparator();
		if (comparator != null)
		{
			Collections.sort(allRoles, comparator);
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: allRoles = " + allRoles);
		}
		return allRoles;
	}

	protected Comparator<Role> getRoleComparator()
	{
		return new DefaultRoleComparator();
	}

	protected Set<Role> getAllCompoundRoles()
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: getAllCompoundRoles()");
		}
		Set<Role> compoundRoles = new HashSet<>();
		AdaptationTable table = getCompoundRoleTable();
		if (table == null)
		{
			table = getCompoundRoleUserTable();
			if (table == null)
			{
				return compoundRoles;
			}
		}
		RequestResult reqRes = table.createRequestResult(null);
		try
		{
			for (Adaptation record; (record = reqRes.nextAdaptation()) != null;)
			{
				compoundRoles.addAll(getFullCompoundRolesForRecord(record));
			}
		}
		finally
		{
			reqRes.close();
		}
		if (allowPartialCompoundRoles())
		{
			compoundRoles.addAll(getAllPartialCompoundRoles());
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: compoundRoles = " + compoundRoles);
		}
		return compoundRoles;
	}

	protected Set<Role> getAllPartialCompoundRoles()
	{
		Set<Role> partialCompoundRoles = new HashSet<>();
		PartialCompoundRoleConfiguration[] configs = getPartialCompoundRoleConfigurations();
		for (PartialCompoundRoleConfiguration config : configs)
		{
			partialCompoundRoles.addAll(getPartialCompoundRolesForConfiguration(config));
		}
		return partialCompoundRoles;
	}

	protected Set<Role> getPartialCompoundRolesForConfiguration(
		PartialCompoundRoleConfiguration config)
	{
		Set<Role> partialCompoundRoles = new HashSet<>();
		String prefix = getPrefix();
		String sep = getSeparator();
		String ignoreValue = getIgnoreComponentToken();
		Set<Path> dimensionsToIgnore;
		AdaptationTable table = getCompoundRoleTable();
		if (table == null)
		{
			dimensionsToIgnore = config.getCompoundRoleUserDimensionsToIgnore();
			table = getCompoundRoleUserTable();
		}
		else
		{
			dimensionsToIgnore = config.getCompoundRoleDimensionsToIgnore();
		}
		Path[] dimensionPaths = getDimensionPaths(table);

		Set<List<String>> valueLists = getValuesForPartialCompoundRoleConfiguration(
			dimensionsToIgnore);
		for (List<String> valueList : valueLists)
		{
			Iterator<String> iter = valueList.iterator();
			StringBuilder bldr = new StringBuilder();
			bldr.append(prefix);
			bldr.append(ignoreValue);
			for (Path dimensionPath : dimensionPaths)
			{
				bldr.append(sep);
				if (dimensionsToIgnore.contains(dimensionPath))
				{
					bldr.append(ignoreValue);
				}
				else
				{
					bldr.append(iter.next());
				}
			}
			partialCompoundRoles.add(Role.forSpecificRole(bldr.toString()));
		}
		return partialCompoundRoles;
	}

	/**
	 * @deprecated Use {@link #getFullCompoundRolesForRecord(Adaptation) instead
	 */
	@Deprecated
	protected Role getFullCompoundRoleForRecord(Adaptation record)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getFullCompoundRoleForRecord("
					+ record.toXPathExpression() + ")");
		}
		Set<Role> roles = getFullCompoundRolesForRecord(record);
		Iterator<Role> iter = roles.iterator();
		Role returnVal = iter.hasNext() ? iter.next() : null;
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	protected Set<Role> getFullCompoundRolesForRecord(Adaptation record)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getFullCompoundRolesForRecord("
					+ record.toXPathExpression() + ")");
		}
		AdaptationTable table = record.getContainerTable();
		Path rolePath = getRolePath(table);
		Set<String> roleNames;
		if (rolePath == null)
		{
			roleNames = getRoleNamesToAlwaysCompound();
			if (roleNames == null || roleNames.isEmpty())
			{
				return new HashSet<>();
			}
		}
		else
		{
			roleNames = new HashSet<>(1);
			roleNames.add(record.getString(rolePath));
		}
		Path[] dimensionPaths = getDimensionPaths(table);

		Set<Role> roleSet = new HashSet<>(roleNames.size());
		Iterator<String> iter = roleNames.iterator();
		while (iter.hasNext())
		{
			String roleName = iter.next();
			StringBuilder bldr = new StringBuilder();
			String prefix = getPrefix();
			String sep = getSeparator();
			bldr.append(prefix);
			bldr.append(roleName);
			for (Path dimensionPath : dimensionPaths)
			{
				bldr.append(sep);
				bldr.append(readDimensionValue(record, dimensionPath));
			}
			roleSet.add(Role.forSpecificRole(bldr.toString()));
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + roleSet);
		}
		return roleSet;
	}

	protected String readDimensionValue(Adaptation record, Path dimensionPath)
	{
		return record.get(dimensionPath).toString();
	}

	protected Set<Role> getPartialCompoundRolesForRecord(Adaptation record)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getPartialCompoundRolesForRecord("
					+ record.toXPathExpression() + ")");
		}
		AdaptationTable table = record.getContainerTable();

		Set<Role> partialCompoundRoles = new HashSet<>();
		String prefix = getPrefix();
		String sep = getSeparator();
		String ignoreValue = getIgnoreComponentToken();
		Path[] dimensionPaths = getDimensionPaths(table);
		AdaptationTable roleTable = getCompoundRoleTable();
		Path roleTablePath = roleTable == null ? null : roleTable.getTablePath();
		for (PartialCompoundRoleConfiguration config : getPartialCompoundRoleConfigurations())
		{
			Set<Path> dimensionsToIgnore = table.getTablePath().equals(roleTablePath)
				? config.getCompoundRoleDimensionsToIgnore()
				: config.getCompoundRoleUserDimensionsToIgnore();
			StringBuilder bldr = new StringBuilder();
			bldr.append(prefix);
			bldr.append(ignoreValue);

			for (int i = 0; i < dimensionPaths.length; i++)
			{
				Path dimensionPath = dimensionPaths[i];
				bldr.append(sep);
				if (dimensionsToIgnore.contains(dimensionPath))
				{
					bldr.append(ignoreValue);
				}
				else
				{
					bldr.append(readDimensionValue(record, dimensionPath));
				}
			}
			partialCompoundRoles.add(Role.forSpecificRole(bldr.toString()));
		}
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: partialCompoundRoles = " + partialCompoundRoles);
		}
		return partialCompoundRoles;
	}

	@Override
	public List<Role> getRolesForUser(UserReference user)
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: getRolesForUser(" + user + ")");
		}
		List<Role> roles = super.getRolesForUser(user);
		List<Role> allRoles = new ArrayList<>();
		allRoles.addAll(roles);
		if (cache == null)
		{
			allRoles.addAll(getCompoundRolesForUser(user));
		}
		else
		{
			if (debugEnabled)
			{
				LOG.debug("CompoundDimensionsDirectory: Using cache.");
			}
			if (!cache.isCacheInitialized())
			{
				cache.refreshCache();
			}
			Set<Role> cachedRoles = cache.getUserRoleCache().get(user);
			if (cachedRoles != null)
			{
				allRoles.addAll(cachedRoles);
			}
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: allRoles = " + allRoles);
		}
		return allRoles;
	}

	protected Set<Role> getCompoundRolesForUser(UserReference user)
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: getCompoundRolesForUser(" + user + ")");
		}
		// Use a set to eliminate duplicates
		Set<Role> compoundRoles = new HashSet<>();
		AdaptationTable table = getCompoundRoleUserTable();
		if (table == null)
		{
			return compoundRoles;
		}
		// Use a set to eliminate duplicates
		boolean allowPartialCompoundRoles = allowPartialCompoundRoles();

		StringBuilder bldr = new StringBuilder();
		bldr.append(getUserPath().format());
		bldr.append("=");
		bldr.append(encodeUserIdForPredicate(user.getUserId()));
		RequestResult reqRes = table.createRequestResult(bldr.toString());
		try
		{
			for (Adaptation record; (record = reqRes.nextAdaptation()) != null;)
			{
				Set<Role> recordRoles = getFullCompoundRolesForRecord(record);
				compoundRoles.addAll(recordRoles);
				if (allowPartialCompoundRoles)
				{
					compoundRoles.addAll(getPartialCompoundRolesForRecord(record));
				}
				for (Role recordRole : recordRoles)
				{
					addAllIncludedRoles(compoundRoles, recordRole);
				}
			}
		}
		finally
		{
			reqRes.close();
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: compoundRoles = " + compoundRoles);
		}
		return compoundRoles;
	}

	private void addAllIncludedRoles(Set<Role> compoundRoles, Role compoundRole)
	{
		Set<Role> includedRoles = getIncludedCompoundRoles(compoundRole);
		for (Role includedRole : includedRoles)
		{
			compoundRoles.add(includedRole);
			addAllIncludedRoles(compoundRoles, includedRole);
		}
	}

	@Override
	public List<UserReference> getUsersInRole(Role role)
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: getUsersInRole(" + role + ")");
		}
		if (isCompoundRole(role))
		{
			ArrayList<UserReference> userList;
			if (cache == null)
			{
				userList = new ArrayList<>(getUsersInCompoundRole(role, false));
			}
			else
			{
				if (debugEnabled)
				{
					LOG.debug("CompoundDimensionsDirectory: Using cache.");
				}
				if (!cache.isCacheInitialized())
				{
					cache.refreshCache();
				}
				Set<UserReference> cachedUsers = cache.getRoleUserCache().get(role);
				if (cachedUsers == null)
				{
					userList = new ArrayList<>();
				}
				else
				{
					userList = new ArrayList<>(cachedUsers);
				}
			}
			return userList;
		}
		return super.getUsersInRole(role);
	}

	public Set<UserReference> getUsersInCompoundRole(Role compoundRole, boolean primaryOnly)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getUsersInCompoundRole(" + compoundRole + ","
					+ primaryOnly + ")");
		}
		Set<UserReference> users = new HashSet<>();
		AdaptationTable table = getCompoundRoleUserTable();
		if (table == null)
		{
			return users;
		}
		String predicate = createRecordLookupPredicateForCompoundRole(
			compoundRole,
			table,
			primaryOnly);

		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: predicate = " + predicate);
		}
		RequestResult reqRes = table.createRequestResult(predicate);
		try
		{
			for (Adaptation record; (record = reqRes.nextAdaptation()) != null;)
			{
				UserReference user = getUserReferenceForLookupRecord(record);
				if (user != null)
				{
					users.add(user);
				}
			}
		}
		finally
		{
			reqRes.close();
		}

		Set<Role> includedByRoles = getCompoundRolesIncludedBy(compoundRole);
		for (Role includedByRole : includedByRoles)
		{
			users.addAll(getUsersInCompoundRole(includedByRole, primaryOnly));
		}
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: users = " + users);
		}
		return users;
	}

	public UserReference getPrimaryUserInFullCompoundRole(
		Role fullCompoundRole,
		boolean onlyFindSinglePrimaryUser)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getPrimaryUserInFullCompoundRole(" + fullCompoundRole
					+ ")");
		}
		AdaptationTable table = getCompoundRoleUserTable();
		if (table == null)
		{
			return null;
		}
		// Could simply call getUsersInCompoundRole but this is more efficient because
		// it's not looping through the entire result
		String predicate = createRecordLookupPredicateForFullCompoundRole(
			fullCompoundRole,
			table,
			true,
			null);
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: predicate = " + predicate);
		}
		RequestResult reqRes = table.createRequestResult(predicate);
		// Return null if specified that only one should be found and more than that is found
		if (onlyFindSinglePrimaryUser && reqRes.isSizeGreaterOrEqual(2))
		{
			return null;
		}
		Adaptation record;
		try
		{
			record = reqRes.nextAdaptation();
		}
		finally
		{
			reqRes.close();
		}
		if (record == null)
		{
			return null;
		}
		UserReference primaryUser = getUserReferenceForLookupRecord(record);
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: primaryUser = " + primaryUser);
		}
		return primaryUser;
	}

	protected UserReference getUserReferenceForLookupRecord(Adaptation record)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getUserReferenceForLookupRecord("
					+ record.toXPathExpression() + ")");
		}
		String userId = record.getString(getUserPath());
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: userId = " + userId);
		}
		if (userId != null)
		{
			return UserReference.forUser(userId);
		}
		return null;
	}

	@Override
	public boolean isSpecificRoleDefined(Role role)
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: isSpecificRoleDefined(" + role + ")");
		}
		if (isCompoundRole(role))
		{
			if (cache == null)
			{
				return isCompoundRoleDefined(role);
			}
			if (debugEnabled)
			{
				LOG.debug("CompoundDimensionsDirectory: Using cache.");
			}
			if (!cache.isCacheInitialized())
			{
				cache.refreshCache();
			}
			return cache.getRoleUserCache().containsKey(role);
		}
		return super.isSpecificRoleDefined(role);
	}

	protected boolean isCompoundRoleDefined(Role compoundRole)
	{
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: isCompoundRoleDefined(" + compoundRole + ")");
		}
		AdaptationTable table = getCompoundRoleTable();
		if (table == null)
		{
			table = getCompoundRoleUserTable();
			if (table == null)
			{
				return false;
			}
		}
		String predicate = createRecordLookupPredicateForCompoundRole(compoundRole, table, false);
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: predicate = " + predicate);
		}
		boolean returnVal = !table.createRequestResult(predicate).isEmpty();
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	/**
	 * @deprecated - Use {@link getRoleNameForCompoundRole} instead. This was basically duplicate code.
	 */
	@Deprecated
	protected String getRoleNameFromCompoundRole(Role compoundRole)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getRoleNameFromCompoundRole(" + compoundRole + ")");
		}
		String returnVal = getRoleNameForCompoundRole(compoundRole);
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	public Role getFullCompoundRole(String roleName, String[] dimensionValues)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getFullCompoundRole(" + roleName + ","
					+ Arrays.toString(dimensionValues) + ")");
		}
		StringBuilder bldr = new StringBuilder();
		String prefix = getPrefix();
		String sep = getSeparator();
		bldr.append(prefix);
		bldr.append(roleName);
		for (String dimensionValue : dimensionValues)
		{
			bldr.append(sep);
			bldr.append(dimensionValue);
		}
		Role returnVal = Role.forSpecificRole(bldr.toString());
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	public Role getPartialCompoundRole(Path[] paths, String[] values)
	{
		if (debugEnabled)
		{
			LOG.debug(
				"CompoundDimensionsDirectory: getPartialCompoundRole(" + Arrays.toString(paths)
					+ "," + Arrays.toString(values) + ")");
		}
		StringBuilder bldr = new StringBuilder();
		String prefix = getPrefix();
		String sep = getSeparator();
		String ignoreToken = getIgnoreComponentToken();
		bldr.append(prefix);
		bldr.append(ignoreToken);
		AdaptationTable table = getCompoundRoleTable();
		if (table == null)
		{
			table = getCompoundRoleUserTable();
		}
		int ind = 0;
		for (Path dimensionPath : getDimensionPaths(table))
		{
			bldr.append(sep);
			if (dimensionPath.equals(paths[ind]))
			{
				bldr.append(values[ind]);
				ind++;
			}
			else
			{
				bldr.append(ignoreToken);
			}
		}
		Role returnVal = Role.forSpecificRole(bldr.toString());
		if (debugEnabled)
		{
			LOG.debug("CompoundDimensionsDirectory: returnVal = " + returnVal);
		}
		return returnVal;
	}

	/**
	 * Note that if no Compound Role table is being used, this will use the Compound Role User table despite its name.
	 */
	public Set<Role> lookupCompoundRolesFromCompoundRoleTable(
		Map<Path, String[]> dimensionValueMap,
		String[] roleNames,
		boolean includePartialCompoundRoles)
	{
		return doLookupCompoundRoles(
			dimensionValueMap,
			roleNames,
			new String[0],
			includePartialCompoundRoles);
	}

	public Set<Role> lookupCompoundRolesFromCompoundRoleUserTable(
		Map<Path, String[]> dimensionValueMap,
		String[] roleNames,
		String[] userIds,
		boolean includePartialCompoundRoles)
	{
		return doLookupCompoundRoles(
			dimensionValueMap,
			roleNames,
			userIds,
			includePartialCompoundRoles);
	}

	// TODO: Not written to use cache but only used in some places that it shouldn't really matter
	private Set<Role> doLookupCompoundRoles(
		Map<Path, String[]> dimensionValueMap,
		String[] roleNames,
		String[] userIds,
		boolean includePartialCompoundRoles)
	{
		Set<Role> roles = new HashSet<>();

		boolean allowPartialCompoundRoles = allowPartialCompoundRoles();
		RequestResult reqRes = doLookupCompoundRoleRecords(dimensionValueMap, roleNames, userIds);
		try
		{
			for (Adaptation record; (record = reqRes.nextAdaptation()) != null;)
			{
				roles.addAll(getFullCompoundRolesForRecord(record));
				if (allowPartialCompoundRoles && includePartialCompoundRoles)
				{
					roles.addAll(getPartialCompoundRolesForRecord(record));
				}
			}
		}
		finally
		{
			reqRes.close();
		}
		return roles;
	}

	/**
	 * Note that if no Compound Role table is being used, this will use the Compound Role User table despite its name.
	 */
	public RequestResult lookupCompoundRoleRecordsFromCompoundRoleTable(
		Map<Path, String[]> dimensionValueMap,
		String[] roleNames)
	{
		return doLookupCompoundRoleRecords(dimensionValueMap, roleNames, new String[0]);
	}

	public RequestResult lookupCompoundRoleRecordsFromCompoundRoleUserTable(
		Map<Path, String[]> dimensionValueMap,
		String[] roleNames,
		String[] userIds)
	{
		return doLookupCompoundRoleRecords(dimensionValueMap, roleNames, userIds);
	}

	private RequestResult doLookupCompoundRoleRecords(
		Map<Path, String[]> dimensionValueMap,
		String[] roleNames,
		String[] userIds)
	{
		AdaptationTable table = getCompoundRoleTable();
		if (table == null || (userIds != null && userIds.length > 0))
		{
			table = getCompoundRoleUserTable();
		}
		String predicate = createRecordLookupPredicateForFieldValues(
			dimensionValueMap,
			roleNames,
			userIds,
			table);
		return table.createRequestResult(predicate);
	}

	private String createRecordLookupPredicateForFieldValues(
		Map<Path, String[]> dimensionValueMap,
		String[] roleNames,
		String[] userIds,
		AdaptationTable table)
	{
		Set<String> predicates = new HashSet<>();
		if (dimensionValueMap != null && !dimensionValueMap.isEmpty())
		{
			Iterator<Path> pathIter = dimensionValueMap.keySet().iterator();
			while (pathIter.hasNext())
			{
				Path path = pathIter.next();
				String[] values = dimensionValueMap.get(path);
				if (values != null && values.length > 0)
				{
					predicates.add(createPredicateSegment(path, values));
				}
			}
		}

		if (roleNames != null && roleNames.length > 0)
		{
			Path rolePath = getRolePath(table);
			if (rolePath != null)
			{
				predicates.add(createPredicateSegment(rolePath, roleNames));
			}
		}

		if (userIds != null && userIds.length > 0)
		{
			predicates.add(createPredicateSegment(getUserPath(), userIds));
		}
		return StringUtils.join(predicates, " and ");
	}

	private String createPredicateSegment(Path path, String[] values)
	{
		StringBuilder bldr = new StringBuilder();
		if (values != null && values.length > 0)
		{
			bldr.append("(");
			for (int i = 0; i < values.length; i++)
			{
				String value = values[i];
				if (value == null)
				{
					bldr.append("osd:is-null(");
					bldr.append(path.format());
					bldr.append(")");
				}
				else
				{
					bldr.append(path.format());
					bldr.append("=");
					bldr.append(encodeDimensionValueForPredicate(path, values[i]));
				}
				if (i < values.length - 1)
				{
					bldr.append(" or ");
				}
			}
			bldr.append(")");
		}
		return bldr.toString();
	}

	/**
	 * Convert the user ID into a string for use in the predicate.
	 * For better performance, we assume the user IDs don't contain apostrophes.
	 * If they do, this method can be overridden to do <code>XPathExpressionHelper.encodeLiteralStringWithDelimiters(userId)</code>
	 * 
	 * @param userId the user ID
	 * @return the encoded string
	 */
	protected String encodeUserIdForPredicate(String userId)
	{
		return "'" + userId + "'";
	}

	/**
	 * Convert the role name into a string for use in the predicate.
	 * For better performance, we assume the role names don't contain apostrophes.
	 * If they do, this method can be overridden to do <code>XPathExpressionHelper.encodeLiteralStringWithDelimiters(roleName)</code>
	 * 
	 * @param roleName the role name
	 * @return the encoded string
	 */
	protected String encodeRoleNameForPredicate(String roleName)
	{
		return "'" + roleName + "'";
	}

	/**
	 * Convert the dimension value into a string for use in the predicate.
	 * For better performance, we assume the dimension values don't contain apostrophes.
	 * If they do, this method can be overridden to do <code>XPathExpressionHelper.encodeLiteralStringWithDelimiters(dimensionValue)</code>
	 * and can selectively do it based on which <code>dimensionPath</code> is specified
	 * 
	 * @param dimensionPath the dimension path
	 * @param dimensionValue the dimension value
	 * @return the encoded string
	 */
	protected String encodeDimensionValueForPredicate(Path dimensionPath, String dimensionValue)
	{
		return "'" + dimensionValue + "'";
	}

	public CompoundDimensionsDirectoryCache getCache()
	{
		return this.cache;
	}

	public void setCache(CompoundDimensionsDirectoryCache cache)
	{
		this.cache = cache;
	}

	public static class PartialCompoundRoleConfiguration
	{
		private Set<Path> compoundRoleDimensionsToIgnore;
		private Set<Path> compoundRoleUserDimensionsToIgnore;

		public PartialCompoundRoleConfiguration()
		{
			this(new HashSet<Path>(), new HashSet<Path>());
		}

		public PartialCompoundRoleConfiguration(
			Set<Path> compoundRoleDimensionsToIgnore,
			Set<Path> compoundRoleUserDimensionsToIgnore)
		{
			this.compoundRoleDimensionsToIgnore = compoundRoleDimensionsToIgnore;
			this.compoundRoleUserDimensionsToIgnore = compoundRoleUserDimensionsToIgnore;
		}

		public Set<Path> getCompoundRoleDimensionsToIgnore()
		{
			return this.compoundRoleDimensionsToIgnore;
		}

		public void setCompoundRoleDimensionsToIgnore(Set<Path> compoundRoleDimensionsToIgnore)
		{
			this.compoundRoleDimensionsToIgnore = compoundRoleDimensionsToIgnore;
		}

		public Set<Path> getCompoundRoleUserDimensionsToIgnore()
		{
			return this.compoundRoleUserDimensionsToIgnore;
		}

		public void setCompoundRoleUserDimensionsToIgnore(
			Set<Path> compoundRoleUserDimensionsToIgnore)
		{
			this.compoundRoleUserDimensionsToIgnore = compoundRoleUserDimensionsToIgnore;
		}
	}

	public class DefaultRoleComparator implements Comparator<Role>
	{
		@Override
		public int compare(Role role1, Role role2)
		{
			if (role1 == null)
			{
				return role2 == null ? 0 : -1;
			}
			if (role2 == null)
			{
				return 1;
			}
			if (isCompoundRole(role1))
			{
				// Compound roles always are listed after normal roles
				if (!isCompoundRole(role2))
				{
					return 1;
				}
				// They're both compound roles so just compare their displays
				return compareRoleDisplays(role1, role2, Locale.getDefault());
			}
			// Compound roles are always listed after normal roles
			if (isCompoundRole(role2))
			{
				return -1;
			}
			// They're both normal roles so just compare the displays
			return compareRoleDisplays(role1, role2, Locale.getDefault());
		}

		protected int compareRoleDisplays(Role role1, Role role2, Locale locale)
		{
			return displaySpecificRole(role1, locale).compareTo(displaySpecificRole(role2, locale));
		}
	}
}
