package com.orchestranetworks.ps.directory.alternatedirectories;

import java.util.*;

import com.orchestranetworks.service.*;

public interface AlternateDirectoryCapable
{
	List<Role> getAllAlternateDirectoryRoles();

	List<Role> getAlternateDirectoryRolesForUser(UserReference user);
}
