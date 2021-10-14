package com.orchestranetworks.ps.customDirectory;

import java.util.*;
import java.util.AbstractMap.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;

/**
 * ExteranlDirectory is an interface for implementing additional functionality that is needed for CustomDirectory.
 * LDAP or ActiveDirectory are one example
 * Methods that are intended for updating a user with information from an external directory
 * 		1. updateUserProfile
 * Authenticating Methods
 * 		1. authenticateLogin
 * Authorization Methods
 * 	`	1. isUserInRole - checks is a user is in role. 
 * 		2. implementsGetUsersInRole - does the implementation class implements the isUserInRole method. 
 * 		3. getUsersInRole
 */
public interface ExternalDirectory
{

	/**
	 * Get information from the external directory in order to update the EBX user record.
	 * @param userObject - User holds the external directory user information,  
	 * @param user - not used.
	 * @return - a map of Path and values. 
	 */
	Map<Path, String> updateUserProfile(final User userObject, Adaptation user);

	/**
	 * @param login - user name
	 * @param password - password
	 * @param externalDirConfig - configuration to use. 
	 * @return - a user object with the information from the external directory or null if the user is not authenticated or not found
	 */
	User authenticateLogin(
		final String login,
		final String password,
		ExternalDirectoryConfig externalDirConfig);

	/**
	 * @param user - user object contain user information
	 * @param roleId - EBX role name
	 * @param roleLabel - EBX role label
	 * @return - true if the user can be associated with the roleId. 
	 */
	Boolean isUserInRole(final User user, final String roleId, final String roleLabel);

	/**
	 * @param props - property object to reload/load the configuration
	 */
	void updateDirProperties(PropertiesFileListener propLoader);

	/**
	 * This method is not used.
	 * @param fmt
	 * @param sess
	 * @return
	 */
	@Deprecated
	String getUserAuthenticationURI(String fmt, Session sess);

	/**
	 * @param login - login string passed from the login page.
	 * @return - a string identifying the external server. used for multiple external servers for authentication support 
	 * this server id is associated with a specific configuration.
	 */
	String getServerIdForUser(String login);

	/**
	 * @param serverId - the server id returned from {@link getServerIdForUser}
	 * @return - the configuration object associated with the serverId.
	 */
	ExternalDirectoryConfig getExternalDirectoryConfigForServerId(String serverId);

	/**
	 * @return - true if the implementation class implement the method {@link isUserInRole} this is mostly for optimization  
	 */
	boolean implementsGetUsersInRole();

	/**
	 * @param role - EBX role name 
	 * @return - list of users that can be associated with this role
	 */
	List<UserReference> getUsersInRole(Role role);

	/**
	 * @param user
	 * @param externalDirConfig
	 * @return List of SimpleEntry. each entry carry an attribute and it's value return an empty list if no attributes were found
	 */
	List<SimpleEntry<String, String>> getUserInfo(
		final String user,
		final ExternalDirectoryConfig externalDirConfig);

	// Functions for testing
	void interact(final ExternalDirectoryConfig externalDirConfig);

}
