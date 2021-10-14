package com.orchestranetworks.ps.customDirectory.sso.saml;

public class SamlException extends Exception
{

	private static final long serialVersionUID = 7771166288764278443L;

	public SamlException(String message)
	{
		super(message);
	}

	public SamlException(String message, Throwable cause)
	{
		super(message, cause);
	}
}