package com.orchestranetworks.ps.utils;

import java.io.*;

import javax.xml.transform.*;
import javax.xml.transform.dom.*;
import javax.xml.transform.stream.*;

import org.apache.commons.lang3.*;
import org.w3c.dom.*;

import com.orchestranetworks.ps.constants.*;

public class LDAPUtils
{
	public static String cleanLoginID(String login)
	{
		String serverId = getDomainId(login);

		String updatedLogin = login;
		if (!StringUtils.isEmpty(serverId)
			&& !LDAPConstants.DEFAULT_LDAP_SERVER_ID.equals(serverId))
		{
			updatedLogin = StringUtils.substringAfter(login, serverId);
			updatedLogin = StringUtils.substring(updatedLogin, 1);
		}

		return updatedLogin;
	}

	public static String getDomainId(String loginName)
	{
		if (StringUtils.contains(loginName, LDAPConstants.SERVER_ID_DELIMITER))
		{
			return StringUtils.substringBefore(loginName, LDAPConstants.SERVER_ID_DELIMITER);
		}
		return LDAPConstants.DEFAULT_LDAP_SERVER_ID;
	}

	public static String getStringFromDoc(Document doc) throws TransformerException
	{

		DOMSource domSource = new DOMSource(doc);
		StringWriter writer = new StringWriter();
		StreamResult result = new StreamResult(writer);
		TransformerFactory tf = TransformerFactory.newInstance();
		Transformer transformer = tf.newTransformer();
		transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
		transformer.setOutputProperty(OutputKeys.INDENT, "yes");
		transformer.transform(domSource, result);
		writer.flush();
		return writer.toString();
	}

}
