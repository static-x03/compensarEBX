
package com.orchestranetworks.ps.customDirectory.sso.saml;

import java.util.*;

import org.opensaml.saml2.core.*;
import org.opensaml.xml.*;

import com.onwbp.org.apache.log4j.*;
import com.orchestranetworks.ps.configuration.*;
import com.orchestranetworks.ps.logging.*;

public class SamlResponse
{
	private static final Category logger = CustomLogger.newInstance();
	private Assertion assertion;
	private Map<String, List<String>> attributes;

	public SamlResponse(Assertion assertion)
	{
		this.assertion = assertion;
		attributes = findAttributesValueByName(assertion);

	}

	/**
	 * Retrieves the {@link Assertion} for the SAML response.
	 *
	 * @return The assertion for the SAML response.
	 */
	public Assertion getAssertion()
	{
		return assertion;
	}

	/**
	 * Retrieves the Name ID from the SAML response. This is normally the name of the authenticated
	 * user.
	 *
	 * @return The Name ID from the SAML response.
	 */
	public String getNameID()
	{
		return assertion.getSubject().getNameID().getValue();
	}

	public String getEmail()
	{
		return getSingleValue(SSOConfiguration.getUserEmail());
	}

	public String getFirstName()
	{
		return getSingleValue(SSOConfiguration.getUserFirstName());
	}

	public String getLastName()
	{
		return getSingleValue(SSOConfiguration.getUserLastName());
	}

	public String getSingleValue(String attributeName)
	{
		List<String> result = attributes.get(attributeName);
		if (result != null && result.size() == 1)
		{
			return result.get(0);
		}
		if (logger.isDebugEnabled())
		{
			logger.debug("No value was found in the response for the property " + attributeName);
		}
		return null;
	}

	private Map<String, List<String>> findAttributesValueByName(Assertion assertion)
	{
		if (assertion == null)
		{
			return null;
		}
		Map<String, List<String>> results = new HashMap<>();
		for (AttributeStatement statement : assertion.getAttributeStatements())
		{
			List<Attribute> attributes = statement.getAttributes();
			if (attributes != null)
			{
				for (Attribute attribute : attributes)
				{
					List<String> valueList = new ArrayList<>();
					if (logger.isDebugEnabled())
					{
						logger.debug("Attribute name: " + attribute.getName());
					}

					results.put(attribute.getName(), valueList);
					for (XMLObject xmlObject : attribute.getAttributeValues())
					{
						String value = xmlObject.getDOM().getTextContent();
						if (logger.isDebugEnabled())
						{
							logger.debug("   value: " + value);
						}
						valueList.add(value);
					}
				}
			}
		}
		return results;

	}

	public List<String> getGroups()
	{
		return attributes.get(SSOConfiguration.getUserRoles());
	}
}