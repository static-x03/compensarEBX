package com.orchestranetworks.ps.scheduledtask;

import java.util.*;

import com.orchestranetworks.instance.*;
import com.orchestranetworks.ps.customDirectory.*;
import com.orchestranetworks.scheduler.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.service.directory.*;
import com.orchestranetworks.service.directory.DirectoryDefault.*;
/**
 * This scheduled task will find all the users in a given role and load them into EBX (or update them if they already
 * exist) and associate them with that role (if not already associated).  This is non-destructive -- users are only ever
 * added and never detached from prior roles.
 */
public class SyncUsersScheduledTask extends ScheduledTask
{
	private String role;

	@Override
	public void execute(ScheduledExecutionContext context)
		throws OperationException, ScheduledTaskInterruption
	{
		Repository repo = context.getRepository();
		DirectoryHandler directoryHandler = DirectoryHandler.getInstance(repo);
		Directory directory = directoryHandler.getDirectoryImplementation();
		try
		{
			if (directory instanceof CustomDirectory)
			{
				CustomDirectory cd = (CustomDirectory) directory;
				Role r = Role.forSpecificRole(role);
				List<UserReference> users = cd.getExtUsersInRole(Role.forSpecificRole(role));
				for (UserReference userReference : users)
				{
					User userObject = new User();
					userObject.setUserReference(userReference);
					if (directoryHandler.isUserDefined(userReference))
					{
						cd.updateUser(userObject, false);
					}
					else
					{
						cd.createUser(userObject, false);
					}
					UserEntity user = DirectoryDefaultHelper.findUser(userReference, cd);
					List<Role> roles = user.getSpecificRoles();
					if (!roles.contains(r))
					{
						roles = new ArrayList<>(roles);
						roles.add(r);
						user.setSpecificRoles(roles);
						DirectoryDefaultHelper.saveUser(user, "", cd);
					}
				}
			}
		}
		catch (Exception e)
		{
			throw OperationException.createError(e);
		}

	}

	public String getRole()
	{
		return role;
	}

	public void setRole(String role)
	{
		this.role = role;
	}

}
