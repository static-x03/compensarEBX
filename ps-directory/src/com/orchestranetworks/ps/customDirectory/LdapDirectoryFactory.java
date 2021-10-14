package com.orchestranetworks.ps.customDirectory;

import com.onwbp.adaptation.*;
import com.orchestranetworks.service.directory.*;

public class LdapDirectoryFactory extends DirectoryDefaultFactory
{
	@Override
	public Directory createDirectory(AdaptationHome aHome) throws Exception
	{
		CustomDirectory dir = new CustomDirectory(aHome);
		dir.setExternalDirectory(new LdapDirectory());
		return dir;
	}
}
