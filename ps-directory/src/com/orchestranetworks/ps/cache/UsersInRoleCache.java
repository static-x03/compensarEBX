package com.orchestranetworks.ps.cache;

import java.util.*;

import com.orchestranetworks.service.*;

/**
 * Cache object for caching the result of Directory.getUsersInRole.  This object may be updated
 * by caching the result of isUserInRole using the updateUser method. 
 */
public class UsersInRoleCache extends CachedObject
{
	private final Set<UserReference> users = new LinkedHashSet<>();

	public UsersInRoleCache(long expiration, List<UserReference> users)
	{
		super(expiration, false);
		this.users.addAll(users);
	}

	public List<UserReference> getUsers()
	{
		return new ArrayList<>(users);
	}

	public void updateUser(UserReference user, boolean isMember)
	{
		if (isMember)
		{
			users.add(user);
		}
		else
		{
			users.remove(user);
		}
	}

}