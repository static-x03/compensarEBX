package com.orchestranetworks.ps.directory.alternatedirectories;

import java.util.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.ps.customDirectory.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.service.directory.*;

public class AlternateDirectoriesDirectory extends CustomDirectory
{
	private static final int DEFAULT_ALTERNATE_DIRECTORY_INDICATOR_LENGTH = 1;
	private static final String DEFAULT_ALTERNATE_DIRECTORY_INDICATOR_LABEL_SEPARATOR = ": ";
	private static final String DEFAULT_PREFIX = "%";

	protected Map<String, Directory> directoryMap;

	protected AlternateDirectoriesDirectory(
		Map<String, Directory> directoryMap,
		AdaptationHome dataSpace)
	{
		super(dataSpace);
		init(directoryMap);
	}

	protected AlternateDirectoriesDirectory(
		Map<String, Directory> directoryMap,
		AdaptationHome dataSpace,
		boolean passthrough)
	{
		super(dataSpace, passthrough);
		init(directoryMap);
	}

	private void init(Map<String, Directory> directoryMap)
	{
		this.directoryMap = directoryMap;
		for (Directory dir : directoryMap.values())
		{
			if (!(dir instanceof AlternateDirectoryCapable || dir instanceof DirectoryDefault))
			{
				throw new IllegalArgumentException(
					"All directories in directoryMap must either implement AlternateDirectoryCapable or subclass DirectoryDefault.");
			}
		}
	}

	@Override
	public String displaySpecificRole(Role role, Locale locale)
	{
		if (isAlternateDirectoriesRole(role))
		{
			Directory dir = getAlternateDirectory(role);
			if (dir != null)
			{
				String wrappedRoleLabel = dir
					.displaySpecificRole(getAlternateDirectoryRole(role), locale);
				if (isPrefixIncludedInLabel())
				{
					String dirIndicator = getAlternateDirectoryIndicator(role);
					String dirIndicatorLabel = getAlternateDirectoryIndicatorLabel(dirIndicator);
					StringBuilder bldr = new StringBuilder("[");
					bldr.append(dirIndicatorLabel);
					String sep = getAlternateDirectoryIndicatorLabelSeparator();
					if (sep != null)
					{
						bldr.append(sep);
					}
					if (wrappedRoleLabel.startsWith("["))
					{
						bldr.append(wrappedRoleLabel.substring(1));
					}
					else
					{
						bldr.append(wrappedRoleLabel);
					}
					if (!wrappedRoleLabel.endsWith("]"))
					{
						bldr.append("]");
					}

					return bldr.toString();
				}
				return wrappedRoleLabel;
			}
		}
		return super.displaySpecificRole(role, locale);
	}

	protected boolean isPrefixIncludedInLabel()
	{
		return true;
	}

	// TODO: Do I need to implement this?
	//	@Override
	//	public List<Profile> getProfiles(ProfileListContext context)
	//	{
	//		// TODO Auto-generated method stub
	//		return null;
	//	}

	// TODO: Return null for alternate roles? What happens if I just don't implement it?
	//       Or should I put an email address field on the table defining the role combinations and use that?
	//	@Override
	//	public String getRoleEmail(Role aRole)
	//	{
	//		// TODO Auto-generated method stub
	//		return super.getRoleEmail(aRole);
	//	}

	@Override
	public List<UserReference> getUsersInRole(Role role)
	{
		if (isAlternateDirectoriesRole(role))
		{
			Directory dir = getAlternateDirectory(role);
			if (dir != null)
			{
				return dir.getUsersInRole(getAlternateDirectoryRole(role));
			}
		}
		return super.getUsersInRole(role);
	}

	@Override
	public boolean isRoleStrictlyIncluded(Role role, Role anotherRole)
	{
		if (isAlternateDirectoriesRole(role) && isAlternateDirectoriesRole(anotherRole))
		{
			String dirIndicator = getAlternateDirectoryIndicator(role);
			String anotherDirIndicator = getAlternateDirectoryIndicator(anotherRole);
			if (dirIndicator != null && dirIndicator.equals(anotherDirIndicator))
			{
				Directory dir = getAlternateDirectory(role);
				if (dir != null)
				{
					return dir.isRoleStrictlyIncluded(
						getAlternateDirectoryRole(role),
						getAlternateDirectoryRole(anotherRole));
				}
			}
		}
		return super.isRoleStrictlyIncluded(role, anotherRole);
	}

	@Override
	public boolean isSpecificRoleDefined(Role role)
	{
		if (isAlternateDirectoriesRole(role))
		{
			Directory dir = getAlternateDirectory(role);
			if (dir != null)
			{
				return dir.isSpecificRoleDefined(getAlternateDirectoryRole(role));
			}
		}
		return super.isSpecificRoleDefined(role);
	}

	@Override
	public boolean isUserInRole(UserReference user, Role role)
	{
		if (isAlternateDirectoriesRole(role))
		{
			Directory dir = getAlternateDirectory(role);
			if (dir != null)
			{
				return dir.isUserInRole(user, getAlternateDirectoryRole(role));
			}
		}
		return super.isUserInRole(user, role);
	}

	@Override
	public List<Role> getAllSpecificRoles()
	{
		List<Role> roles = super.getAllSpecificRoles();
		Set<Role> roleSet = new LinkedHashSet<>(roles);
		Set<String> alternateDirectoryIndicators = directoryMap.keySet();
		for (String alternateDirectoryIndicator : alternateDirectoryIndicators)
		{
			Directory alternateDir = directoryMap.get(alternateDirectoryIndicator);
			List<Role> alternateDirRoles;
			if (alternateDir instanceof AlternateDirectoryCapable)
			{
				alternateDirRoles = ((AlternateDirectoryCapable) alternateDir)
					.getAllAlternateDirectoryRoles();
			}
			else
			{
				alternateDirRoles = ((DirectoryDefault) alternateDir).getAllSpecificRoles();
			}
			addRolesFromAlternateDirectory(
				roleSet,
				alternateDirectoryIndicator,
				alternateDir,
				alternateDirRoles);
		}
		return new ArrayList<>(roleSet);
	}

	@Override
	public List<Role> getRolesForUser(UserReference user)
	{
		List<Role> roles = super.getRolesForUser(user);
		Set<Role> roleSet = new LinkedHashSet<>(roles);
		Set<String> alternateDirectoryIndicators = directoryMap.keySet();
		for (String alternateDirectoryIndicator : alternateDirectoryIndicators)
		{
			Directory alternateDir = directoryMap.get(alternateDirectoryIndicator);
			List<Role> alternateDirRoles;
			if (alternateDir instanceof AlternateDirectoryCapable)
			{
				alternateDirRoles = ((AlternateDirectoryCapable) alternateDir)
					.getAlternateDirectoryRolesForUser(user);
			}
			else
			{
				alternateDirRoles = ((DirectoryDefault) alternateDir).getRolesForUser(user);
			}
			addRolesFromAlternateDirectory(
				roleSet,
				alternateDirectoryIndicator,
				alternateDir,
				alternateDirRoles);
		}
		return new ArrayList<>(roleSet);
	}

	/**
	 * This returns all roles from the super class, ignoring the alternate directories.
	 * You could end up in an infinite loop if you call {@link #getAllSpecificRoles()}
	 * from code associated with a table that itself drives the alternate directories,
	 * so this can allow you to avoid that.
	 * 
	 * @return all specific roles except for those from the alternate directories
	 */
	public List<Role> getAllSpecificRolesExcludingAlternateDirectories()
	{
		return super.getAllSpecificRoles();
	}

	protected int getAlternateDirectoryIndicatorLength()
	{
		return DEFAULT_ALTERNATE_DIRECTORY_INDICATOR_LENGTH;
	}

	protected String getPrefix()
	{
		return DEFAULT_PREFIX;
	}

	public boolean isAlternateDirectoriesRole(Role role)
	{
		return role.getRoleName().startsWith(getPrefix());
	}

	protected String getAlternateDirectoryIndicator(Role role)
	{
		String roleName = role.getRoleName();
		int prefixLen = getPrefix().length();
		return roleName.substring(prefixLen, prefixLen + getAlternateDirectoryIndicatorLength());
	}

	public Directory getAlternateDirectory(Role role)
	{
		String dirIndicator = getAlternateDirectoryIndicator(role);
		return directoryMap.get(dirIndicator);
	}

	public Role getAlternateDirectoryRole(Role role)
	{
		return Role.forSpecificRole(
			role.getRoleName()
				.substring(getPrefix().length() + getAlternateDirectoryIndicatorLength()));
	}

	protected Role createRole(String alternateDirectoryRoleIndicator, Role alternateDirectoryRole)
	{
		return Role.forSpecificRole(
			getPrefix() + alternateDirectoryRoleIndicator + alternateDirectoryRole.getRoleName());
	}

	protected void addRolesFromAlternateDirectory(
		Set<Role> roleSet,
		String alternateDirectoryIndicator,
		Directory alternateDirectory,
		List<Role> alternateDirectoryRoles)
	{
		for (Role alternateDirRole : alternateDirectoryRoles)
		{
			roleSet.add(createRole(alternateDirectoryIndicator, alternateDirRole));
		}
	}

	protected String getAlternateDirectoryIndicatorLabel(String alternateDirectoryIndicator)
	{
		return alternateDirectoryIndicator;
	}

	protected String getAlternateDirectoryIndicatorLabelSeparator()
	{
		return DEFAULT_ALTERNATE_DIRECTORY_INDICATOR_LABEL_SEPARATOR;
	}
}
