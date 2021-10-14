/*
 * Copyright Orchestra Networks 2000-2012. All rights reserved.
 */
package com.orchestranetworks.ps.directory.dimensions;

import java.util.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.instance.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;

/**
 */
public class CompoundDimensionsDirectoryCache
{
	private static final LoggingCategory LOG = LoggingCategory.getKernel();

	// TODO: Could make this more flexible by using SoftReferences so that memory can be reclaimed
	// and such.
	// For now, just trying to get a basic cache working.
	protected Map<UserReference, Set<Role>> userRoleCache = new HashMap<>();
	protected Map<Role, Set<UserReference>> roleUserCache = new HashMap<>();

	protected CompoundDimensionsDirectory directory;

	public CompoundDimensionsDirectoryCache(CompoundDimensionsDirectory directory)
	{
		this.directory = directory;
	}

	public boolean isCacheInitialized()
	{
		return !userRoleCache.isEmpty();
	}

	public void refreshCache()
	{
		if (LOG.isDebug())
		{
			LOG.debug("CompoundDimensionsDirectoryCache: refreshCache()");
		}
		this.userRoleCache = new HashMap<>();
		this.roleUserCache = new HashMap<>();

		AdaptationTable table = directory.getCompoundRoleUserTable();
		if (table == null)
		{
			return;
		}
		RequestResult requestResult = table.createRequestResult(null);
		try
		{
			for (Adaptation record; (record = requestResult.nextAdaptation()) != null;)
			{
				addToCache(record);
			}
		}
		finally
		{
			requestResult.close();
		}
		if (LOG.isDebug())
		{
			LOG.debug("CompoundDimensionsDirectoryCache: done refreshCache()");
		}
	}

	public void addToCache(Adaptation record)
	{
		if (LOG.isDebug())
		{
			LOG.debug(
				"CompoundDimensionsDirectoryCache: addToCache("
					+ record.getAdaptationName().getStringName() + ")");
		}
		String userId = record.getString(directory.getUserPath());
		UserReference user = UserReference.forUser(userId);
		Set<Role> compoundRoles = directory.getFullCompoundRolesForRecord(record);

		Set<Role> userRoles = new HashSet<>();
		userRoles.addAll(compoundRoles);
		if (directory.allowPartialCompoundRoles())
		{
			userRoles.addAll(directory.getPartialCompoundRolesForRecord(record));
		}

		if (userRoleCache.containsKey(user))
		{
			userRoleCache.get(user).addAll(userRoles);
		}
		else
		{
			userRoleCache.put(user, userRoles);
		}

		for (Role role : userRoles)
		{
			if (roleUserCache.containsKey(role))
			{
				roleUserCache.get(role).add(user);
			}
			else
			{
				Set<UserReference> userSet = new HashSet<>();
				userSet.add(user);
				roleUserCache.put(role, userSet);
			}
		}
		if (LOG.isDebug())
		{
			LOG.debug("CompoundDimensionsDirectoryCache: done addToCache()");
		}
	}

	public void removeFromCache(ValueContext recordValueContext)
	{
		if (LOG.isDebug())
		{
			LOG.debug(
				"CompoundDimensionsDirectoryCache: removeFromCache(" + recordValueContext + ")");
		}
		AdaptationTable userTable = directory.getCompoundRoleUserTable();
		if (userTable == null)
		{
			return;
		}
		Path userPath = directory.getUserPath();
		// Need to refresh all entries for user because we can't konw if we should
		// delete the partial roles or if they could still be valid from other records
		String userId = (String) recordValueContext.getValue(userPath);
		UserReference user = UserReference.forUser(userId);
		Set<Role> cachedRoles = userRoleCache.get(user);
		if (cachedRoles != null)
		{
			for (Role cachedRole : cachedRoles)
			{
				Set<UserReference> cachedUsers = roleUserCache.get(cachedRole);
				if (cachedUsers != null)
				{
					cachedUsers.remove(user);
					if (cachedUsers.isEmpty())
					{
						roleUserCache.remove(cachedRole);
					}
				}
			}
			userRoleCache.remove(user);
		}

		RequestResult requestResult = userTable
			.createRequestResult(userPath.format() + "='" + userId + "'");
		try
		{
			for (Adaptation record; (record = requestResult.nextAdaptation()) != null;)
			{
				addToCache(record);
			}
		}
		finally
		{
			requestResult.close();
		}
		if (LOG.isDebug())
		{
			LOG.debug("CompoundDimensionsDirectoryCache: done removeFromCache()");
		}
	}

	public Map<UserReference, Set<Role>> getUserRoleCache()
	{
		return this.userRoleCache;
	}

	public Map<Role, Set<UserReference>> getRoleUserCache()
	{
		return this.roleUserCache;
	}
}
