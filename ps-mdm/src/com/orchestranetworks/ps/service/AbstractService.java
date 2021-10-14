package com.orchestranetworks.ps.service;

import java.io.*;
import java.util.*;

import javax.servlet.*;
import javax.servlet.http.*;

import com.onwbp.base.text.*;
import com.orchestranetworks.instance.*;
import com.orchestranetworks.ps.filetransfer.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.ui.*;
import com.orchestranetworks.workflow.*;

@Deprecated
public abstract class AbstractService extends HttpServlet
{
	private static final long serialVersionUID = 1213706250150546785L;
	public static final String DEFAULT_FILE_DOWNLOADER_SERVLET = "/FileDownloader";
	protected ServiceContext sContext;

	public static void writeDownloadLink(ServiceContext sContext, File file)
	{
		writeDownloadLink(sContext, null, file);
	}

	public static void writeDownloadLink(ServiceContext sContext, String label, File file)
	{
		String downloadURL = sContext.getURLForResource(DEFAULT_FILE_DOWNLOADER_SERVLET) + "?"
			+ FileDownloader.FILE_PATH_PARAM_NAME + "=" + file.getAbsolutePath();
		downloadURL = downloadURL.replaceAll("\\\\", "/");

		String fileShortName = file.getParentFile().getName() + " - " + file.getName();
		sContext.getUIComponentWriter().add_cr(
			"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + (label != null ? label + ": " : "") + "<a href='"
				+ downloadURL + "'>Download " + fileShortName + "</a><br>");
	}

	public void execute(HttpServletRequest request) throws ServletException
	{
		sContext = ServiceContext.getServiceContext(request);
		init(null, sContext.getCurrentHome().getRepository());
		try
		{
			execute(sContext.getSession());
		}
		catch (OperationException e)
		{
			throw new ServletException(e);
		}
		finally
		{
			landService();
		}
	}

	public void landService()
	{
		UIServiceComponentWriter writer = sContext.getUIComponentWriter();
		String url = sContext.getURLForEndingService();
		writer.addJS_cr("window.location.href='" + url + "';");
	}

	public void execute(ScriptTaskContext context) throws OperationException
	{
		Session session = context.getSession();
		Repository repo = context.getRepository();
		init(context, repo);
		execute(session);
		finish(context, repo);
	}

	public void init(DataContext dataContext, Repository repo)
	{
		// init local variables using dataContext
	}

	public void finish(DataContext dataContext, Repository repo)
	{
		// set any out parameters
	}

	public abstract void execute(Session session) throws OperationException;

	/**
	 * Convenience method for checking if an http parameter's value is true. The
	 * parameter map contains an array of strings for each parameter's value,
	 * but for the boolean parameters we know it will only contain one value
	 * with either "false" or "true".
	 * 
	 * @param paramValues
	 *            the array of values. See
	 *            {@link javax.servlet.ServletRequest#getParameterMap()}.
	 */
	protected static boolean isBooleanParamSet(String[] paramValues)
	{
		return paramValues != null && paramValues.length != 0 && paramValues[0].equals("true");
	}

	@Override
	protected void service(HttpServletRequest request, HttpServletResponse response)
		throws ServletException, IOException
	{
		super.service(request, response);
		execute(request);
	}

	protected static void alert(UIServiceComponentWriter writer, String message)
	{
		writer.addJS("alert('" + message + "');");
	}

	public static String appendServiceParameters(
		String componentUri,
		Map<String, String> parameters)
	{
		for (Map.Entry<String, String> entry : parameters.entrySet())
		{
			componentUri += '&' + entry.getKey() + '=' + entry.getValue();
		}
		return componentUri;
	}

	public static void displayInFrameWithCloseButton(
		ServiceContext sContext,
		String frameId,
		String componentUri)
	{
		UIServiceComponentWriter writer = sContext.getUIComponentWriter();
		writer.addJS_addResizeWorkspaceListener("resizeFrame");
		UIButtonSpecJSAction cancelButtonSpec = new UIButtonSpecJSAction(
			UserMessage.createInfo("Close"),
			"cancelForm();");
		writer.addButtonJavaScript(cancelButtonSpec);
		writer.add_cr(
			"<iframe id='" + frameId + "' name='" + frameId
				+ "' src='' style='border: none; width:100%'></iframe>");
		// Setting the url directly in the iframe declaration causes 2 subsessions to be created,
		// and some unpredictable behavior. So it should be set via js code after creating the
		// iframe.
		writer.addJS_cr("document.getElementById('" + frameId + "').src='" + componentUri + "';");
		writer.addJS_cr("function resizeFrame(size)");
		writer.addJS_cr("{");
		writer.addJS_cr("  var frameElement = document.getElementById('" + frameId + "');");
		writer.addJS_cr("  frameElement.style.height = size.h + 'px';");
		writer.addJS_cr("}");
		writer.addJS_cr("function cancelForm()");
		writer.addJS_cr("{");
		writer.addJS_cr("  window.location.href='" + sContext.getURLForEndingService() + "';");
		writer.addJS_cr("}");
	}

}
