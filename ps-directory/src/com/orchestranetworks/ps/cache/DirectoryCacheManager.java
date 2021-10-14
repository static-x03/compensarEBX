package com.orchestranetworks.ps.cache;

import java.io.*;
import java.util.*;
import java.util.concurrent.*;

import com.onwbp.org.apache.log4j.*;
import com.orchestranetworks.ps.constants.*;
import com.orchestranetworks.ps.logging.*;
import com.orchestranetworks.service.*;

public class DirectoryCacheManager
{
	private static final Category logger = CustomLogger.newInstance();
	private static DirectoryCacheManager instance;

	private static final int DEFAULT_CACHE_REFRESH_TIME = 0;
	private static final int DEFAULT_CACHE_SIZE = 20;
	private static final String EXPIRATION_OF_CACHE = "ebx.directory.membershipCacheMs";

	private long expiration = 0;

	private boolean usingCache;

	/** Cached roles */
	private Map<String, CachedRole> roleCache = new ConcurrentHashMap<>(DEFAULT_CACHE_SIZE);

	/** Cached users */
	private Map<String, CachedUser> userCache = new ConcurrentHashMap<>(DEFAULT_CACHE_SIZE);

	/** Cached results of results of Directory.isUserInRole by role */
	private Map<Role, Map<UserReference, RoleUserCache>> userInRoleCache = new ConcurrentHashMap<>(
		DEFAULT_CACHE_SIZE);

	/** Cached results of results of Directory.getUsersInRole by role */
	private Map<Role, UsersInRoleCache> usersInRoleCache = new ConcurrentHashMap<>(
		DEFAULT_CACHE_SIZE);

	public static DirectoryCacheManager getInstance()
	{
		if (instance == null)
		{
			String propPath = System.getProperty(
				CommonConstants.EBX_PROPERTIES_SYSTEM_PROPERTY_NAME,
				CommonConstants.EBX_PROPERTIES_SYSTEM_PROPERTY_NAME);
			Properties props = new Properties();
			try
			{
				props.load(new FileInputStream(propPath));
			}
			catch (IOException e)
			{
				throw new RuntimeException("Error loading properties file", e);
			}

			instance = new DirectoryCacheManager(props);
		}
		return instance;
	}

	private DirectoryCacheManager(Properties props)
	{
		init(props);
	}

	private void init(Properties props)
	{
		try
		{
			this.expiration = Integer.parseInt(
				props.getProperty(EXPIRATION_OF_CACHE, String.valueOf(DEFAULT_CACHE_REFRESH_TIME)));
		}
		catch (NumberFormatException e)
		{
			logger.warn(
				"Could not parse " + EXPIRATION_OF_CACHE + "value "
					+ props.getProperty(EXPIRATION_OF_CACHE));
			this.expiration = DEFAULT_CACHE_REFRESH_TIME;
		}
		if (expiration <= 0)
		{
			usingCache = false;
		}
		else
		{
			usingCache = true;
		}

	}

	public static boolean isUsingCache()
	{
		return getInstance().usingCache;
	}

	public static Boolean isUserInRole(Role role, UserReference user)
	{
		DirectoryCacheManager instance = getInstance();
		if (!instance.usingCache)
		{
			return null;
		}

		Map<UserReference, RoleUserCache> users = instance.userInRoleCache.get(role);
		if (users == null)
		{
			return null;
		}
		RoleUserCache roleUserCache = users.get(user);
		if (roleUserCache == null)
		{
			return null;
		}
		if (roleUserCache.isExpired())
		{
			users.remove(user);
			return null;
		}
		return roleUserCache.isMember();
	}

	public static List<UserReference> getUsersForRole(Role role)
	{
		DirectoryCacheManager instance = getInstance();
		if (!instance.usingCache)
		{
			return null;
		}

		UsersInRoleCache users = instance.usersInRoleCache.get(role);
		if (users == null)
		{
			return null;
		}
		if (users.isExpired())
		{
			instance.usersInRoleCache.remove(role);
			return null;
		}
		return users.getUsers();
	}

	public static void cacheRoleUsers(Role role, UserReference user, boolean isMember)
	{
		DirectoryCacheManager instance = getInstance();
		if (!instance.usingCache)
		{
			return;
		}

		Map<UserReference, RoleUserCache> users = instance.userInRoleCache.get(role);
		if (users == null)
		{
			users = new HashMap<>();
			instance.userInRoleCache.put(role, users);
		}
		RoleUserCache userCache = new RoleUserCache(instance.expiration, user, isMember);
		users.put(user, userCache);
		//update cached usersInRole
		UsersInRoleCache usersInRole = instance.usersInRoleCache.get(role);
		if (usersInRole != null)
		{
			usersInRole.updateUser(user, isMember);
		}
	}

	public static CachedUser getCachedUser(String login)
	{
		DirectoryCacheManager instance = getInstance();
		if (!instance.usingCache)
			return null;
		CachedUser cachedUser = instance.userCache.get(login);
		if (cachedUser != null && cachedUser.isExpired())
		{
			instance.userCache.remove(login);
			return null;
		}
		return cachedUser;
	}

	public static CachedUser cacheUser(
		String login,
		String password,
		UserReference userReference,
		boolean external)
	{
		DirectoryCacheManager instance = getInstance();
		if (!instance.usingCache)
		{
			return null;
		}
		CachedUser cachedUser = new CachedUser(
			instance.expiration,
			external,
			userReference,
			login,
			password);
		instance.userCache.put(login, cachedUser);
		return cachedUser;
	}

	public static CachedRole getCachedRole(String role)
	{
		DirectoryCacheManager instance = getInstance();
		if (!instance.usingCache)
			return null;
		CachedRole cachedRole = instance.roleCache.get(role);
		if (cachedRole != null && cachedRole.isExpired())
		{
			instance.roleCache.remove(role);
			return null;
		}
		return cachedRole;
	}

	public static CachedRole cacheRole(String role, String externalRole, boolean isExternalRole)
	{
		DirectoryCacheManager instance = getInstance();
		if (!instance.usingCache)
		{
			return null;
		}
		CachedRole cachedRole = new CachedRole(
			instance.expiration,
			isExternalRole,
			role,
			externalRole);
		instance.roleCache.put(role, cachedRole);
		return cachedRole;
	}

	public static void clearCache()
	{
		DirectoryCacheManager instance = getInstance();
		instance.userCache.clear();
		instance.usersInRoleCache.clear();
		instance.userInRoleCache.clear();
		instance.roleCache.clear();
	}

	public static void cacheRoleUsers(Role role, List<UserReference> users)
	{
		DirectoryCacheManager instance = getInstance();
		if (!instance.usingCache)
		{
			return;
		}
		if (users != null)
		{
			UsersInRoleCache usersInRole = new UsersInRoleCache(instance.expiration, users);
			instance.usersInRoleCache.put(role, usersInRole);
		}
	}

}
