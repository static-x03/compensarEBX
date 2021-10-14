package com.orchestranetworks.ps.customDirectory;

import java.net.*;
import java.util.*;
import java.util.concurrent.*;

import javax.servlet.http.*;

import org.apache.commons.configuration2.*;
import org.apache.commons.lang3.*;

import com.onwbp.adaptation.*;
import com.onwbp.base.text.bean.*;
import com.onwbp.org.apache.log4j.*;
import com.orchestranetworks.instance.*;
import com.orchestranetworks.ps.cache.*;
import com.orchestranetworks.ps.constants.*;
import com.orchestranetworks.ps.customDirectory.sso.*;
import com.orchestranetworks.ps.logging.*;
import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.ps.utils.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.service.directory.*;

/** 
 * @author David Dahan
 *
 * A DirectoryInstance supporting SSO and internal and external directories
 *  
 */
public class CustomDirectory extends DirectoryDefault implements PropertiesConsumer
{
	private static final Category logger = CustomLogger.newInstance();
	protected Configuration configuration;
	private ExternalDirectory extDir = null;
	private HttpAuthenticate checkSSO = null;
	private Adaptation dirDataSet;

	private static Map<UserReference, User> loggedInUsers = new ConcurrentHashMap<>();

	// Property strings
	public static final String EXTERNAL_DIRECTORY_SYSTEM_PROPERTY_NAME = "ebx.directory.config";
	protected static final String _PREFIX = "ebx.directory.";
	protected static final String _SSO_CLASSNAME = "ebx.directory.SSOClass";
	protected static final String _ADMIN_USERID = "userCreationAcct";
	protected static final String _ENABLE_UPDATE = "enableProfileUpdate";
	protected static final String _ENABLE_LOGIN = "enableLogin";
	protected static final String _ENABLE_SSO = "enableSSO";
	protected static final String _ENABLE_BECOME = "enableBecome";
	protected static final String _ENABLE_CREATION = "enableUserCreation";
	protected static final String _LOGIN_URI = "loginURI";
	protected static final String _MEMBER_CACHE = "membershipCacheMs";
	protected static final String _LOOKUP_EBX_ROLES_IN_EXT_DIR = "lookupEBXRolesInExtDir";
	protected static final String _AUTHENTICATE_WITH_EBX_FIRST = "authenticateWithEBXFirst";
	protected static final String _WHENCREATEUSER_SETTHIS_DEFAULTROLE = "whenCreateUser_setThis_defaultRole";
	protected static final String _SSO_USE_ROLES = "sso.useroles";
	protected static final String _ADMIN_ROLE = "adminRole";
	protected static final String _READONLY_ROLE = "readOnlyRole";
	//	public static final String DIRECTORY_PASSWORDS_ENCRYPTED = "ebx.directory.passwordencrypted";
	public static final String DIRECTORY_PRIORITY_TO_SSO_INFO = "prioritytossoinfo";
	public static final String DIRECTORY_SSO_SAML_ATTRIBUTES = "sso.saml.attributes";

	protected static final int DEFAULT_CACHE_REFRESH_TIME = 0;
	protected static final int DEFAULT_ROLE_CACHE_SIZE = 20;

	// These names are not part of the public API
	private static final String DIR_DATA_SPACE_NAME = "ebx-directory";
	private static final String DIR_DATA_SET_NAME = "ebx-directory";

	// DirectoryPaths is not part of the public API
	private static final Path DIR_USER_TABLE_PATH = DirectoryPaths._Directory_Users
		.getPathInSchema();
	private static final Path DIR_ROLE_TABLE_PATH = DirectoryPaths._Directory_Roles
		.getPathInSchema();
	private static final Path DIR_USER_ROLES_TABLE_PATH = DirectoryPaths._Directory_UsersRoles
		.getPathInSchema();

	private static final Path ROLE_DOCUMENTATION_PATH = DirectoryPaths._Directory_Roles._Documentation;

	private static final String[] secretProperties = new String[] {
			"ebx.directory.ldap.credential" };

	private PropertiesFileListener propertyLoader = PropertiesFileListener.getPropertyLoader(
		System.getProperty(
			EXTERNAL_DIRECTORY_SYSTEM_PROPERTY_NAME,
			System.getProperty(CommonConstants.EBX_PROPERTIES_SYSTEM_PROPERTY_NAME)),
		secretProperties,
		this);

	// Property variables
	// Note that the default properties are defined in the updateDirProperties() function
	// and not by these initial values
	private String ssoClassName = "com.orchestranetworks.ps.customDirectory.sso.SSOCheck";
	private UserReference adminUser = null;
	private boolean enableUpdate = false;
	private boolean enableLogin = true;
	private boolean enableSSO = true;
	private boolean useSSORoles = false;
	private String adminRole = null;
	private String readOnlyRole = null;
	private boolean enableBecome = true;
	private boolean enableUserCreation = false;
	private String loginURI = null;
	private boolean lookupEBXRolesInExtDir = true;
	private boolean autenticateWithEBXFirst;
	private String defaultRole = null;
	private boolean enableSSOAttributes = true;

	private boolean passthrough;

	private boolean debugEnabled = logger.isDebugEnabled();
	//	private boolean priorityToSSOInfo;

	// Membership cache
	//	 private Map<UserReference, UserMembershipCache> membershipCache = new HashMap<>(
	//		DEFAULT_ROLE_CACHE_SIZE);;

	// UsersInRole cache
	//	 private Map<Role, RoleMembersCache> usersInRoleCache = new HashMap<>(DEFAULT_ROLE_CACHE_SIZE);

	public CustomDirectory(AdaptationHome aHome)
	{
		this(aHome, false);
	}

	public CustomDirectory(AdaptationHome aHome, boolean passthrough)
	{
		super(aHome);
		this.passthrough = passthrough;
		this.dirDataSet = aHome.getRepository()
			.lookupHome(HomeKey.forBranchName(DIR_DATA_SPACE_NAME))
			.findAdaptationOrNull(AdaptationName.forName(DIR_DATA_SET_NAME));
		if (!passthrough)
		{
			updateDirProperties();
		}

	}

	public void updateDirProperties()
	{
		try
		{
			if (extDir != null)
			{
				extDir.updateDirProperties(propertyLoader);
			}

			Configuration newConfiguration = propertyLoader.getConfiguration();
			if (newConfiguration != null && newConfiguration.equals(this.configuration))
			{
				return;
			}
			this.configuration = newConfiguration;
			this.adminUser = UserReference.forUser(dirProp(_ADMIN_USERID, "admin"));
			this.enableUpdate = isTrueDirProp(_ENABLE_UPDATE, false);
			this.enableLogin = isTrueDirProp(_ENABLE_LOGIN, true);
			this.enableBecome = isTrueDirProp(_ENABLE_BECOME, true);
			this.enableSSO = isTrueDirProp(_ENABLE_SSO, false);
			this.adminRole = dirProp(_ADMIN_ROLE, null);
			this.readOnlyRole = dirProp(_READONLY_ROLE, null);
			this.enableUserCreation = isTrueDirProp(_ENABLE_CREATION, false);
			this.loginURI = dirProp(_LOGIN_URI, null);
			this.autenticateWithEBXFirst = isTrueDirProp(
				_AUTHENTICATE_WITH_EBX_FIRST,
				Boolean.FALSE);
			this.defaultRole = dirProp(_WHENCREATEUSER_SETTHIS_DEFAULTROLE, null);
			this.lookupEBXRolesInExtDir = isTrueDirProp(_LOOKUP_EBX_ROLES_IN_EXT_DIR, true);
			enableSSOAttributes = isTrueDirProp(DIRECTORY_SSO_SAML_ATTRIBUTES, true);
			//			this.priorityToSSOInfo = false;
			if (enableSSO)
			{
				this.useSSORoles = isTrueDirProp(_SSO_USE_ROLES, false);

				if (useSSORoles && extDir != null)
				{
					logger.error(
						"Invalid configuration. the combination of \"ebx.directory.sso.useroles\"=true and \"ebx.directory.factory\"="
							+ extDir.getClass().getSimpleName() + " is invalid"
							+ " Either use \"ebx.directory.factory\"="
							+ this.getClass().getSimpleName()
							+ " or set \"ebx.directory.sso.useroles\"=false");
				}

				//				this.priorityToSSOInfo = true;
				this.ssoClassName = configuration
					.getString(_SSO_CLASSNAME, SSOCheck.class.getCanonicalName());
				try
				{
					if (checkSSO == null || !checkSSO.getClass().getName().equals(ssoClassName))
					{
						// Need new SSO class object
						Object newSSO = Class.forName(ssoClassName)
							.getDeclaredConstructor()
							.newInstance();
						if (newSSO instanceof HttpAuthenticate)
						{
							checkSSO = (HttpAuthenticate) newSSO;
						}
						else
						{
							checkSSO = null;
							logger.error(
								"Invalid value for " + _SSO_CLASSNAME
									+ ".  SSOClass is not superclass of " + ssoClassName);
						}
					}
				}
				catch (Exception e)
				{
					logger.error(
						"Invalid value for " + _SSO_CLASSNAME + ".  Could not create "
							+ ssoClassName,
						e);
					checkSSO = null;
				}
				if (checkSSO != null)
					checkSSO.updateSSOProperties(configuration);
			}
		}
		catch (final Exception ex)
		{
			logger.warn("Exception updating directory properties:" + ex.getMessage(), ex);
		}
	}

	public void setExternalDirectory(ExternalDirectory ext)
	{
		this.extDir = ext;
		updateDirProperties();
	}

	protected Configuration getProps()
	{
		return configuration;
	}

	private String dirProp(final String key, final String defaultValue)
	{
		String val = configuration.getString(_PREFIX + key);
		if (StringUtils.isEmpty(val))
			return defaultValue;
		return val;
	}

	private boolean isTrueDirProp(String key, boolean defaultValue)
	{
		return "true".equalsIgnoreCase(dirProp(key, defaultValue ? "true" : "false"));
	}

	@SuppressWarnings("deprecation")
	@Override
	public URI getUserAuthenticationURI(Session sess)
	{
		if (passthrough)
		{
			return super.getUserAuthenticationURI(sess);
		}
		if (this.loginURI == null)
			return null;

		String uriString = null;
		if (extDir != null)
			uriString = extDir.getUserAuthenticationURI(loginURI, sess);
		if (uriString == null)
			uriString = loginURI;
		try
		{
			return new URI(uriString);
		}
		catch (Exception e)
		{
			logger.warn("Could not parse ebx.properties " + _LOGIN_URI + "value.", e);
		}
		return null;
	}

	protected final String _INTERNAL_SESSION = "internalSession";
	@Override
	public UserReference authenticateUserFromLoginPassword(String login, String password)
	{
		if (passthrough)
		{
			return super.authenticateUserFromLoginPassword(login, password);
		}
		if (debugEnabled)
		{
			logger.debug("authenticateUserFromLoginPassword(" + login + ", #################)");
		}
		User user = null;

		if (login == _INTERNAL_SESSION) // Note this is not .equals but object identity.
			// If internal session creation call
			return this.adminUser;

		/*
		 * if authenticate with EBX first is true, we first authenticate with EBX. 
		 * if user is not authenticated we authenticate with external directory if defined. 
		 */
		boolean ebxUserOnly = false;
		// login might have domain name in it needs to cleaned up before used as is
		//		String cleanLogin = Utils.cleanLoginID(login);

		// check cache first if using cache. membershipCacheMs must be greater than -1 to enable the cache.
		CachedUser cacheduser = DirectoryCacheManager.getCachedUser(login);
		if (cacheduser != null && cacheduser.checkPassword(password))
		{
			UserReference userReference = cacheduser.getUserReference();
			if (userReference != null)
				return userReference;
		}

		if (this.autenticateWithEBXFirst)
		{
			user = authenticateUserWithEBX(login, password);
			ebxUserOnly = true;

			if (user == null)
			{
				user = authenticateUserWithExternalDirectory(login, password);
				ebxUserOnly = false;
			}
		}
		else
		{
			user = authenticateUserWithExternalDirectory(login, password);
			ebxUserOnly = false;
			if (user == null)
			{
				user = authenticateUserWithEBX(login, password);
				ebxUserOnly = true;
			}
		}

		/*
		 * at this point if user is null it means it is not a valid user for either EBX or external directory.
		 */
		if (user == null)
		{
			// Not found externally or internally. if internal directory is disabled we treat it like it wasn't found.
			logger.info("Denying user/password login for '" + login + "'.");
			return null;
		}
		else
		{
			DirectoryCacheManager.cacheUser(login, password, user.getUserReference(), !ebxUserOnly);
		}

		/*
		 * if the user is valid we check if it is defined in EBX directory. if not and creation is allowed we create the user profile in EBX
		 */
		if (!isUserDefined(user.getUserReference()))
		{
			if (debugEnabled)
			{
				logger.debug("user is not defined, creating a new user profile in EBX directory");
			}
			if (this.enableUserCreation)
			{
				createUser(user, ebxUserOnly);
			}
			else
			{
				logger.info("User '" + login + "' not found.");
				throw new AuthenticationException(
					"User '" + login + "' not found.\nPlease request access to this EBX system.");
			}
		}
		if (this.enableUpdate && extDir != null)
		{
			logger.info("enableUpdate and externalDir not null, updating user " + login);
			updateUser(user, ebxUserOnly);
		}

		logger.info("Returning user : " + user.getUserReference().getUserId());
		return user.getUserReference();
	}

	@Override
	public boolean isUserDefined(UserReference user)
	{
		UserReference checkedUser = UserReference.forUser(LDAPUtils.cleanLoginID(user.getUserId()));
		return super.isUserDefined(checkedUser);
	}

	private User authenticateUserWithEBX(String login, String password)
	{
		if (this.enableLogin)
		{
			UserReference user = super.authenticateUserFromLoginPassword(login, password);
			if (user == null)
			{
				user = UserReference.forUser(LDAPUtils.cleanLoginID(login));
				if (super.isUserDefined(user))
				{
					if (debugEnabled)
					{
						logger.debug("User exists in default directory, but failed authentication");
					}
				}
				return null;
			}
			User userObject = new User();
			userObject.setUserReference(user);
			return userObject;
		}
		return null;
	}

	private User authenticateUserWithExternalDirectory(String login, String password)
	{
		User user = null;
		if (extDir != null)
		{
			String serverId = extDir.getServerIdForUser(login);
			ExternalDirectoryConfig extDirConfig = extDir
				.getExternalDirectoryConfigForServerId(serverId);
			if (extDirConfig == null)
			{
				return null;
			}
			User userObject = extDir.authenticateLogin(login, password, extDirConfig);
			if (userObject != null)
			{
				// Check externally for user credentials
				user = userObject;
				userObject.setSsoInfo(Boolean.FALSE);
				logger.debug("user=" + userObject.getLdapName().toString());
				loggedInUsers.put(user.getUserReference(), userObject);

			}
		}
		return user;
	}

	public void createUser(final User user, boolean isEbxUser)
	{
		createUser(user, "nil", isEbxUser);
	}

	private void createUser(final User user, final String cred, boolean isAdministraotr)
	{
		Role role = null;
		if (!StringUtils.isEmpty(defaultRole))
		{
			final Role whenCreateUserSetThisDefaultRole = Role.forSpecificRole(defaultRole);
			final RoleEntity roleEntity = DirectoryDefaultHelper
				.findRole(whenCreateUserSetThisDefaultRole, this);
			if (roleEntity != null)
			{
				role = whenCreateUserSetThisDefaultRole;
			}
			else
			{
				logger.error(
					String.format(
						"cant set the user default role because configured role[%s] does not exist",
						whenCreateUserSetThisDefaultRole.getRoleName()));
			}
		}

		final UserEntity userEntity = DirectoryDefaultHelper.newUser(user.getUserReference(), this);

		userEntity.setPasswordChangeRequired(false);
		userEntity.setBuiltInAdministrator(false);
		userEntity.setPassword(null);
		userEntity.setReadOnly(false);

		updateUserProperties(user, userEntity, role, true, isAdministraotr);

	}

	public void updateUser(User user, boolean ebxUser)
	{
		final UserEntity userEntity = DirectoryDefaultHelper
			.findUser(user.getUserReference(), this);
		if (userEntity == null)
		{
			logger.error(
				"User profile " + user.getUserReference().getUserId()
					+ " doesn't exist in EBX directory.");
			return;
		}

		logger.info(
			"Updating User profile " + user.getUserReference().getUserId() + " in EBX directory.");
		updateUserProperties(user, userEntity, null, false, ebxUser);
	}

	private void updateUserProperties(
		User user,
		UserEntity userEntity,
		Role role,
		boolean newUser,
		boolean ebxUser)
	{
		if (ebxUser)
		{
			return;
		}

		// update user attributes from external directory information
		String emailAddress = null;
		String firstName = null;
		String lastName = null;
		String faxNumber = null;
		String JobFunction = null;
		String mobilePhoneNumber = null;
		String officePhoneNumber = null;
		String salutation = null;

		if (!user.getSsoInfo())
		{
			Map<Path, String> attributeMap = extDir.updateUserProfile(user, null);
			firstName = attributeMap.get(DirectoryPaths._Directory_Users._FirstName);
			lastName = attributeMap.get(DirectoryPaths._Directory_Users._LastName);
			emailAddress = attributeMap.get(DirectoryPaths._Directory_Users._Email);
			faxNumber = attributeMap.get(DirectoryPaths._Directory_Users._FaxNumber);
			JobFunction = attributeMap.get(DirectoryPaths._Directory_Users._JobFunction);
			mobilePhoneNumber = attributeMap
				.get(DirectoryPaths._Directory_Users._MobilePhoneNumber);
			officePhoneNumber = attributeMap
				.get(DirectoryPaths._Directory_Users._OfficePhoneNumber);
			salutation = attributeMap.get(DirectoryPaths._Directory_Users._Salutation);
		}
		else
		{
			firstName = user.getFirstName();
			lastName = user.getLastName();
			emailAddress = user.getEmailAddress();
			faxNumber = user.getFaxNumber();
			JobFunction = user.getJobFunction();
			mobilePhoneNumber = user.getMobilePhoneNumber();
			officePhoneNumber = user.getOfficePhoneNumber();
			salutation = user.getSalutation();
		}

		userEntity.setPasswordChangeRequired(false);

		// DirectoryPaths is not part of the public API
		userEntity.setEmail(emailAddress);
		userEntity.setFaxNumber(faxNumber);
		userEntity.setFirstName(firstName);
		userEntity.setJobTitle(JobFunction);
		userEntity.setLastName(lastName);
		userEntity.setMobilePhoneNumber(mobilePhoneNumber);
		userEntity.setOfficePhoneNumber(officePhoneNumber);
		userEntity.setSalutation(salutation);
		List<Role> roles = null;
		if (enableSSO && useSSORoles)
		{
			roles = collectUserRoles(user);
		}
		else
		{
			if (role != null)
			{
				roles = Arrays.asList(role);
			}
		}

		if (roles != null)
		{
			userEntity.setSpecificRoles(roles);
		}

		DirectoryDefaultHelper.saveUser(userEntity, "", this);

	}

	private List<Role> collectUserRoles(User user)
	{
		Set<Role> collectedRole = new HashSet<>();
		if (!StringUtils.isEmpty(defaultRole))
		{
			final Role whenCreateUserSetThisDefaultRole = Role.forSpecificRole(defaultRole);
			final RoleEntity roleEntity = DirectoryDefaultHelper
				.findRole(whenCreateUserSetThisDefaultRole, this);
			if (roleEntity != null)
			{
				collectedRole.add(whenCreateUserSetThisDefaultRole);
			}
			else
			{
				logger.error(
					String.format(
						"cant set the user default role because configured role[%s] does not exist",
						whenCreateUserSetThisDefaultRole.getRoleName()));
			}
		}

		List<Role> specificRoles = getAllSpecificRoles();
		// roles from saml.
		List<String> roles = user.getRoles();
		for (String userRole : roles)
		{
			for (Role specificRole : specificRoles)
			{
				if (specificRole.getRoleName().equalsIgnoreCase(userRole))
				{
					collectedRole.add(specificRole);
					break;
				}
			}
		}
		List<Role> result = new ArrayList<>(collectedRole);
		return result;
	}

	@Override
	public UserReference authenticateUserFromHttpRequest(HttpServletRequest req)
		throws AuthenticationException
	{
		if (passthrough)
		{
			return super.authenticateUserFromHttpRequest(req);
		}

		boolean ebxUserOnly = false;
		// If in a SOAP request use secondary authentication
		if (req.getHeader("SOAPAction") != null)
		{
			if (debugEnabled)
			{
				logger.debug("header contains SOAPAction");
			}
			return null;
		}

		// Authentication of user
		String uname = null;
		UserReference user = null;
		String password = null;

		// If SSO is enabled use credential from request
		// is sso support additional properties use them to update the ebx user.
		User userObject = null;
		if (enableSSO && checkSSO != null)
		{
			userObject = checkSSO.GetUserFromHTTPRequest(req);
			if (userObject == null)
			{
				if (debugEnabled)
				{
					logger.debug("No user info found in request.");
				}
			}
			else
			{
				user = userObject.getUserReference();
				userObject.setSsoInfo(enableSSOAttributes);
				logger.debug("User Object SSO Info set to: " + userObject.getSsoInfo());
				
				if (debugEnabled)
				{
					logger.debug("Found remote user " + user.getUserId() + ".");
				}
				// when using SSO with SAML the roles will come from the IDP server.
				loggedInUsers.put(user, userObject);
			}
		}
		if (userObject == null)
		{
			uname = req.getParameter("login");
			password = req.getParameter("password");
			if (debugEnabled)
			{
				logger.debug("login = " + uname + ", password = ????");
			}
			if (uname != null && password != null)
			{
				if (this.autenticateWithEBXFirst)
				{
					userObject = authenticateUserWithEBX(uname, password);
					ebxUserOnly = true;

					if (user == null)
					{
						userObject = authenticateUserWithExternalDirectory(uname, password);
						ebxUserOnly = false;
					}
				}
				else
				{
					userObject = authenticateUserWithExternalDirectory(uname, password);
					ebxUserOnly = false;
					if (user == null)
					{
						userObject = authenticateUserWithEBX(uname, password);
						ebxUserOnly = true;
					}
				}

				if (userObject == null)
				{
					//if we get here, the url had a login/password that were not correct
					throw new AuthenticationException(
						"Login/password incorrect.  Please request access to this system.");
				}
			}
		}

		if (userObject != null && !super.isUserDefined(userObject.getUserReference()))
		{
			if (debugEnabled)
			{
				logger.debug("user not defined.");
			}
			// If SSO user not found check for add or new install
			if (this.enableUserCreation)
			{
				createUser(userObject, ebxUserOnly);
			}
			//			else if (super.getAllUserReferences().size() == 1)
			//			{
			//				// Newly set up repository, only account is admin
			//				logger.info("Allowing repository setup admin for '" + uname + "'.");
			//				return super.getAllUserReferences().get(0);
			//			}
			else if (!enableLogin)
			{
				logger.info("Denying SSO access for user '" + uname + "'");
				throw new AuthenticationException(
					"Please request access to this system.  "
						+ "Authorized users are logged in automatically.");
			}
		}

		if (userObject == null)
		{
			if (debugEnabled)
			{
				logger.debug("user is null");
			}
			// Ensure we are up to date if we are rejecting logins
			return null;
		}

		// User is defined and authenticated
		String become = req.getParameter("become");
		if (become != null && this.enableBecome && isUserInRole(user, UserReference.ADMINISTRATOR))
		{
			if (debugEnabled)
			{
				logger.debug("Using become");
			}
			UserReference beUser = null;
			if (become != null)
				beUser = UserReference.forUser(become);
			if (beUser != null && super.isUserDefined(beUser))
			{
				logger.info("Allowing user '" + uname + "' to become user '" + become + "'");
				user = beUser;
			}
		}

		// Update from external directory
		// By updating the 'become' user we create a mechanism to mass update users
		if (userObject != null && this.enableUpdate)
		{
			logger.info("Updating user");
			updateUser(userObject, ebxUserOnly);
		}

		return userObject.getUserReference();
	}

	@Override
	public boolean isUserInRole(final UserReference user, final Role role)
	{
		if (debugEnabled)
		{
			logger.debug(
				"CustomDirectory:isUserInRole(" + user.getUserId() + "," + role.getRoleName()
					+ ")");
		}

		// get the user object from cache. user object collects information at login phase.
		// it saves extra trips to external directory or when SSO is used.
		User userObject = loggedInUsers.get(user);
		if (userObject == null)
		{
			userObject = new User();
			userObject.setUserReference(user);
			userObject.setLoginName(user.getUserId());
		}

		Boolean isMember = null;
		try
		{
			if (role.isBuiltIn())
			{
				if (role.isBuiltInEveryone())
				{
					return Boolean.TRUE;
				}
				if (role.isBuiltInAdministrator())
				{
					if (isUserInRoleInDefaultDirectory(user, role))
					{
						isMember = Boolean.TRUE;
					}
					else if (adminRole != null
						&& isUserInRole(user, Role.forSpecificRole(adminRole)))
					{
						isMember = Boolean.TRUE;
					}
				}
				if (role.isBuiltInReadOnly())
				{
					if (isUserInRoleInDefaultDirectory(user, role))
					{
						isMember = Boolean.TRUE;
					}
					else if (readOnlyRole != null
						&& isUserInRole(user, Role.forSpecificRole(readOnlyRole)))
					{
						isMember = Boolean.TRUE;
					}
				}
				if (isMember != null)
				{
					return isMember;
				}
			}

			if (passthrough)
			{
				isMember = Boolean.valueOf(isUserInRoleInDefaultDirectory(user, role));
			}
			// check cached userObject from SSO
			if (enableSSO && checkSSO != null && useSSORoles)
			{
				// if the user not in the SSO roles we check the default directory
				// we won't go and verify with the external directory
				isMember = userObject.isUserInRole(role);
				if (isMember != null)
				{
					return isMember.booleanValue();
				}
			}
			// Check cache
			isMember = DirectoryCacheManager.isUserInRole(role, user);
			if (isMember != null)
			{
				return isMember.booleanValue();
			}

			String roleId = role.getRoleName();
			if (!useSSORoles && extDir != null && lookupEBXRolesInExtDir)
			{
				// Check external directory. NOTE: this call will update the cache with the role and if it is an external role
				// this is to prevent extra trips to the external directory for validating the role itself.
				isMember = extDir.isUserInRole(userObject, role.getRoleName(), role.getLabel());
				//update user
				if (isMember != null && this.enableUpdate)
				{
					try
					{
						UserEntity userEntity = DirectoryDefaultHelper.findUser(user, this);
						if (userEntity != null)
						{
							if (role.isSpecificRole())
							{
								RoleEntity roleEntity = DirectoryDefaultHelper.findRole(role, this);
								if (roleEntity != null)
								{
									List<Role> roles = userEntity.getSpecificRoles();
									List<Role> newRoles = new ArrayList<>(roles);
									if (isMember && !newRoles.contains(role))
										newRoles.add(role);
									if (!isMember && newRoles.contains(role))
										newRoles.remove(role);
									if (!newRoles.equals(roles))
									{
										userEntity.setSpecificRoles(newRoles);
										DirectoryDefaultHelper.saveUser(userEntity, "", this);
									}
								}
							}
							else if (role.isBuiltIn())
							{
								if (role.isBuiltInAdministrator())
									userEntity.setBuiltInAdministrator(isMember.booleanValue());
								if (role.isBuiltInReadOnly())
									userEntity.setReadOnly(isMember.booleanValue());
								DirectoryDefaultHelper.saveUser(userEntity, "", this);
							}
						}
					}
					catch (Exception e)
					{
						logger.warn("Failed to update user-role in default directory", e);
					}
				}
			}

			if (isMember == null || !isMember.booleanValue())
			{
				// Not cached, not an external group, check EBX membership
				isMember = Boolean.valueOf(isUserInRoleInDefaultDirectory(user, role));
				CachedRole cr = DirectoryCacheManager.getCachedRole(roleId);
				if (cr == null)
					DirectoryCacheManager.cacheRole(roleId, null, false);
			}

			if (((extDir != null && lookupEBXRolesInExtDir) || useSSORoles)
				&& !isMember.booleanValue())
			{
				// if we have an ebx role that is included in role (parent role) 
				// we want to check if the parent role exist in the active directory.or
				// this check is called recursively if the parent role is included in a role etc.
				List<Role> specificRoles = getAllSpecificRoles();
				for (Role parentRole : specificRoles)
				{
					if (role.getRoleName().equals(parentRole.getRoleName()))
					{
						continue;
					}
					if (isRoleStrictlyIncluded(role, parentRole))
					{
						isMember = Boolean.valueOf(isUserInRole(user, parentRole));
						if (isMember.booleanValue())
						{
							break;
						}
					}
				}

			}
			// Update cache
			DirectoryCacheManager.cacheRoleUsers(role, user, isMember);
			return isMember.booleanValue();
		}
		finally
		{
			if (debugEnabled)
			{
				logger.debug(
					"Result: Is user " + user.getUserId() + " in role " + role.getRoleName()
						+ " answer is " + isMember);
			}
		}
	}

	protected boolean isUserInRoleInDefaultDirectory(UserReference user, Role role)
	{
		return super.isUserInRole(user, role);
	}

	/*
	 * Capability extension to support need to access role descriptions.
	 * This should be added to base Role API and then this can be deprecated.
	 */
	@Override
	public String getRoleDescription(Role role, Locale locale)
	{
		if (passthrough)
		{
			return super.getRoleDescription(role, locale);
		}
		if (role.isBuiltIn())
			return "EBX Built-in Role " + role.getLabel();
		try
		{
			Adaptation aRole = getDirectoryRoleTable()
				.lookupAdaptationByPrimaryKey(PrimaryKey.parseString(role.getRoleName()));
			LabelDescription doc = (LabelDescription) aRole.get(ROLE_DOCUMENTATION_PATH);
			if (doc.getLocalizedDocumentation(locale) == null)
				return "";
			final String desc = doc.getLocalizedDocumentation(locale).getDescription();
			if (desc == null)
				return "";
			return desc;
		}
		catch (Exception e)
		{
			return "";
		}
	}

	/**
	 * Get the data set for the user & role tables
	 * 
	 * @return the data set
	 */
	protected Adaptation getDirectoryDataSet()
	{
		return dirDataSet;
	}

	/**
	 * Get the user table
	 * 
	 * @return the user table
	 */
	protected AdaptationTable getDirectoryUserTable()
	{
		return getDirectoryDataSet().getTable(DIR_USER_TABLE_PATH);
	}

	/**
	 * Get the role table
	 * 
	 * @return the role table
	 */
	protected AdaptationTable getDirectoryRoleTable()
	{
		return getDirectoryDataSet().getTable(DIR_ROLE_TABLE_PATH);
	}

	/**
	 * Get the user roles table
	 * 
	 * @return the user roles table
	 */
	protected AdaptationTable getDirectoryUserRolesTable()
	{
		return getDirectoryDataSet().getTable(DIR_USER_ROLES_TABLE_PATH);
	}

	@Override
	protected UserReference authenticateUserFromLoginPassword(
		String arg0,
		String arg1,
		HttpServletRequest arg2)
	{
		if (arg2 != null)
		{
			UserReference user = authenticateUserFromHttpRequest(arg2);
			if (user != null)
				return user;
		}
		return super.authenticateUserFromLoginPassword(arg0, arg1, arg2);
	}

	@Override
	public UserReference authenticateUserFromArray(final Object[] args)
	{
		if (args != null && args[0] != null && args[0] instanceof UserReference)
		{
			final UserReference user = (UserReference) args[0];
			return user;
		}
		return super.authenticateUserFromArray(args);
	}

	public List<UserReference> getExtUsersInRole(Role role)
	{
		if (extDir == null || passthrough || !extDir.implementsGetUsersInRole())
			return Collections.emptyList();
		//look in the cache

		Set<UserReference> distinctUsers = new LinkedHashSet<>();
		List<UserReference> extUsers = extDir.getUsersInRole(role);
		distinctUsers.addAll(extUsers);

		//find users in including roles, too
		List<Role> specificRoles = getAllSpecificRoles();
		for (Role parentRole : specificRoles)
		{
			if (role.getRoleName().equals(parentRole.getRoleName()))
			{
				continue;
			}
			if (isRoleStrictlyIncluded(role, parentRole))
			{
				extUsers = extDir.getUsersInRole(parentRole);
				distinctUsers.addAll(extUsers);
			}
		}

		List<UserReference> result = new ArrayList<>(distinctUsers);
		return result;
	}

	@Override
	public List<UserReference> getUsersInRole(Role role)
	{
		List<UserReference> defaultResult = super.getUsersInRole(role);
		if (extDir == null || passthrough || !extDir.implementsGetUsersInRole())
			return defaultResult;
		//look in the cache

		List<UserReference> cachedMember = DirectoryCacheManager.getUsersForRole(role);
		if (cachedMember != null)
		{
			return cachedMember;
		}

		Set<UserReference> distinctUsers = new LinkedHashSet<>();
		distinctUsers.addAll(defaultResult);
		distinctUsers.addAll(getExtUsersInRole(role));
		List<UserReference> result = new ArrayList<>(distinctUsers);
		DirectoryCacheManager.cacheRoleUsers(role, result);
		return result;
	}

	@Override
	public void processProperies()
	{
		updateDirProperties();
	}

}
