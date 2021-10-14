package com.orchestranetworks.ps.beans.configuration;

import com.orchestranetworks.ps.ui.annotations.*;

@ConfigurationType(systemPropertyName = "ebx.directory.config", 
	serviceDescription = "A service to configure the properties required for LDAP integration.\r\n"
		+ "Must set ebx.directory.factory=com.orchestranetworks.ps.customDirectory.LdapDirectoryFactory in ebx.properties", 
	serviceKey = "LDAPConfigurationKey", 
	nameInMenu = "LDAP Configuration",
	requiredPropertyName="ebx.directory.factory", 
	requiredPropertyValue="com.orchestranetworks.ps.customDirectory.LdapDirectoryFactory"
	)
public class LDAPConfiguration extends DirectoryConfiguration
{

	@Property(propertyName = "ebx.directory.ldap.path", 
		label = "Server URL", 
		dataType = "string", 
		description = "LDAP Server URL.", 
		order = 12)
	public String serverURL;

	@Property(propertyName = "ebx.directory.ldap.bindDN", 
		label = "BindDN", 
		dataType = "string", 
		description = "A distinguish name for an account to connect to the LDAP server", 
		order = 13)
	public String bindDN;

	@Property(propertyName = "ebx.directory.ldap.credential", 
		label = "Password", 
		dataType = "password", 
		description = "Password for the BindDN", 
		order = 14)
	public String password;

	@Property(propertyName = "ebx.directory.membershipCacheMs", 
		label = "cache", 
		dataType = "integer", 
		description = "Defines the time lengh for a cache entry to be valid. Negative numbr means disable cache", 
		order = 15)
	
	public String membershipCacheMs;
		
	@Property(propertyName = "ebx.directory.ldap.referralpolicy", 
		label = "Referal Policy", 
		dataType = "string", 
		description = "Referal Policy default \"follow\"", 
		possibleValuesClassName = "com.orchestranetworks.ps.beans.configuration.RefferalPolicyPossibleValues", 
		order = 16)
	
	public String referalPolicy;

	@Property(propertyName = "ebx.directory.ldap.ldapversion", 
		label = "LDAP Version", 
		dataType = "string", 
		description = "LDAP protocol version", 
		possibleValuesClassName = "com.orchestranetworks.ps.beans.configuration.VersionPossibleValues", 
		order = 17)
	
	public String ldapversion;

	
	@Property(propertyName = "ebx.directory.ldap.baseDN", 
		label = "BaseDN", 
		dataType = "string", 
		description = "LDAP tree position to start a search from", 
		order = 18)
	
	public String baseDN;

	@Property(propertyName = "ebx.directory.ldap.search", 
		label = "User Search query", 
		dataType = "string", 
		description = "ebx.directory.ldap.search - this query must return a user. otherwise authentication will fail.\r\n"
			+ "(objectClass=person) - search only for objects of type \"person\".\r\n"
			+ "(uid={0}) or (sAMAccountName={0}) - where a person have an attribute named \"uid\" or \"sAMAccountName\" with the value of {0}\r\n"
			+ "{0} - will be replaced with the user name from the EBX login page.\r\n",
		order = 19)
	
	public String search;

	@Property(propertyName = "ebx.directory.ldap.requiredToLogin.role", 
		label = "Required Group to be able to login to EBX", 
		dataType = "string", 
		description = "An ldap query template to check if a user exist in a specifi group in order to access EBX.\r\n" +
			" {0} will be replaced with EBX userID, {1} with user LDAP DN, {2} with roleID \r\n" +
			" EBX_Users should be replaced with the LDAP group name that is used to list the users who can login to EBX. \r\n"
			+ "Example: (&(objectClass=groupOfNames)(cn=EBX_Users)(member=uid={0}))", 
		order = 20)
	
	public String requiredToLoginRole;

	@Property(propertyName = "ebx.directory.ldap.requiredToLogin.membershipBase", 
		label = "Role for login", 
		dataType = "string", 
		description = "specify the starting point in the LDAP hierarchy - dc - domain common name. if not specify @ebx.directory.ldap.baseDN is used."
			+ "Example: dc=example,dc=com", 
		order = 21)
	
	public String requiredToLoginRolemembershipbase;

	@Property(propertyName = "ebx.directory.ldap.adminGroup", 
		label = "Administrator Role", 
		dataType = "string", 
		description = "EBX administration user check - special case if defined. a member that belong to this group will be defined as EBX administrator\r\n" + 
			" in version prior to 2019-05-07 code was expecting an ldap name e.g. cn=groupName\r\n" + 
			" in version after 2019-05-07 code expects an ldap filter similar to what is set for \"ebx.directory.ldap.requiredToLogin.role\"\r\n" + 
			" example: (&(objectClass=groupOfNames)(cn=EBX_AdminGroupName)(member=uid={0}))", 
		order = 22)
	
	public String adminGroup;	
	
	@Property(propertyName = "ebx.directory.ldap.readOnlyGroup", 
		label = "Read Only Role", 
		dataType = "string", 
		description = "EBX read-only user check - special case if defined\r\n" + 
			"in version prior to 2019-05-07 code was expecting an ldap name e.g. cn=groupName\r\n" + 
			"in version after 2019-05-07 code expects an ldap filter similar to what is set for \"ebx.directory.ldap.requiredToLogin.role\"\r\n" + 
			"example: (&(objectClass=groupOfNames)(cn=EBX_readOnlyGroupName)(member=uid={0}))", 
		order = 23)
	
	public String readOnlyGroup;	
	
	@Property(propertyName = "ebx.directory.ldap.ldapAttrib", 
		label = "LDAP Attributes", 
		dataType = "string", 
		description = "DEFAULT_EBX_USER_PATHS for \"ebx.directory.ldap.userPaths\"= { \r\n" + 
			"DirectoryPaths._Directory_Users._Email,\r\n" + 
			"DirectoryPaths._Directory_Users._LastName, \r\n" + 
			"DirectoryPaths._Directory_Users._FirstName,\r\n" + 
			"\r\n" + 
			"Comma delimited LDAP attribute name to be mapped to EBX by position\r\n" + 
			"first path will be mapped to first ldap attribute etc.\r\n"
			+ "Example: mail,givenName,sn,,,,", 
 
		order = 24)
	
	public String ldapAttrib;	

	@Property(propertyName = "ebx.directory.ldap.membershipBase", 
		label = "Membership Base", 
		dataType = "string", 
		description = "specify the baseDN for group search. where in the active directory / LDAP tree to start the search from.\r\n"
			+ "Example: dc=example,dc=com", 
 
		order = 25)
	
	public String membershipBase;	

	@Property(propertyName = "ebx.directory.ldap.membershipRole", 
		label = "Membership Role", 
		dataType = "string", 
		description = "Search for a group that have a name = {2}. {2} is replaced with an ebx role name. \r\n" + 
			"This will set the LDAP group info in case the membership filter need the qualified group name.\r\n"
			+ "Example: (&(objectClass=groupOfNames)(cn={2}))", 
 
		order = 26)
	
	public String membershipRole;	
	
	@Property(propertyName = "ebx.directory.ldap.membershipFilter", 
		label = "Membership Filter", 
		dataType = "string", 
		description = "This check for a group with a specific user in it. {0} will be replace with the login id. {2} will be replace with the group info found from\r\n" + 
			"Membership Role\r\n"
			+ "Example: (&({2})(member=uid={0}))", 
 
		order = 27)
	
	public String membershipFilter;	
	
	@Property(propertyName = "ebx.directory.ldap.userIdAttributeName", 
		label = "User ID Ldap Attribute Name", 
		dataType = "string", 
		description = "Specify the attribute name for the user id. In Apache it is \"uid\" in Microsoft Active directory it is \"sAMAccountName\". if not specify \"sAMAccountName\" is the default"
			+ "Example: uid", 
 
		order = 28)
	
	public String userIdAttributeName;	
	
	@Property(propertyName = "ebx.directory.ldap.implementsGetUsersInRole", 
		label = "Implements Get Users In Role", 
		dataType = "string", 
		description = "Settings for getting the users that belong to a group\r\n" + 
			"Set to true to enable this functionality", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 29)
	
	public String implementsGetUsersInRole;	
	
	
	@Property(propertyName = "ebx.directory.ldap.usersInGroup", 
		label = "Users In Role", 
		dataType = "string", 
		description = "Query string to get the ldap group that matches the role name. this accounts for ebx.directory.ldap.membershipRole.environmentPrefix \r\n" +
					  "and ebx.directory.ldap.membershipRole.environmentSuffix\r\n" + 
					  "if specifiedy\r\n"
					  + "Example: (&(objectClass=groupOfNames)(cn={0}))", 
		order = 30)
	
	public String usersInGroup;
	
	@Property(propertyName = "ebx.directory.ldap.usersInGroupAttributeName", 
		label = "Users In Group Attribute Name", 
		dataType = "string", 
		description = "Name of attribute in the group type for the users in the group. for apacheDS it is member, for Active Directory it is uniqueMember which is also the default \r\n"
					  + "Example: member", 
		order = 31)
	
	public String usersInGroupAttributeName;
	
	
}
