/*
 * Copyright Orchestra Networks 2000-2012. All rights reserved.
 */
package com.pers.mdm.common.devartifacts;

import com.pers.mdm.common.module.*;
import com.orchestranetworks.ps.admin.devartifacts.*;

/**
 * A subclass that specifies the paths to the services
 * 
 * @deprecated No longer needed. Use Dev Artifact's built-in command line interface instead.
 */
@Deprecated
public class PersDevArtifactsServiceMain extends DevArtifactsServiceMain
{
	/**
	 * Overridden in order to specify the module & path to the servlets
	 * 
	 * @param serviceType Either <code>EXPORT</code> or <code>IMPORT</code>
	 */
	@Override
	public String getServicePath(ServiceType serviceType)
	{
		String module = "/" + PersModuleRegistrationListener.MODULE_NAME;
		if (serviceType == ServiceType.EXPORT)
		{
			return module + "/ExportDevArtifacts";
		}
		else if (serviceType == ServiceType.IMPORT)
		{
			return module + "/ImportDevArtifacts";
		}
		throw new IllegalArgumentException("Unsupported serviceType " + serviceType);
	}

	/**
	 * The main method.
	 */
	public static void main(String[] args)
	{
		DevArtifactsServiceMain.doMain(args, new PersDevArtifactsServiceMain());
	}
}
