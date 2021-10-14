package com.orchestranetworks.ps.customDirectory;

import javax.servlet.http.*;

import org.apache.commons.configuration2.*;

import com.orchestranetworks.ps.customDirectory.sso.*;
import com.orchestranetworks.service.*;

public class HttpHeaderLogin extends SSOCheck
{
	private static final LoggingCategory LOG = LoggingCategory.getKernel();
	private static String HttpUsernameParamProperty = "ebx.directory.HttpUsernameParam";
	private String userNameParameter = null;

	@Override
	public User GetUserFromHTTPRequest(HttpServletRequest req)
	{
		if (userNameParameter != null)
		{
			String uname = req.getHeader(userNameParameter);
			if (uname != null && uname.length() > 0)
			{
				User ssoUser = new User();
				if (LOG.isInfo())
				{
					LOG.info("SSO login - " + userNameParameter + "=" + uname);
				}
				ssoUser.setUserReference(UserReference.forUser(uname));
				return ssoUser;
			}
			if (LOG.isDebug())
			{
				LOG.debug("SSO login - " + userNameParameter + " unset.");
			}
		}
		return super.GetUserFromHTTPRequest(req);
	}

	@Override
	public void updateSSOProperties(Configuration config)
	{
		if (config == null)
			this.userNameParameter = null;
		else
			this.userNameParameter = config.getString(HttpUsernameParamProperty);
	}

}
