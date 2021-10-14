package com.orchestranetworks.ps.beans.configuration;

import com.orchestranetworks.ps.ui.annotations.*;

@ConfigurationType(systemPropertyName = "ebx.directory.sso.properties", 
	serviceDescription = "A service to configure the properties required for SSO SAML 2.0 integration.\r\n"
		+ "Must set ebx.directory.factory=com.orchestranetworks.ps.customDirectory.CustomDirectoryFactory in ebx.properties", 
	serviceKey = "SSOConfigurationKey", 
	nameInMenu = "SSO SAML 2.0 Configuration",
	requiredPropertyName="ebx.directory.factory",
	requiredPropertyValue="com.orchestranetworks.ps.customDirectory.CustomDirectoryFactory,com.orchestranetworks.ps.customDirectory.LdapDirectoryFactory")
public class SSOConfiguration extends DirectoryConfiguration
{
	@Property(propertyName = "ebx.directory.sso.ebxurl", 
		label = "EBX Server Host URL", 
		dataType = "string", 
		description = "EBX Server Host URL, format HTTP[S]://[Hsot name]:[port number]/ebx/", 
		order = 13)
	public String ebxurl;

	@Property(propertyName = "ebx.directory.sso.saml.samlresponseelementname", 
		label = "SAML Response Element Name", 
		dataType = "string", 
		description = "Specify the parameter name where the SAML response is stored in the HTTP request posted to EBX.\r\n" + 
			"The standard requires it to be SAMLResponse but in case one doesn't follow the standard this is a way to override it.", 
		defaultValue = "SAMLResponse",
		order = 14)
	public String samlresponseelementname;

	@Property(propertyName = "ebx.directory.sso.idp.url", 
		label = "IDP Server URL", 
		dataType = "string", 
		description = "URL to IDP server. Authentication requests will be redirected to this URL.\r\n This value needs to be obtained from the IDP provider.", 
		order = 15)
	public String idpUrl;

	@Property(propertyName = "ebx.directory.sso.idp.issuerid", 
		label = "IDP Issuer ID", 
		dataType = "string", 
		description = "This is the IDP issuer ID, It is to verify that the IDP is who he is.\r\n This value needs to be obtained from the IDP provider.", 
		order = 16)
	
	public String idpIssuerId;
		
	@Property(propertyName = "ebx.directory.sso.idp.isjksfile", 
		label = "Is Certificate stored in a JKS file", 
		dataType = "string", 
		description = "Referal Policy default \"follow\"", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 17)
	
	public String isjksfile;

	@Property(propertyName = "ebx.directory.sso.idp.jkspassword", 
		label = "JKS File passowrd", 
		dataType = "password", 
		description = "Password to be used to load a certificate from a JKS file. \r\n If the property @ebx.directory.sso.saml.passwordencrypted is set to true\r\n" + 
					  "then the value will be encrypted.", 
		order = 18)
	
	public String jkspassword;

	@Property(propertyName = "ebx.directory.sso.idp.certificate.alias", 
		label = "Certificate Alias in the JKS File", 
		dataType = "string", 
		description = "If the property @ebx.directory.sso.idp.isjksfile is set to true, then this property is required.\r\n" +
					  "It is the alias to be used to load the certificate form the JKS file.",  
		order = 19)
	public String jksAllias;
	
	@Property(propertyName = "ebx.directory.sso.idp.certificate.file", 
		label = "Certificate File", 
		dataType = "string", 
		description = "If the property @ebx.directory.sso.idp.isjksfile is set to true, this should be the path to a JKS file otherwise a path to a certificate file.\r\n" + 
			"This needs to be a path that exist on the SERVER. \r\n" +
			"Java includes a tool to load certificate files into a JKS file.\r\n" + 
			"from the java bin folder you can execute the following command:\r\n" + 
			"keytool -import -alias {an alias name} -keystore [path to a JKS file \r\n" + 
			"e.g. Java runtime /.../jdk1.8/jre/lib/security/cacerts -file [path to a certificate file e.g. /home/gugrim/tmp/sunas.der]\r\n" + 
			"\r\n" + 
			"useful command to check the certificates stored on a file\r\n" + 
			"keytool -v -list -keystore .keystorekeytool -v -list -keystore [path to the file that contain certificates]", 
		order = 20)
	
	public String certificateFile;

	@Property(propertyName = "ebx.directory.sso.sp.issuerid", 
		label = "EBX (SP) Issuer ID", 
		dataType = "string", 
		description = 	"This is the Service Provider issuer ID. \r\n" +
						"It is a value representing EBX. this value needs to be set on the IDP server\r\n"+
						"(application configuration) and here with the same value\r\n" + 
						"The IDP server uses this value to verify that EBX is sending the authentication request and not someone else. ",
		order = 21)
	
	public String spIssuerId;

	@Property(propertyName = "ebx.directory.sso.saml.user.email", 
		label = "User Email Attribute Name", 
		dataType = "string", 
		description = 	"Part of the SAML response will have user information in it. in the form of attributes in the assertion portion.\r\n" + 
						"This property tell EBX SSO Integration what is the property name for the user email.", 
		order = 22)
	
	public String userEmail;

	@Property(propertyName = "ebx.directory.sso.saml.user.firstname", 
		label = "User First Name Attribute Name", 
		dataType = "string", 
		description = 	"Part of the SAML response will have user information in it. in the form of attributes in the assertion portion.\r\n" + 
						"This property tell EBX SSO Integration what is the property name for the user first name.", 
		order = 23)
	
	public String userFirstName;

	@Property(propertyName = "ebx.directory.sso.saml.user.lastname", 
		label = "User Last Name Attribute Name", 
		dataType = "string", 
		description = 	"Part of the SAML response will have user information in it. in the form of attributes in the assertion portion.\r\n" + 
						"This property tell EBX SSO Integration what is the property name for the user last name.", 
		order = 24)
	
	public String userTastName;
	
	@Property(propertyName = "ebx.directory.sso.useroles", 
		label = "Enable User Roles", 
		dataType = "string", 
		description = "Enable User Roles Support - Authorization", 
		possibleValuesClassName = "com.orchestranetworks.ps.ui.annotations.beans.possiblevalues.YesNoPossibleValues", 
		order = 25)
	
	public String isUserRoles;
	
	
	@Property(propertyName = "ebx.directory.sso.saml.user.roles", 
		label = "User Roles Attribute Name", 
		dataType = "string", 
		description = 	"Part of the SAML response will have user information in it. in the form of attributes in the assertion portion.\r\n" + 
						"This property tell EBX SSO Integration what is the property name for the user roles/groups.", 
		order = 26)
	
	public String userRoles;

	@Property(propertyName = "ebx.directory.sso.idp.nameid.policy", 
		label = "Namig Policy", 
		dataType = "string", 
		description = "this defines the policy for storing user info. for SAML 2 \r\n" + 
					  "Default is \"urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified\" ", 
		defaultValue = "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
		order = 27)
	
	public String namingPolicy;		
	
}
