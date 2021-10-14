package com.orchestranetworks.ps.customDirectory;

import com.onwbp.adaptation.*;
import com.orchestranetworks.service.directory.*;

/* Default factory for custom directory
 * @see com.orchestranetworks.service.directory.DirectoryDefaultFactory#createDirectory(com.onwbp.adaptation.AdaptationHome)
 */
public class CustomDirectoryFactory extends DirectoryDefaultFactory
{
	/* Create a custom directory without an external directory.
	 * A simple extension of the DirectoryDefaultFactory.
	 * 
	 * @see com.orchestranetworks.service.directory.DirectoryDefaultFactory#createDirectory(com.onwbp.adaptation.AdaptationHome)
	 */
	@Override
	public Directory createDirectory(AdaptationHome aHome) throws Exception
	{
		// Returns a base directory with no external secondary
		Directory dir = new CustomDirectory(aHome);
		return dir;
	}
}
