package com.orchestranetworks.ps.customDirectory;

import java.io.*;
import java.util.*;
import java.util.AbstractMap.*;

import javax.naming.*;
import javax.naming.directory.*;
import javax.naming.ldap.*;

import org.apache.commons.lang3.*;

import com.onwbp.adaptation.*;
import com.onwbp.base.text.*;
import com.onwbp.org.apache.log4j.*;
import com.orchestranetworks.ps.cache.*;
import com.orchestranetworks.ps.constants.*;
import com.orchestranetworks.ps.logging.*;
import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.ps.utils.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.service.directory.*;

/**
 * @author Derek
 * 
 * Implementation of a LDAP based directory extending CustomDirectoryInstance
 * @see CustomDirectory
 * 
 */
public class LdapDirectory implements ExternalDirectory
{
	private static final Category logger = CustomLogger.newInstance();
	private static final String PROPERTY_PREFIX = "ebx.directory.ldap.";
	private static final String PATH = "path";
	private static final String BASE_DN = "baseDN";
	private static final String REFERRAL_POLICY = "referralpolicy";
	private static final String LDAP_VERSION = "ldapversion";

	private static final String BIND_DN = "bindDN";
	private static final String USER_LOGIN = "login";
	private static final String CREDENTIAL = "credential";
	private static final String LDAP_ATTRIBS = "ldapAttrib";
	private static final String USER_PATHS = "userPaths";
	private static final String USER_SEARCH = "search";
	private static final String MEMBERSHIP_BASE = "membershipBase";
	private static final String MEMBERSHIP_FILTER = "membershipFilter";
	private static final String MEMBERSHIP_ROLE = "membershipRole";
	private static final String REQ_TOLOGIN_MEMBERSHIP_BASE = "requiredToLogin.membershipBase";
	private static final String REQ_TOLOGIN_ROLE = "requiredToLogin.role";
	private static final String ADMIN_GROUP = "adminGroup";
	private static final String READONLY_GROUP = "readOnlyGroup";
	private static final String ENVIRONMENT_PREFIX = "membershipRole.environmentPrefix";
	private static final String ENVIRONMENT_SUFFIX = "membershipRole.environmentSuffix";
	private static final String AUTHENTICATE_WITH_EBX_FIRST = "authenticateWithEBXFirst";
	private static final String _USERID_ATTRIBUTE_NAME = "userIdAttributeName";
	private static final String IMPLEMENTS_GET_USERS_IN_ROLE = "implementsGetUsersInRole";
	private static final String USERS_IN_GROUP = "usersInGroup";
	private static final String USERS_IN_GROUP_ATTRIBUTE_NAME = "usersInGroupAttributeName";
	private static final String LDAP_DOMAIN_NAMES = "domain.names";

	private static final String CONTEXT_LDAP_JNDI_CLASS_NAME = "com.sun.jndi.ldap.LdapCtxFactory";

	private boolean debugEnabled = logger.isDebugEnabled();

	/** for debugging initial ldap setup, use this property set to true.  Note well
	 * that it should be removed after debugging is complete
	 * ebx.directory.ldap.forcePropertyReload=true
	 */
	//	private static final String FORCE_PROPERTY_RELOAD = "forcePropertyReload";

	private static final String[] DEFAULT_LDAP_ATTRIB = { "mail", "sn", "preferredgivenname",
			"personalTitle" };

	// DirectoryPaths is not part of the public API
	private static final Path[] DEFAULT_EBX_USER_PATHS = { DirectoryPaths._Directory_Users._Email,
			DirectoryPaths._Directory_Users._LastName, DirectoryPaths._Directory_Users._FirstName,
			DirectoryPaths._Directory_Users._Salutation };

	private static final String[] DEFAULT_LDAP_SERVER_ID_ARR = {
			LDAPConstants.DEFAULT_LDAP_SERVER_ID };

	// key = LDAP server Id (some string to identify the server), value = the config for that server
	// If there's only one LDAP server, it's stored here using key = DEFAULT
	private Map<String, LdapDirectoryConfig> ldapConfigs = new HashMap<>();

	private PropertiesFileListener propertyLoader = null;
	private String userIdAttributeName = "sAMAccountName";
	private String usersInGroupAttributeName = "uniqueMember";

	public LdapDirectory()
	{
		try
		{
			LdapDirectory.class.getClassLoader().loadClass("com.onwbp.org.apache.axis.AxisEngine");
		}
		catch (Exception e)
		{
			// Not in loaded EBX environment
		}
	}

	/**
	 * the server Id parsed from the property "ebx.directory.ldap.domain.names" value. it is a comma delimited string that each value represent one LDAP configuration
	 * The value must much what a user will type in the login name as the domain name e.g. us\someGuy where "us" is the domain.
	 * @return the server IDs
	 */
	protected String[] getAllLdapServerIds()
	{
		String domainNamesString = ldapProp("", LDAP_DOMAIN_NAMES);
		if (StringUtils.isEmpty(domainNamesString))
		{
			return DEFAULT_LDAP_SERVER_ID_ARR;
		}
		else
		{
			return StringUtils.split(domainNamesString, LDAPConstants.PROPERTY_VALUES_SEPARATOR);
		}

	}

	/**
	 * Return the server ID to use for the given user.
	 * By default, returns a DEFAULT server ID, indicating there's just one LDAP server.
	 * 
	 * @return the server ID
	 */
	@Override
	public String getServerIdForUser(String login)
	{
		if (StringUtils.contains(login, LDAPConstants.SERVER_ID_DELIMITER))
		{
			return StringUtils.substringBefore(login, LDAPConstants.SERVER_ID_DELIMITER);
		}
		return LDAPConstants.DEFAULT_LDAP_SERVER_ID;
	}

	/**
	 * @param serverId - this is the domain name in the login ID e.g. us\someGuy. us is the domain and someGuy is the user name.
	 * @return if the server ID is empty or null it returns an empty prefix otherwise it will return the serverId concatenated with "."
	 */
	private static String getPreffixForLdapServerId(String serverId)
	{
		return LDAPConstants.DEFAULT_LDAP_SERVER_ID.equals(serverId) ? "" : (serverId + ".");
	}

	private LdapName ldapNameProp(final String prefix, final String key)
	{
		return ldapNameProp(prefix, key, false);
	}

	/**
	 * @param key - the last portion of a property name. a property prefix will be append to it.
	 * @param optional - indicate if this property is optional. if it is not and no value is provided it will log an error.
	 * @return - returns an LdapName based on the value of the property.
	 */
	private LdapName ldapNameProp(final String prefix, final String key, boolean optional)
	{
		final String value = this.propertyLoader.getProperty(prefix + PROPERTY_PREFIX + key);
		if (debugEnabled)
		{
			logger.debug("Reloaded " + key + " = " + value);
		}
		if (value == null)
		{
			if (!optional)
			{
				if (debugEnabled)
				{
					logger.debug("LDAP name " + key + " must have a value.");
				}
			}
			return null;
		}
		LdapName name = null;
		try
		{
			name = new LdapName(value);
		}
		catch (Exception e)
		{
			if (debugEnabled)
			{
				logger.debug(
					"Invalid name for LDAP name  " + key
						+ ".  Be sure to double any \\ characters.",
					e);
			}
		}
		return name;
	}

	/**
	 * @param key - the last portion of a property name. a property prefix will be append to it.
	 * @return - returns the property value is exist.
	 */
	private String ldapProp(final String prefix, final String key)
	{
		final String value = this.propertyLoader.getProperty(prefix + PROPERTY_PREFIX + key);
		if (StringUtils.startsWith(key, CREDENTIAL))
		{
			if (debugEnabled)
			{
				logger.debug("Reloaded " + prefix + PROPERTY_PREFIX + key + " = ##########");
			}
		}
		else
		{
			if (debugEnabled)
			{
				logger.debug("Reloaded " + prefix + PROPERTY_PREFIX + key + " = " + value);
			}
		}
		return value;
	}

	/**
	 * Load a configuration from a pre loaded property object.
	 * The calling class (CustomDirectory) already loaded the properties so no reason to reload them again
	 */
	@Override
	public void updateDirProperties(PropertiesFileListener propertyLoaderp)
	{
		this.propertyLoader = propertyLoaderp;
		updateDirProperties();
	}

	/**
	 * loads the properties for all LDAP servers defined.
	 */
	public void updateDirProperties()
	{
		if (debugEnabled)
		{
			logger.debug("Reloading directory properties.");
		}
		ldapConfigs.clear();
		String[] serverIds = getAllLdapServerIds();
		for (String serverId : serverIds)
		{
			LdapDirectoryConfig config = loadLdapConfig(serverId);
			ldapConfigs.put(serverId.toLowerCase(), config);
		}
	}

	/**
	 * loads the properties for a specific LDAP server. s defined.
	 * @param serverId - the server Id parsed from the property "ebx.directory.ldap.domain.names" value. 
	 */
	private LdapDirectoryConfig loadLdapConfig(String serverId)
	{
		if (debugEnabled)
		{
			logger.debug("Reloading directory properties for serverId: " + serverId);
		}

		String preffix = getPreffixForLdapServerId(serverId);
		LdapDirectoryConfig config = new LdapDirectoryConfig();
		config.ldapServerURL = ldapProp(preffix, PATH);
		config.baseDN = ldapNameProp(preffix, BASE_DN);
		config.referralPolicy = ldapProp(preffix, REFERRAL_POLICY);
		config.ldapVersion = ldapProp(preffix, LDAP_VERSION);
		if (StringUtils.isEmpty(config.referralPolicy))
		{
			config.referralPolicy = "follow";
		}

		if (StringUtils.isEmpty(config.ldapVersion))
		{
			config.ldapVersion = "3";
		}

		config.bindDN = ldapNameProp(preffix, BIND_DN);
		config.credential = loadEncryptedValue(preffix, CREDENTIAL);
		config.setMembershipRole(ldapProp(preffix, MEMBERSHIP_ROLE));
		config.setMembershipFilter(ldapProp(preffix, MEMBERSHIP_FILTER));

		config.setReqLogin_role(ldapProp(preffix, REQ_TOLOGIN_ROLE));
		config.reqLogin_membershipBase = ldapNameProp(preffix, REQ_TOLOGIN_MEMBERSHIP_BASE, true);
		//		config.setReqLogin_membershipFilter(ldapProp(preffix + REQ_TOLOGIN_MEMBERSHIP_FILTER));

		config.setAdminGroupFilter(ldapProp(preffix, ADMIN_GROUP));

		config.setReadOnlyGroupFilter(ldapProp(preffix, READONLY_GROUP));
		config.setUserSearch(ldapProp(preffix, USER_SEARCH));
		config.setUserLogin(ldapProp(preffix, USER_LOGIN));
		config.membershipBase = ldapNameProp(preffix, MEMBERSHIP_BASE, true);
		config.environmentPrefix = ldapProp(preffix, ENVIRONMENT_PREFIX);
		if (config.environmentPrefix == null) //for backwards compatibility with previous spelling error
			config.environmentPrefix = ldapProp(preffix, "membershipRole.environementPrefix");
		config.environmentSuffix = ldapProp(preffix, ENVIRONMENT_SUFFIX);
		if (config.environmentSuffix == null) //for backwards compatibility with previous spelling error
			config.environmentSuffix = ldapProp(preffix, "membershipRole.environementSuffix");
		config.autenticateWithEBXFirst = Boolean.TRUE.toString()
			.equals(ldapProp(preffix, AUTHENTICATE_WITH_EBX_FIRST));

		if (config.membershipBase == null)
		{
			config.membershipBase = config.baseDN;
		}

		String attrs = ldapProp(preffix, LDAP_ATTRIBS);
		if (attrs == null)
		{
			config.ldapAttrib = DEFAULT_LDAP_ATTRIB;
		}
		else
		{
			config.ldapAttrib = attrs.split(LDAPConstants.PROPERTY_VALUES_SEPARATOR, 0);
		}
		String paths = ldapProp("", USER_PATHS); // this is EBX related no need to partition per ldap server.
		String uidName = ldapProp("", _USERID_ATTRIBUTE_NAME);
		if (uidName != null)
		{
			userIdAttributeName = uidName;
		}
		if (paths == null)
		{
			config.ebxUserPaths = DEFAULT_EBX_USER_PATHS;
		}
		else
		{
			String[] pathStr = paths.split(",", config.ldapAttrib.length);
			config.ebxUserPaths = new Path[pathStr.length];
			for (int i = 0; i < config.ebxUserPaths.length; i++)
			{
				config.ebxUserPaths[i] = Path.parse(pathStr[i]);
			}
		}
		//		config.forcePropertyReload = Boolean.TRUE.toString()
		//			.equals(ldapProp("", FORCE_PROPERTY_RELOAD));
		config.implementsGetUsersInRole = Boolean.TRUE.toString()
			.equals(ldapProp(preffix, IMPLEMENTS_GET_USERS_IN_ROLE));

		config.setUsersInGroup(ldapProp(preffix, USERS_IN_GROUP));
		String attributeToReturn = ldapProp(preffix, USERS_IN_GROUP_ATTRIBUTE_NAME);
		if (!StringUtils.isEmpty(attributeToReturn))
		{
			usersInGroupAttributeName = attributeToReturn;
		}

		return config;
	}

	//	public boolean isPasswordsEncrypted()
	//	{
	//		Boolean value = propertyLoader.getDecryptyValue(PropertiesFileListener.DIRECTORY_PASSWORDS_ENCRYPTED)
	//			.getBooleanProperty(CustomDirectory.DIRECTORY_PASSWORDS_ENCRYPTED);
	//		if (value == null)
	//		{
	//			return false;
	//		}
	//		return value.booleanValue();
	//	}

	private String loadEncryptedValue(String preffix, String credential)
	{
		return this.propertyLoader.getDecryptValue(preffix + PROPERTY_PREFIX + credential);
	}

	/* Perform a search. Return results or null on error */
	private List<SearchResult> searchLdap(
		final DirContext extCtx,
		final LdapName base,
		final String filter,
		LdapDirectoryConfig ldapConfig)
	{
		return searchLdap(extCtx, base, filter, null, ldapConfig);
	}

	private List<SearchResult> searchLdap(
		final DirContext extCtx,
		final LdapName base,
		final String filter,
		final String[] attributesToReturn,
		LdapDirectoryConfig ldapConfig)
	{
		List<SearchResult> res = new ArrayList<>();
		try
		{
			SearchControls ctrl = new SearchControls();
			ctrl.setCountLimit(0);
			ctrl.setSearchScope(SearchControls.SUBTREE_SCOPE);

			if (attributesToReturn != null && attributesToReturn.length > 0)
			{
				ctrl.setReturningAttributes(attributesToReturn);
			}

			DirContext ctx = extCtx;
			if (ctx == null)
				ctx = connectToLDAP(ldapConfig);
			if (debugEnabled)
			{
				logger.debug("Searching directory for <'" + base + "', '" + filter + "'>");
			}

			long startTime = System.currentTimeMillis();

			NamingEnumeration<SearchResult> results = ctx.search(base, filter, ctrl);

			logger.info(
				"Time it took to execute the search directory for <'" + base + "', '" + filter
					+ "'>" + (System.currentTimeMillis() - startTime));

			if (extCtx == null)
				ctx.close();
			// No entries found
			if (results == null || !results.hasMore())
			{
				if (debugEnabled)
				{
					logger.debug("no results found.");
				}
				return res;
			}
			while (results.hasMore())
			{
				SearchResult resultFound = results.next();
				res.add(resultFound);
				if (debugEnabled)
				{
					logger.debug("result found: <'" + resultFound.toString() + "'>");
				}
			}
		}
		catch (Exception e)
		{
			if (debugEnabled)
			{
				logger.debug("Search Exception:" + e.getMessage(), e);
			}
			return null;
		}
		return res;
	}

	protected ArrayList<SimpleEntry<String, String>> getAttributes(
		String name,
		final DirContext extCtx,
		LdapDirectoryConfig ldapConfig)
	{
		try
		{
			return getAttributes(new LdapName(name), extCtx, ldapConfig);
		}
		catch (Exception e)
		{
			if (debugEnabled)
			{
				logger.debug("", e);
			}
			return null;
		}
	}

	protected ArrayList<SimpleEntry<String, String>> getAttributes(
		final LdapName name,
		final DirContext extCtx,
		LdapDirectoryConfig ldapConfig)
	{
		ArrayList<SimpleEntry<String, String>> info = new ArrayList<>();
		try
		{
			DirContext ctx = extCtx;
			if (ctx == null)
				ctx = connectToLDAP(ldapConfig);

			Attributes atts = ctx.getAttributes(name);
			if (extCtx == null)
				ctx.close();

			for (NamingEnumeration<? extends Attribute> ae = atts.getAll(); ae.hasMore();)
			{
				Attribute attr = ae.next();
				String key = attr.getID();
				for (NamingEnumeration<?> values = attr.getAll(); values.hasMore();)
				{
					String value = values.next().toString();
					info.add(new SimpleEntry<>(key, value));
					if (debugEnabled)
					{
						logger.debug("Found " + name + "." + key + " ." + value);
					}
				}
			}
		}
		catch (Exception e)
		{
			if (debugEnabled)
			{
				logger.debug("", e);
			}
			return null;
		}
		return info;
	}

	private User getLoginForEbxUser(
		final String login,
		final DirContext ctx,
		LdapDirectoryConfig ldapConfig,
		String originalLogin)
	{
		if (ldapConfig.userSearch == null)
			return null;

		String filter = ldapConfig.userSearch.format(new Object[] { login });
		if (debugEnabled)
		{
			logger.debug("String used for user search " + filter.toString());
		}

		List<SearchResult> res = searchLdap(ctx, ldapConfig.baseDN, filter, ldapConfig);
		if (res == null || res.size() == 0)
		{
			if (debugEnabled)
			{
				logger.debug("User " + login + " not found.");
			}
			return null;
		}
		User user = new User();
		try
		{
			String userId = null;
			SearchResult result = res.get(0);
			if (ldapConfig.baseDN != null)
			{
				user.setLdapName(new LdapName(result.getName() + "," + ldapConfig.baseDN));
			}
			else
			{
				user.setLdapName(new LdapName(result.getName()));
			}
			Attributes attributes = result.getAttributes();

			if (attributes != null)
			{
				userId = (String) getAttributeValue(attributes, userIdAttributeName);
				for (NamingEnumeration<? extends Attribute> attributeEnumeration = attributes
					.getAll(); attributeEnumeration.hasMore();)
				{
					Attribute attr = attributeEnumeration.next();
					String key = attr.getID();
					for (NamingEnumeration<?> values = attr.getAll(); values.hasMore();)
					{
						String value = values.next().toString();
						user.addProperty(key, value);
						if (debugEnabled)
						{
							logger.debug("Found " + user.getLdapName() + "." + key + " ." + value);
						}
					}
				}

			}
			if (userId == null)
				userId = login;
			user.setUserReference(UserReference.forUser(userId));
		}
		catch (Exception e)
		{
			if (debugEnabled)
			{
				logger.debug(UserMessage.createError("Error creating LdapName.", e), e);
			}
		}

		return user;
	}

	private Object getAttributeValue(Attributes attributes, String attributeName)
		throws NamingException
	{
		if (attributes != null)
		{

			Attribute attribute = attributes.get(userIdAttributeName);
			if (attribute != null)
			{
				return attribute.get();
			}

		}
		return null;
	}

	@Override
	public User authenticateLogin(
		final String login,
		final String password,
		ExternalDirectoryConfig externalDirConfig)
	{

		String cleanLogin = LDAPUtils.cleanLoginID(login);

		LdapDirectoryConfig ldapConfig = (LdapDirectoryConfig) externalDirConfig;
		if (ldapConfig != null)
		{
			updateDirProperties();
		}
		User user = null;
		try
		{
			DirContext ctx = connectToLDAP(ldapConfig);
			user = getLoginForEbxUser(cleanLogin, ctx, ldapConfig, login);
			if (user == null)
			{
				return null;
			}
			user.setLoginName(login);
		}
		catch (Exception ex)
		{
			if (debugEnabled)
			{
				logger.debug("Error Authenticating the user.", ex);
			}
		}
		if (user == null)
		{
			logger.info("LDAP Login not found for " + login);
			return null;
		}

		if (ldapConfig.userLogin != null)
		{
			try
			{
				user.setLdapName(
					new LdapName(
						ldapConfig.userLogin
							.format(new String[] { cleanLogin, user.getLdapName().toString() })));
			}
			catch (InvalidNameException e)
			{
				if (debugEnabled)
				{
					logger.debug("Error setting user query.", e);
				}

			}
		}

		logger.debug("Authenticating " + user + ".");
		DirContext authenticationContext = connectToLDAP(user.getLdapName(), password, ldapConfig);
		if (authenticationContext == null)
		{
			if (debugEnabled)
			{
				logger.debug("Login/Password combination not valid");
			}
			return null;
		}
		else
		{
			try
			{
				authenticationContext.close();
			}
			catch (NamingException e)
			{
				if (debugEnabled)
				{
					logger.debug("There was an error closing the context.", e);
				}
			}
		}
		if (!Boolean.TRUE.equals(isUserInRole_RequiredForLogin(user, ldapConfig)))
		{
			if (debugEnabled)
			{
				logger.debug(
					String.format(
						"Not authorized. user[%s] is not a member of required default EBX group. ",
						LDAPUtils.cleanLoginID(login)));
			}
			return null;
		}
		return user;
	}

	/* (non-Javadoc)
	 * @see com.orchestranetworks.ps.customDirectory.ExternalDirectory#isUserInRole(com.orchestranetworks.ps.customDirectory.User, java.lang.String, java.lang.String)
	 * return null if super should do a check, false if the user not in role and true if user in role.
	 */
	@Override
	public Boolean isUserInRole(final User user, final String roleId, final String roleLabel)
	{
		logger.debug(
			"LdapDirectory:isUserInRole() : User '" + user.getUserReference().getUserId()
				+ "' Role Id : '" + roleId + "' Role Label : '" + roleLabel + '"');

		String serverId = getServerIdForUser(user.getLoginName());
		LdapDirectoryConfig ldapConfig = (LdapDirectoryConfig) getExternalDirectoryConfigForServerId(
			serverId);

		if (ldapConfig == null)
		{
			if (debugEnabled)
			{
				logger.debug("No configuration found for server " + serverId);
			}
			return null;
		}

		if (ldapConfig.membershipFilter == null)
		{
			if (debugEnabled)
			{
				logger.debug("No LDAP membership filter defined.");
			}
			return null;
		}

		final String adminRole = Role.ADMINISTRATOR.getRoleName();
		final String readerRole = Role.READ_ONLY.getRoleName();
		if (ldapConfig.adminGroupFilter == null && adminRole.equals(roleId))
		{
			return null;
		}
		if (ldapConfig.readOnlyGroupFilter == null && readerRole.equals(roleId))
		{
			if (debugEnabled)
			{
				logger.debug("No LDAP read only group filter defined.");
			}

			return null;
		}

		final String login = LDAPUtils.cleanLoginID(user.getLoginName());
		CachedUser cachedUser = DirectoryCacheManager.getCachedUser(login);
		if (cachedUser != null && !cachedUser.isExternal())
		{
			if (debugEnabled)
			{
				logger.debug("Skip LDAP membership lookup for EBX internal user");
			}
			return null;
		}

		User ldapUser = null;
		DirContext ctx = connectToLDAP(ldapConfig);
		try
		{
			if (user.getLdapName() == null)
			{
				ldapUser = getLoginForEbxUser(login, ctx, ldapConfig, user.getLoginName());
			}
			else
			{
				ldapUser = user;
			}
			if (ldapUser == null)
			{
				if (debugEnabled)
				{
					logger.debug("Skip LDAP membership lookup for EBX internal user: " + login);
				}
				return null;
			}
			String ldapUserDN = ldapUser.getLdapName().toString().replaceAll("\\\\", "\\\\\\\\");

			final String filter;
			boolean isBuiltIn = true;
			String groupFilter;
			String extRoleId = getRoleId(roleId, ldapConfig);

			// Check if the user belong to a group set as admin group.
			if (ldapConfig.adminGroupFilter != null && adminRole.equals(roleId))
			{
				groupFilter = ldapConfig.adminGroupFilter
					.format(new Object[] { login, ldapUserDN, extRoleId, roleLabel });
			}
			// Check if the user belong to a group set as read only group.
			else if (ldapConfig.readOnlyGroupFilter != null && readerRole.equals(roleId))
			{
				groupFilter = ldapConfig.readOnlyGroupFilter
					.format(new Object[] { login, ldapUserDN, extRoleId, roleLabel });
			}
			else
			{
				isBuiltIn = false;
				groupFilter = ldapConfig.membershipRole
					.format(new Object[] { login, ldapUserDN, extRoleId, roleLabel });
			}

			List<SearchResult> res = null;
			CachedRole cachedRole = DirectoryCacheManager.getCachedRole(roleId);
			if (cachedRole == null)
			{
				// query ldap for the special case groups, admin and read only.
				res = searchLdap(ctx, ldapConfig.membershipBase, groupFilter, ldapConfig);

				if (res == null || res.size() == 0)
				{
					if (debugEnabled)
					{
						logger.debug(
							"LDAP group " + groupFilter + " not found, assume role " + extRoleId
								+ " is EBX internal.");
					}
					return null;
				}
				else
				{
					// if group found - caching the result.
					cachedRole = DirectoryCacheManager.cacheRole(roleId, extRoleId, true);
					if (isBuiltIn)
					{
						return Boolean.TRUE;
					}
				}
			}
			if (cachedRole != null && !cachedRole.isExternal() && !isBuiltIn)
			{
				if (debugEnabled)
				{
					logger.debug("Skip LDAP membership lookup for EBX internal role");
				}
				return null;
			}

			// default group lookup
			filter = ldapConfig.membershipFilter
				.format(new Object[] { login, ldapUserDN, groupFilter });
			res = searchLdap(null, ldapConfig.membershipBase, filter, ldapConfig);

			if (res != null && res.size() > 0)
			{
				if (debugEnabled)
				{
					logger.debug("Results found searching for " + login + " in " + extRoleId + ".");
				}
				return Boolean.TRUE;
			}
			if (!isBuiltIn)
				if (debugEnabled)
				{
					logger.debug(
						"No results found searching for " + login + " in " + extRoleId + " <"
							+ filter + ">.");
				}
			return null;
		}
		finally
		{
			try
			{
				if (ctx != null)
					ctx.close();
			}
			catch (Exception e)
			{
				if (debugEnabled)
				{
					logger.debug("Error closing context.", e);
				}
			}
		}
	}

	public String getRoleId(String roleId, LdapDirectoryConfig ldapConfig)
	{
		String environmentPrefix = ldapConfig.environmentPrefix;
		if (!StringUtils.isEmpty(environmentPrefix))
		{
			roleId = environmentPrefix.concat(roleId);
		}
		String environmentSuffix = ldapConfig.environmentSuffix;
		if (!StringUtils.isEmpty(environmentSuffix))
		{
			roleId = roleId.concat(environmentSuffix);
		}
		return roleId;
	}

	@Override
	public String getUserAuthenticationURI(String format, Session sess)
	{
		// No custom login URL
		return null;
	}

	@Override
	public ExternalDirectoryConfig getExternalDirectoryConfigForServerId(String serverId)
	{
		if (serverId == null)
			serverId = LDAPConstants.DEFAULT_LDAP_SERVER_ID;
		LdapDirectoryConfig ldapConfig = ldapConfigs.get(serverId.toLowerCase());
		if (ldapConfig != null)
		{
			return ldapConfig;
		}
		ldapConfig = loadLdapConfig(serverId);
		ldapConfigs.put(serverId, ldapConfig);
		return ldapConfig;
	}

	public DirContext connectToLDAP(LdapDirectoryConfig ldapConfig)
	{
		return connectToLDAP(null, null, ldapConfig);
	}

	private DirContext connectToLDAP(
		LdapName login,
		final String password,
		LdapDirectoryConfig ldapConfig)
	{
		Hashtable<String, String> env = new Hashtable<>();

		env.put(Context.SECURITY_AUTHENTICATION, "none");
		if (login != null && password != null)
		{
			// Bind as specified user
			env.put(Context.SECURITY_PRINCIPAL, login.toString());
			env.put(Context.SECURITY_CREDENTIALS, password);
			env.put(Context.SECURITY_AUTHENTICATION, "simple");
			logger.info("Authenticating LDAP credentials for LDAP connection by " + login + ".");
		}
		else if (ldapConfig.bindDN != null)
		{
			// Bind as bindDN
			env.put(Context.SECURITY_PRINCIPAL, ldapConfig.bindDN.toString());
			if (debugEnabled)
			{
				logger.debug("Connecting to LDAP as bindDN.");
			}
			if (ldapConfig.credential != null)
			{
				env.put(Context.SECURITY_CREDENTIALS, ldapConfig.credential);
				env.put(Context.SECURITY_AUTHENTICATION, "simple");
			}
		}
		env.put(Context.PROVIDER_URL, ldapConfig.ldapServerURL);
		env.put(Context.INITIAL_CONTEXT_FACTORY, CONTEXT_LDAP_JNDI_CLASS_NAME);
		env.put(Context.REFERRAL, ldapConfig.referralPolicy);
		env.put("java.naming.ldap.version", ldapConfig.ldapVersion);

		try
		{
			DirContext ctx = new InitialDirContext(env);
			return ctx;
		}
		catch (Exception e)
		{
			if (login == null)
			{
				if (debugEnabled)
				{
					logger.debug(
						"Exception connecting to LDAP with baseDN.\n" + "LDAP Error: "
							+ e.getMessage(),
						e);
				}
			}
			// User not found, or connection exception
			// In case there has been an update reload configuration
			updateDirProperties();
			return null;
		}
	}

	@Override
	public ArrayList<SimpleEntry<String, String>> getUserInfo(
		String ebxUser,
		ExternalDirectoryConfig externalDirConfig)
	{
		LdapDirectoryConfig ldapConfig = (LdapDirectoryConfig) externalDirConfig;
		ArrayList<SimpleEntry<String, String>> res = new ArrayList<>();
		try
		{
			String cleanLogin = LDAPUtils.cleanLoginID(ebxUser);
			DirContext ctx = connectToLDAP(ldapConfig);
			User user = getLoginForEbxUser(cleanLogin, ctx, ldapConfig, ebxUser);
			// use will be null if not found in LDAP
			if (user != null)
			{
				res = getAttributes(user.getLdapName(), ctx, ldapConfig);
			}

		}
		catch (Exception e)
		{
			if (debugEnabled)
			{
				logger
					.debug(UserMessage.createError("Error getting attributes from context.", e), e);
			}
		}
		return res;
	}

	@Override
	public Map<Path, String> updateUserProfile(final User ebxUser, final Adaptation user)
	{
		String serverId = getServerIdForUser(ebxUser.getUserReference().getUserId());
		LdapDirectoryConfig ldapConfig = (LdapDirectoryConfig) getExternalDirectoryConfigForServerId(
			serverId);
		Map<Path, String> params = new HashMap<>();

		// Verify that the ebxUser contains properties. 
		// If not, retrieve then from LDAP. 
		// This may happen if the solution uses SSO to authenticate, 
		// but wants to use LDAP to authorize the user's permissions. 
		Map<String, String> ldapInfo = ebxUser.getProperties();

		if (ldapInfo == null || ldapInfo.isEmpty())
		{
			logger.debug("Attributes were empty. Retrieving attributes from external diretory (LDAP).");

			ldapInfo = new HashMap<>();

			// Depending on the SSO Check implemented by the customer
			// This may be required if the login name was not populated
			// by the SSO process. 
			if (ebxUser.getLoginName() == null)
			{
				ebxUser.setLoginName(ebxUser.getUserReference().getUserId());
			}
			// When mapping to paths only the first value will be taken
			List<SimpleEntry<String, String>> atts = getUserInfo(
				ebxUser.getLoginName(),
				ldapConfig);

			// At this point, just return the empty mapping
			// No attributes to update the user profile with. 
			if (atts == null || atts.size() == 0)
			{
				return params;
			}

			// When mapping to paths only the first value will be taken
			for (SimpleEntry<String, String> at : atts)
			{
				if (!ldapInfo.containsKey(at.getKey()))
				{
					ldapInfo.put(at.getKey(), at.getValue());
				}

			}
		}

		if (ldapInfo.size() > 0)
		{
			for (int i = 0; i < ldapConfig.ldapAttrib.length; i++)
			{
				String ebx = "";
				if (user != null)
					ebx = user.getString(ldapConfig.ebxUserPaths[i]);
				String ldap = ldapInfo.get(ldapConfig.ldapAttrib[i]);
				if (ldap == null)
					ldap = "";
				ldap = ldap.substring(ldap.indexOf(' ') + 1);
				if (ldap != null && !ldap.equals(ebx) && (ebx != null || ldap.length() > 0))
				{ // LDAP empty would be EBX null
					params.put(ldapConfig.ebxUserPaths[i], ldap);
					if (debugEnabled)
					{
						logger.debug("Updating fields " + ldapConfig.ebxUserPaths[i].format());
					}
				}
			}
		}
		if (params.size() > 0)
			logger.info("Found " + params.size() + " attibutes to update.");
		return params;
	}

	@Override
	public void interact(ExternalDirectoryConfig extDirConfig)
	{
		BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

		String cmd = "";
		String param = "";
		User user;

		LdapDirectoryConfig ldapConfig = (LdapDirectoryConfig) extDirConfig;
		DirContext ctx = connectToLDAP(ldapConfig);
		while (cmd != null && !cmd.startsWith("Q") && !cmd.startsWith("q"))
		{
			user = null;
			if (cmd.equalsIgnoreCase("u"))
			{
				user = getLoginForEbxUser(param, ctx, ldapConfig, null);
				if (user == null)
				{
					System.out.println("User not found.");
				}
				else
				{
					System.out.println("Searching for user " + user + " .");
					cmd = "a";
				}

			}
			if (cmd.equalsIgnoreCase("a"))
			{
				if (user == null)
				{
					try
					{
						user = new User();
						user.setLdapName(new LdapName(param));
					}
					catch (Exception e)
					{
						System.out.println("Could not build LdapName from '" + param + "'.");
						cmd = "";
						continue;
					}
				}
				ArrayList<SimpleEntry<String, String>> atts = getAttributes(
					user.getLdapName(),
					ctx,
					ldapConfig);
				if (atts == null)
				{
					System.out.println("Attribute Search failure.");
				}
				else
				{
					for (SimpleEntry<String, String> at : atts)
						System.out.println(at.getKey() + " = " + at.getValue());
				}
			}
			else if (cmd.equalsIgnoreCase("u"))
			{
				User paramUser = getLoginForEbxUser(param, ctx, ldapConfig, null);

				ArrayList<SimpleEntry<String, String>> atts = getAttributes(
					paramUser.getLdapName(),
					ctx,
					ldapConfig);
				if (atts == null)
				{
					System.out.println("Attribute Search failure.");
				}
				else
				{
					for (SimpleEntry<String, String> at : atts)
						System.out.println(at.getKey() + " = " + at.getValue());
				}
			}
			else if (cmd.equalsIgnoreCase("s"))
			{
				List<SearchResult> results = searchLdap(ctx, ldapConfig.baseDN, param, ldapConfig);
				if (results == null || results.size() == 0)
				{
					System.out.println("No results.");
				}
				else
				{
					for (SearchResult res : results)
					{
						System.out.println(res + "," + ldapConfig.baseDN);
					}
				}
			}
			else if (cmd.equalsIgnoreCase("g"))
			{
				List<SearchResult> results = searchLdap(
					ctx,
					ldapConfig.membershipBase,
					ldapConfig.membershipRole.format(new Object[] { "", "", param, param }),
					ldapConfig);
				if (results == null || results.size() == 0)
				{
					System.out.println("No results.");
				}
				else
				{
					for (SearchResult res : results)
					{
						System.out.println(res + "," + ldapConfig.membershipBase);
						ArrayList<SimpleEntry<String, String>> atts = getAttributes(
							res + "," + ldapConfig.membershipBase,
							ctx,
							ldapConfig);
						if (atts == null)
						{
							System.out.println("Attribute Search failure.");
						}
						else
						{
							for (SimpleEntry<String, String> at : atts)
								System.out.println(at.getKey() + " = " + at.getValue());
						}
					}
				}
			}
			else if (cmd.equalsIgnoreCase("m"))
			{
				String[] params = param.split(" ");
				if (params.length != 2)
				{
					System.out.println("Incorrect usage.  Please specify user and group.");
					cmd = "";
					continue;
				}
				User userObjet = new User();
				userObjet.setUserReference(UserReference.forUser(params[0]));
				if (Boolean.TRUE.equals(isUserInRole(userObjet, params[1], params[1])))
					System.out.println("User " + params[0] + " is in group " + params[1] + ".");
				else
					System.out.println("User " + params[0] + " is not in group " + params[1] + ".");
			}
			else
			{
				System.out.println(
					"Syntax:\n" + "A <name> : Return attributes for <name>\n"
						+ "S <filter> - Search for <filter>\n"
						+ "U <user> - Return attributes for ebx user <user>\n"
						+ "G <group> - Return attributes for ebx group <group>\n"
						+ "M <user> <group> - Check for <user> membership in <group>\n"
						+ "Q - quit");
			}
			System.out.println("<asugm>?:");
			try
			{
				cmd = "" + (char) br.read();
				br.read();
				param = br.readLine();
			}
			catch (IOException e)
			{
				return;
			}
		}
	}

	public Boolean isUserInRole_RequiredForLogin(final User user, LdapDirectoryConfig ldapConfig)
	{
		// if this property is not set we assume that option is not activated.
		if (ldapConfig.reqLogin_role == null)
		{
			if (debugEnabled)
			{
				logger.debug(
					"Property ebx.directory.ldap.requiredToLogin.role not set assuming that no check for a user to belong to group is needed.");
			}
			return Boolean.TRUE;
		}

		if (ldapConfig.reqLogin_membershipBase == null)
		{
			ldapConfig.reqLogin_membershipBase = ldapConfig.membershipBase;
		}

		DirContext ctx = null;
		final String login = user.getUserReference().getUserId();
		try
		{
			ctx = connectToLDAP(ldapConfig);
			String ldapUserDN = "";

			// If we are using the ldapUser fetch it
			if (ldapConfig._reqLogin_role.contains("{1}"))
			{
				ldapUserDN = user.getLdapName().toString().replaceAll("\\\\", "\\\\\\\\");
			}

			//			final String filter;
			final String groupFilter;

			//			groupFilterTmp = reqLogin_role.format(new Object[] { login, ldapUserDN });
			//			groupFilter = ldapFilterEscape(groupFilterTmp);
			groupFilter = ldapConfig.reqLogin_role.format(new Object[] { login, ldapUserDN });

			if (debugEnabled)
			{
				logger.debug("String used for reqLogin_role" + groupFilter.toString());
			}

			final List<SearchResult> fetchRole = searchLdap(
				ctx,
				ldapConfig.reqLogin_membershipBase,
				groupFilter,
				ldapConfig);

			if (fetchRole != null && fetchRole.size() > 0)
			{
				if (debugEnabled)
				{
					logger.debug(
						"Required for login. Results found searching for " + login + " using "
							+ String.format(
								"base[%s], filter[%s]",
								ldapConfig.reqLogin_membershipBase,
								groupFilter)
							+ ".");
				}
				return true;
			}
			else
			{
				if (debugEnabled)
				{
					logger.debug(
						String.format(
							"Required for login. No results found searching for %s using base[%s], filter[%s]",
							login,
							ldapConfig.reqLogin_membershipBase,
							groupFilter));
				}
				return false;
			}

		}
		finally
		{
			try
			{
				if (ctx != null)
				{
					ctx.close();
				}
			}
			catch (Exception e)
			{
				throw new RuntimeException(e);
			}
		}
	}

	/**
	 * @author Derek
	 * 
	 * Implementation of a DirectoryFactory with external LDAP directory
	 * @see CustomDirectory
	 * 
	 */
	public class Factory extends DirectoryDefaultFactory
	{
		@Override
		public Directory createDirectory(AdaptationHome aHome) throws Exception
		{
			CustomDirectory dir = new CustomDirectory(aHome);
			dir.setExternalDirectory(new LdapDirectory());
			return dir;
		}
	}

	@Override
	public boolean implementsGetUsersInRole()
	{
		String serverId = getServerIdForUser(null);
		LdapDirectoryConfig ldapConfig = (LdapDirectoryConfig) getExternalDirectoryConfigForServerId(
			serverId);
		return ldapConfig.implementsGetUsersInRole;
	}

	@Override
	public List<UserReference> getUsersInRole(Role role)
	{
		if (debugEnabled)
		{
			logger.debug("LDAP -- looking up users in role " + role.getRoleName());
		}
		Set<String> users = searchLdapUsersInRole(role);
		List<UserReference> result = new ArrayList<>();
		for (String ldapauser : users)
		{
			UserReference user = UserReference.forUser(ldapauser);
			result.add(user);
		}
		return result;
	}

	private Set<String> searchLdapUsersInRole(Role role)
	{
		String serverId = getServerIdForUser(null);
		LdapDirectoryConfig ldapConfig = (LdapDirectoryConfig) getExternalDirectoryConfigForServerId(
			serverId);

		DirContext ctx = null;

		Set<String> userIds = new LinkedHashSet<>();
		ctx = connectToLDAP(ldapConfig);
		if (ldapConfig._usersInGroup.contains("{0}"))
		{
			String ldapGroupName = getRoleId(role.getRoleName(), ldapConfig);
			String userInGroupSearch = ldapConfig.usersInGroup
				.format(new Object[] { ldapGroupName });

			List<SearchResult> fetchRole = searchLdap(
				ctx,
				ldapConfig.baseDN,
				userInGroupSearch,
				new String[] { usersInGroupAttributeName },
				ldapConfig);
			if (debugEnabled)
			{
				logger.debug("Fetching users in role yields " + fetchRole.size() + " results");
			}
			for (SearchResult result : fetchRole)
			{
				Attribute users = result.getAttributes().get(usersInGroupAttributeName);
				int numberOfUsers = users.size();
				logger.debug("... containing " + numberOfUsers + " users...");
				for (int i = 0; i < numberOfUsers; i++)
				{
					try
					{
						LdapName name = new LdapName((String) users.get(i));
						Attributes attrs = ctx.getAttributes(name);
						if (attrs == null)
							continue;
						Attribute uidattr = attrs.get(userIdAttributeName);
						if (uidattr == null)
							continue;
						String uid = (String) uidattr.get();
						userIds.add(uid);
					}
					catch (Exception e)
					{
						logger.error("Failed to fetch users in group", e);
					}
				}
			}
		}
		else
		{
			if (debugEnabled)
			{
				logger.debug(
					"userInGroup property has no parameter so can't be used to look up users in role.");
			}
		}

		return userIds;
	}

}
