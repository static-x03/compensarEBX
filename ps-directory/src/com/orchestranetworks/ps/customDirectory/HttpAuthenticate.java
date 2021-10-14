package com.orchestranetworks.ps.customDirectory;

import javax.servlet.http.*;

import org.apache.commons.configuration2.*;

/**
 * @author Derek Seabury
 * Allows the authentication of users based on HTTP request.
 * This allows for the CustomDirectoryInstance to access the extended functionality.
 */
public abstract class HttpAuthenticate
{
	public HttpAuthenticate()
	{
		// We need to be allocated dynamically so no parameters
		// Expect the updateSSOProperties() call before use.
	}

	/**
	 * @param HttpRequestObject - passed to this method by CustomDirectory
	 * @return User. if User is null the EBX login page will be presented to the user, otherwise User will be considered authenticated.
	 */
	public abstract User GetUserFromHTTPRequest(final HttpServletRequest req);
	public abstract void updateSSOProperties(Configuration config);
}
