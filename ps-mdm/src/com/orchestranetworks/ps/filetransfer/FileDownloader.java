/*
 * Copyright Orchestra Networks 2000-2011. All rights reserved.
 */
package com.orchestranetworks.ps.filetransfer;

import java.io.*;

import javax.servlet.*;
import javax.servlet.http.*;

/**
 * @deprecated This is only used by {@link com.orchestranetworks.ps.service.AbstractService}, which has been deprecated.
 */
@Deprecated
public class FileDownloader extends HttpServlet
{
	private static final long serialVersionUID = 8634849456064915548L;

	public static final String FILE_PATH_PARAM_NAME = "filePath";

	protected void service(HttpServletRequest request, HttpServletResponse response)
		throws ServletException, IOException
	{
		String filePath = request.getParameter(FILE_PATH_PARAM_NAME);
		if (filePath != null && !filePath.isEmpty())
		{
			String[] tmp = filePath.split("/");
			String fileName = tmp[tmp.length - 1];
			response.setHeader("Content-type", "application/octet-stream");
			response.setHeader("Content-Disposition", "attachment;filename=" + fileName);
			// TODO: KDM - Can we remove this commented out code?
			//response.setHeader("Content-Type", "application/force-download");
			ServletOutputStream out = response.getOutputStream();
			InputStream in = new FileInputStream(filePath);
			byte[] buf = new byte[1024];
			int l;
			while ((l = in.read(buf)) != -1)
			{
				out.write(buf, 0, l);
			}
			buf = null;
			in.close();
		}
	}
}
