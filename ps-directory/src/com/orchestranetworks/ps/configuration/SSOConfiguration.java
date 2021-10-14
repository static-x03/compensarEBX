package com.orchestranetworks.ps.configuration;

import java.io.*;
import java.security.*;
import java.security.cert.*;
import java.util.*;

import org.apache.commons.lang3.*;
import org.opensaml.xml.security.x509.*;

import com.onwbp.org.apache.log4j.*;
import com.orchestranetworks.ps.constants.*;
import com.orchestranetworks.ps.logging.*;
import com.orchestranetworks.ps.util.*;

public class SSOConfiguration implements PropertiesConsumer
{
	private static final Category logger = CustomLogger.newInstance();
	/*
	 * Alternate configuration file for SSO configuration. the default is ebx.properties
	 */
	private static final String SSO_PROPERTY_FILE_SYSTEM_PROPERTY = "ebx.directory.sso.properties";
	/*
	 * EBX URL, e.g. http[s]://[host name]:[port number]/ebx/ the last '/' is important
	 */
	private static final String SSO_EBX_URL = "ebx.directory.sso.ebxurl";

	/*
	 * IDP server will return the saml response as a paramter in the http request.
	 * The parameter name, defauly is SAMLResponse
	 */
	private static final String SSO_SAML_RESPONSE_ELEMENT_NAME = "ebx.directory.sso.saml.samlresponseelementname";

	/*
	 * IDP issuer ID, this value is compared to the value passed in the SAML response
	 */
	private static final String SSO_IDP_ISSUER_ID = "ebx.directory.sso.idp.issuerid";

	/*
	 * This value identify EBX with the IDP server. used when redirecting a user to the IDP website
	 */
	private static final String SSO_SP_ISSUER_ID = "ebx.directory.sso.sp.issuerid";
	private static final String SSO_USER_EMAIL = "ebx.directory.sso.saml.user.email";
	private static final String SSO_USER_FIRST_NAME = "ebx.directory.sso.saml.user.firstname";
	private static final String SSO_USER_LAST_NAME = "ebx.directory.sso.saml.user.lastname";
	private static final String SSO_USER_ROLES = "ebx.directory.sso.saml.user.roles";

	private static final String SSO_SP_PRIVATE_KEY_FILE = "ebx.directory.sso.sp.privatekey.file";

	private static final String SSO_IDP_SAML_URL = "ebx.directory.sso.idp.url";
	private static final String SSO_IDP_SAML_NAME_ID_POLICY = "ebx.directory.sso.idp.nameid.policy";
	private static final String SSO_IDP_IS_JKS_FILE = "ebx.directory.sso.idp.isjksfile";
	private static final String SSO_IDP_JKS_FILE_PASSWORD = "ebx.directory.sso.idp.jkspassword";
	private static final String SSO_IDP_CERTIFICATE_ALLIAS = "ebx.directory.sso.idp.certificate.alias";
	private static final String SSO_IDP_CERTIFICATE_FILE = "ebx.directory.sso.idp.certificate.file";
	private static final String SSO_IDP_ENCODE_URL = "ebx.directory.sso.idp.encode.url";

	private static final String SSO_PRIVATE_KEY = "ebx.directory.sso.privatekey";

	private static final String[] secretProperties = new String[] { SSO_IDP_JKS_FILE_PASSWORD };

	protected PropertiesFileListener propertiesLoader = PropertiesFileListener
		.getPropertyLoader(getConfigurationFileName(), secretProperties, this);

	private static SSOConfiguration instance = new SSOConfiguration();

	private SSOConfiguration()
	{

	}

	public static String getConfigurationFileName()
	{
		String propPath = System.getProperty(SSO_PROPERTY_FILE_SYSTEM_PROPERTY);
		if (StringUtils.isEmpty(propPath))
		{
			propPath = System.getProperty(CommonConstants.EBX_PROPERTIES_SYSTEM_PROPERTY_NAME);
		}
		return propPath;
	}

	public static String getIDPUrl()
	{
		return instance.propertiesLoader.getProperty(SSO_IDP_SAML_URL);
	}

	public static String getIDPNameIDPolicySuffix()
	{
		return instance.propertiesLoader.getProperty(SSO_IDP_SAML_NAME_ID_POLICY);
	}

	public static String getSAMLResponseElementName()
	{
		String responseElement = instance.propertiesLoader
			.getProperty(SSO_SAML_RESPONSE_ELEMENT_NAME);
		if (StringUtils.isEmpty(responseElement))
		{
			return "SAMLResponse";
		}
		return responseElement;
	}

	public static String getIDPIssuerId()
	{
		return instance.propertiesLoader.getProperty(SSO_IDP_ISSUER_ID);
	}

	public static String getSPIssuerId()
	{
		return instance.propertiesLoader.getProperty(SSO_SP_ISSUER_ID);
	}

	public static String getEBXUrl()
	{
		return instance.propertiesLoader.getProperty(SSO_EBX_URL);
	}

	public static String getPrivateKey()
	{
		return instance.propertiesLoader.getProperty(SSO_PRIVATE_KEY);
	}

	public static String getPropertyValue(String propertyName)
	{
		return instance.propertiesLoader.getProperty(propertyName);
	}

	public static boolean isIDPJKSFile()
	{
		return getBooleanValue(SSO_IDP_IS_JKS_FILE, false);
	}

	public static String getIDPCertificateFile()
	{
		return instance.getCertificateFileName(SSO_IDP_CERTIFICATE_FILE);
	}

	public String getCertificateFileName(String paramName)
	{
		return instance.propertiesLoader.getProperty(paramName);
	}

	private static java.security.cert.X509Certificate getCertificateFromFile(String certificateFile)
	{
		File file = getFile(certificateFile);
		try
		{
			CertificateFactory cf = CertificateFactory.getInstance("X509");
			X509Certificate cert = (X509Certificate) cf
				.generateCertificate(new FileInputStream(file));
			return cert;
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}

	}

	private static java.security.cert.X509Certificate getCertificateFromJKSFile(
		String certificateFile,
		String password,
		String allias)
	{
		// loading the jks file
		KeyStore keyStore;
		try
		{
			keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
			FileInputStream fileInputStream = new FileInputStream(certificateFile);
			keyStore.load(fileInputStream, password.toCharArray());
			fileInputStream.close();
			KeyStoreX509CredentialAdapter adapter = new KeyStoreX509CredentialAdapter(
				keyStore,
				allias,
				password.toCharArray());
			return adapter.getEntityCertificate();
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}
	}

	public static File getFile(String fileParameterName)
	{
		String filePath = instance.propertiesLoader.getProperty(fileParameterName);
		if (StringUtils.isEmpty(filePath))
		{
			throw new RuntimeException("Property " + fileParameterName + " must have a value.");

		}
		File file = new File(filePath.trim());
		if (file.exists())
		{
			return file;
		}
		else
		{
			throw new RuntimeException(
				"Property " + fileParameterName + " value " + filePath + " is invalid location");
		}
	}

	public static boolean getBooleanValue(String paramName, boolean defaultValue)
	{
		String value = instance.propertiesLoader.getProperty(paramName);
		if (StringUtils.isEmpty(value))
		{
			return defaultValue;
		}
		return Boolean.valueOf(value.trim());
	}

	public static List<X509Certificate> getIDPCertificate()
	{
		if (getBooleanValue(SSO_IDP_IS_JKS_FILE, false))
		{
			String certificatePath = getIDPCertificateFile();
			String certificatePassword = getIDPJKSFilePassword();
			String certificateAlias = getIDPJKSAllias();

			if (StringUtils.isEmpty(certificatePath) || StringUtils.isEmpty(certificateAlias))
			{
				logger.error(
					"For a Certificate key store, A valid value for ebx.directory.sso.idp.certificate.alias and ebx.directory.sso.idp.certificate.file must be specify.");
			}

			return Collections.singletonList(
				getCertificateFromJKSFile(certificatePath, certificatePassword, certificateAlias));
		}
		else
		{
			return Collections.singletonList(getCertificateFromFile(SSO_IDP_CERTIFICATE_FILE));
		}
	}

	public static String getIDPJKSAllias()
	{
		return instance.propertiesLoader.getProperty(SSO_IDP_CERTIFICATE_ALLIAS);
	}

	public static String getIDPJKSFilePassword()
	{
		return instance.getJKSFilePassword(SSO_IDP_JKS_FILE_PASSWORD);
	}

	public static String getSPPrivateKeyFile()
	{
		return instance.propertiesLoader.getProperty(SSO_SP_PRIVATE_KEY_FILE);
	}

	public String getJKSFilePassword(String parameterName)
	{
		return instance.propertiesLoader.getDecryptValue(parameterName);
	}

	public static String getUserFirstName()
	{
		return instance.propertiesLoader.getProperty(SSO_USER_FIRST_NAME);
	}

	public static String getUserLastName()
	{
		return instance.propertiesLoader.getProperty(SSO_USER_LAST_NAME);
	}

	public static String getUserEmail()
	{
		return instance.propertiesLoader.getProperty(SSO_USER_EMAIL);
	}

	public static String getUserRoles()
	{
		return instance.propertiesLoader.getProperty(SSO_USER_ROLES);
	}

	public static boolean toEncodeUrl()
	{
		return getBooleanValue(SSO_IDP_ENCODE_URL, true);
	}

	@Override
	public void processProperies()
	{

	}

}
