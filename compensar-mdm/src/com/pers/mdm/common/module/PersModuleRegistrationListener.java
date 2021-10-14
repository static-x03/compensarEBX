package com.pers.mdm.common.module;

import javax.servlet.annotation.*;

import com.orchestranetworks.ps.module.*;

@WebListener
public class PersModuleRegistrationListener extends PSModuleRegistrationListener
{
	public static final String MODULE_NAME = "compensar-mdm";

	public PersModuleRegistrationListener()
	{
		super(MODULE_NAME);
	}

}