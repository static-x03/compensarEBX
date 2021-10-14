package com.orchestranetworks.ps.cache;

import com.orchestranetworks.ps.service.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.ui.selection.*;
import com.orchestranetworks.userservice.*;

public class ResetCustomDirectoryCacheDeclaration extends TechAdminOnlyServiceDeclaration
{
	public static final String SERVICE_KEY = "ResetCustomDirectoryCache";

	private static final String RESET_CUSTOME_DIRECTORY_CACHE_TITLE = "Reset Custom Directory Cache";
	private static final String RESET_CUSTOME_DIRECTORY_CACHE_DESCRIPTION = "Reset the Custom Directory Cache to force reload of new definitions.";

	public ResetCustomDirectoryCacheDeclaration(String moduleName)
	{
		super(
			moduleName == null ? ServiceKey.forName(SERVICE_KEY)
				: ServiceKey.forModuleServiceName(moduleName, SERVICE_KEY),
			null,
			RESET_CUSTOME_DIRECTORY_CACHE_TITLE,
			RESET_CUSTOME_DIRECTORY_CACHE_DESCRIPTION,
			null);
	}

	@Override
	public UserService<DataspaceEntitySelection> createUserService()
	{
		return new ResetCustomDirectoryUserService<>();
	}

}
