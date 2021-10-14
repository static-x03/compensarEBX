package com.orchestranetworks.ps.customDirectory.sso.saml;

import java.io.*;
import java.nio.file.*;
import java.util.*;

import javax.servlet.http.*;
import javax.xml.parsers.*;

import org.apache.commons.configuration2.Configuration;
import org.apache.commons.lang3.*;
import org.joda.time.*;
import org.opensaml.*;
import org.opensaml.saml2.core.*;
import org.opensaml.saml2.core.validator.*;
import org.opensaml.saml2.encryption.*;
import org.opensaml.saml2.encryption.Decrypter;
import org.opensaml.xml.encryption.*;
import org.opensaml.xml.security.credential.*;
import org.opensaml.xml.security.keyinfo.*;
import org.opensaml.xml.security.x509.*;
import org.opensaml.xml.signature.*;
import org.w3c.dom.*;

import com.onwbp.org.apache.log4j.*;
import com.orchestranetworks.ps.configuration.*;
import com.orchestranetworks.ps.constants.*;
import com.orchestranetworks.ps.customDirectory.*;
import com.orchestranetworks.ps.logging.*;
import com.orchestranetworks.ps.utils.*;
import com.orchestranetworks.service.*;

public class SamlSSOCheck extends HttpAuthenticate
{
	private static final Category logger = CustomLogger.newInstance();
	private static boolean initializedOpenSaml = false;

	private List<Credential> idpCredentials;

	@Override
	public User GetUserFromHTTPRequest(HttpServletRequest request)
	{

		String responseMessage = request
			.getParameter(SSOConfiguration.getSAMLResponseElementName());
		if (responseMessage == null)
		{
			if (logger.isDebugEnabled())
			{
				logger.debug(
					"Expected a SAML response for the element "
						+ SSOConfiguration.getSAMLResponseElementName());
			}
			return null;
		}

		initOpenSaml();

		byte[] base64DecodedResponse = org.opensaml.xml.util.Base64.decode(responseMessage);

		ByteArrayInputStream is = new ByteArrayInputStream(base64DecodedResponse);

		DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();
		documentBuilderFactory.setNamespaceAware(true);
		DocumentBuilder docBuilder;
		try
		{
			docBuilder = documentBuilderFactory.newDocumentBuilder();
			Document document = docBuilder.parse(is);
			if (logger.isDebugEnabled())
			{
				logger.debug(" =============  SAML Response: =================");
				logger.debug(LDAPUtils.getStringFromDoc(document));
			}
			Element element = document.getDocumentElement();

			org.opensaml.xml.io.UnmarshallerFactory unmarshallerFactory = org.opensaml.xml.Configuration
				.getUnmarshallerFactory();
			org.opensaml.xml.io.Unmarshaller unmarshaller = unmarshallerFactory
				.getUnmarshaller(element);
			Response response = (Response) unmarshaller.unmarshall(element);

			SamlResponse samlResponse = validateSamlResponse(response);

			return createUser(samlResponse);

		}
		catch (Exception e)
		{
			if (logger.isDebugEnabled())
			{
				logger.debug("Error processing request", e);
			}
			return null;
		}

	}

	private synchronized static void initOpenSaml()
	{
		if (!initializedOpenSaml)
		{
			try
			{
				DefaultBootstrap.bootstrap();
				initializedOpenSaml = true;
			}
			catch (Throwable ex)
			{
				throw new RuntimeException("Error while initializing the Open SAML library", ex);
			}
		}
	}

	private SamlResponse validateSamlResponse(Response response)
	{
		validateResponse(response);
		Assertion assertion = null;
		if (response.getAssertions().size() > 0)
		{
			assertion = validateAssertion(response);
		}
		else
		{
			assertion = validateEncryptedAssertion(response);
		}

		validateSignature(response);

		return new SamlResponse(assertion);
	}

	private Assertion validateEncryptedAssertion(Response response)
	{
		if (response.getEncryptedAssertions().size() == 0)
		{
			throw new RuntimeException("The response doesn't contain any encrypted assertions");
		}

		if (response.getEncryptedAssertions().size() != 1)
		{
			throw new RuntimeException(
				"The response doesn't contain exactly 1 encrypted assertion");
		}

		EncryptedAssertion encryptedAssertion = response.getEncryptedAssertions().get(0);
		return validateEncryptedAssertion(encryptedAssertion);
	}

	private Assertion validateEncryptedAssertion(EncryptedAssertion encryptedAssertion)
	{
		Assertion assertion = getDecryptedAssertion(encryptedAssertion);
		validateAssertion(assertion);
		return assertion;
	}

	private void validateSignature(Response response)
	{
		if (response.isSigned())
		{
			// we accept the response as long as one part is signed
			if (!validateResponseSignature(response) && !validateAssertionSignature(response))
			{
				throw new RuntimeException(
					"No signature is present in either response or assertion");
			}
		}
	}

	private boolean validateAssertionSignature(Response response)
	{
		// We assume that there is only one assertion in the response
		Assertion assertion = response.getAssertions().get(0);
		return validate(assertion.getSignature());
	}

	private boolean validateResponseSignature(Response response)
	{
		Signature signature = response.getSignature();
		return validate(signature);
	}

	private boolean validate(Signature signature)
	{
		if (signature == null)
		{
			return false;
		}

		idpCredentials = getCredential();

		boolean valid = false;
		for (Credential credential : idpCredentials)
		{
			try
			{
				SignatureValidator signatureValidator = new SignatureValidator(credential);
				signatureValidator.validate(signature);
				return true;
			}
			catch (Exception ex)
			{
				valid = false;
			}
		}
		return valid;
	}

	private void validateResponse(Response response)
	{
		try
		{
			new ResponseSchemaValidator().validate(response);
		}
		catch (Exception ex)
		{
			throw new RuntimeException("The response schema validation failed", ex);
		}

		if (!response.getIssuer().getValue().equals(SSOConfiguration.getIDPIssuerId()))
		{
			throw new RuntimeException(
				"The response issuer didn't match the expected value == Issuer ID on response is "
					+ response.getIssuer().getValue());
		}

		String statusCode = response.getStatus().getStatusCode().getValue();

		if (!statusCode.equals(SSOSAMLConstants.SAML2_SUCCESS))
		{
			throw new RuntimeException("Invalid status code: " + statusCode);
		}

	}

	private Assertion validateAssertion(Response response)
	{
		if (response.getAssertions().size() == 0)
		{
			throw new RuntimeException("The response doesn't contain any assertions");
		}

		if (response.getAssertions().size() != 1)
		{
			throw new RuntimeException("The response doesn't contain exactly 1 assertion");
		}

		Assertion assertion = response.getAssertions().get(0);
		validateAssertion(assertion);
		return assertion;
	}

	private void validateAssertion(Assertion assertion)
	{

		if (!assertion.getIssuer().getValue().equals(SSOConfiguration.getIDPIssuerId()))
		{
			throw new RuntimeException("The assertion issuer didn't match the expected value");
		}

		if (assertion.getSubject().getNameID() == null)
		{
			throw new RuntimeException(
				"The NameID value is missing from the SAML response; this is likely an IDP configuration issue");
		}

		enforceConditions(assertion.getConditions());
	}

	private Assertion getDecryptedAssertion(EncryptedAssertion encryptedAssertion)
	{
		try
		{
			java.security.PrivateKey privateKey = getPrivateKey(
				SSOConfiguration.getSPPrivateKeyFile());
			return decryptAssertion(encryptedAssertion, privateKey);
		}
		catch (Exception e)
		{
			if (logger.isDebugEnabled())
			{
				logger.error("Decrypted assertion error", e);
			}
			return null;
		}
	}

	protected Assertion decryptAssertion(
		EncryptedAssertion encryptedAssertion,
		java.security.PrivateKey privateKey)
	{

		BasicX509Credential decryptionCredential = new BasicX509Credential();

		decryptionCredential.setPrivateKey(privateKey);

		StaticKeyInfoCredentialResolver resolver = new StaticKeyInfoCredentialResolver(
			decryptionCredential);

		ChainingEncryptedKeyResolver keyResolver = new ChainingEncryptedKeyResolver();
		keyResolver.getResolverChain().add(new InlineEncryptedKeyResolver());
		keyResolver.getResolverChain().add(new EncryptedElementTypeEncryptedKeyResolver());
		keyResolver.getResolverChain().add(new SimpleRetrievalMethodEncryptedKeyResolver());

		Decrypter decrypter = new Decrypter(null, resolver, keyResolver);
		decrypter.setRootInNewDocument(true);
		Assertion assertion = null;
		try
		{
			assertion = decrypter.decrypt(encryptedAssertion);
		}
		catch (DecryptionException e)
		{
			if (logger.isDebugEnabled())
			{
				logger.error("Unable to decrypt SAML assertion", e);
			}
			return null;
		}
		return assertion;
	}

	private void enforceConditions(Conditions conditions)
	{
		DateTime now = DateTime.now();

		if (now.isBefore(conditions.getNotBefore()))
		{
			throw new RuntimeException(
				"The assertion cannot be used before " + conditions.getNotBefore().toString());
		}

		if (now.isAfter(conditions.getNotOnOrAfter()))
		{
			throw new RuntimeException(
				"The assertion cannot be used after  " + conditions.getNotOnOrAfter().toString());
		}
	}

	private List<Credential> getCredential()
	{
		List<java.security.cert.X509Certificate> certificates = null;
		certificates = SSOConfiguration.getIDPCertificate();

		List<Credential> credentials = new ArrayList<>();
		for (java.security.cert.X509Certificate certificate : certificates)
		{
			BasicX509Credential credential = new BasicX509Credential();
			credential.setEntityCertificate(certificate);
			credential.setPublicKey(certificate.getPublicKey());
			credential.setCRLs(Collections.emptyList());
			credentials.add(credential);
		}
		return credentials;
	}

	private java.security.PrivateKey getPrivateKey(String filename)
	{

		try
		{
			byte[] keyBytes = Files.readAllBytes(Paths.get(filename));

			//			byte[] derPrivateKey = DatatypeConverter.parseHexBinary(new String(keyBytes));

			java.security.spec.PKCS8EncodedKeySpec spec = new java.security.spec.PKCS8EncodedKeySpec(
				keyBytes);
			java.security.KeyFactory kf = java.security.KeyFactory.getInstance("RSA");
			return kf.generatePrivate(spec);
		}
		catch (Exception ex)
		{
			if (logger.isDebugEnabled())
			{
				logger.error("Couldn't read RSA private key file.", ex);
			}
			return null;
		}
	}

	private User createUser(SamlResponse samlResponse)
	{
		String userId = samlResponse.getNameID();
		if (StringUtils.isEmpty(userId))
		{
			return null;
		}
		User user = new User();
		user.setUserReference(UserReference.forUser(userId));
		user.setEmailAddress(samlResponse.getEmail());
		user.setFirstName(samlResponse.getFirstName());
		user.setLastName(samlResponse.getLastName());

		List<String> roles = samlResponse.getGroups();
		user.setRoles(roles);
		return user;
	}

	@Override
	public void updateSSOProperties(Configuration config)
	{
		// TODO Auto-generated method stub

	}

}
