package com.orchestranetworks.ps.customDirectory.sso;

import javax.servlet.http.*;

import org.apache.commons.configuration2.*;
import org.apache.commons.lang3.*;

import com.orchestranetworks.ps.customDirectory.*;
import com.orchestranetworks.service.*;

/**
 * @author Derek Seabury
 * A custom external SSO instance must implement the methods in CheckSSO.
 * This allows for the CustomDirectoryInstance to access the extended functionality.
 */
public class SSOCheck extends HttpAuthenticate
{
	public SSOCheck()
	{
		// We need to be allocated dynamically so no parameters
		// Expect the updateSSOProperties() call before use.
	}

	@Override
	public User GetUserFromHTTPRequest(final HttpServletRequest req)
	{
		String uname = req.getParameter("login");
		if (StringUtils.isEmpty(uname))
		{
			uname = req.getRemoteUser();
		}
		if (StringUtils.isEmpty(uname))
		{
			uname = req.getRemoteUser();
		}

		if (!StringUtils.isEmpty(uname))
		{
			User user = new User();
			user.setUserReference(UserReference.forUser(uname));
			return user;
		}
		return null;
	}

	@Override
	public void updateSSOProperties(Configuration config)
	{
	}

}
