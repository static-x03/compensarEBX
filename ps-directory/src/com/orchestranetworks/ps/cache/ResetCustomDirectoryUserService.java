package com.orchestranetworks.ps.cache;

import com.orchestranetworks.ps.service.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.ui.selection.*; 

public class ResetCustomDirectoryUserService<S extends DataspaceEntitySelection>
	extends
	AbstractUserService<S>
{

	@Override
	public void execute(Session session) throws OperationException
	{
		if (DirectoryCacheManager.isUsingCache())
		{
			DirectoryCacheManager.clearCache();
			alert("Custom Directory Cache was reset.");
		}

	}

}
