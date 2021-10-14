/*
 * Copyright Orchestra Networks 2000-2012. All rights reserved.
 */
package com.orchestranetworks.ps.workflow;

import java.io.*;

import javax.servlet.*;
import javax.servlet.http.*;

import com.orchestranetworks.service.*;
import com.orchestranetworks.ui.*;

/**
 * @deprecated Servlets (that use {@link ServiceContext}) are deprecated. Should implement using the User Service framework.
 */
@Deprecated
public class ClearSessionInteractionCacheService extends HttpServlet
{
	private static final long serialVersionUID = 1L;

	@Override
	protected void service(HttpServletRequest request, HttpServletResponse response)
		throws ServletException, IOException
	{
		ServiceContext sContext = ServiceContext.getServiceContext(request);
		Session session = sContext.getSession();

		// Make sure only admins can execute
		if (!session.isUserInRole(Role.ADMINISTRATOR))
		{
			throw new ServletException("User doesn't have permission to execute service.");
		}

		WorkflowUtilities.clearSessionInteractionCache();

		UIComponentWriter writer = sContext.getUIComponentWriter();
		writer.addJS("alert('Service complete.');");
		writer.addJS("window.location.href='" + sContext.getURLForEndingService() + "';");
	}
}
