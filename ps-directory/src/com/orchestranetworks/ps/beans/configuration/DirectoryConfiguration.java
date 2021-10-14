package com.orchestranetworks.ps.beans.configuration;

import com.orchestranetworks.ps.ui.annotations.*;

public class DirectoryConfiguration
{
	@Property(propertyName = "ebx.directory.enableLogin", 
		label = "Enable login ", 
		dataType = "string", 
		description = "Enable login using the EBX login page", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 1)
	public String enableLogin;

	@Property(propertyName = "ebx.directory.passwordencrypted", 
		label = "Encrypt Passwords", 
		dataType = "string", 
		description = "Are passwords stored encrypted", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 2)
	public String passwordEncrypted;

	@Property(propertyName = "ebx.directory.enableUserCreation", 
		label = "Enable User Profile creation", 
		dataType = "string", 
		description = "Enable the User profile to be created when the user logs in for the first time", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 3)
	public String enableUserCreation;

	@Property(propertyName = "ebx.directory.enableProfileUpdate", 
		label = "Enable User Profile Update", 
		dataType = "string", 
		description = "Enable the User profile to be updated with info form the LDAP server", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 4)
	public String enableProfileUpdate;
	
	@Property(propertyName = "ebx.directory.ldap.membershipRole.environmentPrefix", 
		label = "Environemnt Prefix", 
		dataType = "string", 
		description = "the value of this property will be added to the beginning of the EBX role name/id before comparing it to the DS group name.\r\n" + 
			"if EBX role name is \"dataSteward\" and the value of the property is \"test_\" then it will search for a group name of \"test_dataSteward\"\r\n" + 
			"this property can be combined with \"ebx.directory.ldap.membershipRole.environementSuffix\" ", 
 		order = 5)
	
	public String environmentPrefix;	
	
	@Property(propertyName = "bx.directory.ldap.membershipRole.environmentSuffix", 
		label = "Environemnt Suffix", 
		dataType = "string", 
		description = "the value of this property will be added to the end of the EBX role name/id before comparing it to the DS group name.\r\n" + 
			"if EBX role name is \"dataSteward\" and the value of the property is \"_test\" then it will search for a group name of \"dataSteward_test\"\r\n" + 
			"this property can be combined with \"ebx.directory.ldap.membershipRole.environementPrefix", 
 		order = 6)
	
	public String environmentSuffix;	
	
	@Property(propertyName = "ebx.directory.whenCreateUser_setThis_defaultRole", 
		label = "Default Role", 
		dataType = "string", 
		description = "When user is created assign the user this role", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.RolesPossibleValues", 
		order = 7)
	public String whenCreateUser_setThis_defaultRole;

	@Property(propertyName = "ebx.directory.authenticateWithEBXFirst", 
		label = "Authenticate with EBX Directory first", 
		dataType = "string", 
		description = "Authenticate with EBX Directory first", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 8)
	public String authenticateWithEBXFirst;
	
	@Property(propertyName = "ebx.directory.enableBecome", 
		label = "Enable Become", 
		dataType = "string", 
		description = "An administrator can login as administrator but become a different user after login."
			+ "to achive that use the URL login option and provide the pramete \"become\" with a user name as a value.", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 9)
	public String enableBecome;
	
	
	
	@Property(propertyName = "ebx.directory.enableSSO", 
		label = "Enable SSO", 
		dataType = "string", 
		description = "Enable Integration", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 10)
	public String enableSSO;
	
	@Property(propertyName = "ebx.directory.SSOClass", 
		label = "SSO Implementation Class", 
		dataType = "string", 
		description = "SSO Integration class name.", 
		defaultValue = "com.orchestranetworks.ps.customDirectory.sso.saml.SamlSSOCheck",
		order = 11)
	public String SSOClass;


}
