package com.orchestranetworks.ps.rest.directory;

import java.util.*;

import javax.ws.rs.*;
import javax.ws.rs.container.*;
import javax.ws.rs.core.*;

import com.orchestranetworks.rest.annotation.*;
import com.orchestranetworks.rest.inject.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.service.directory.*;

/**
 * Provides Directory related REST Services developed using the APIs offered by the REST Toolkit.
 * 
 */
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Path(value = "/directory")
@Documentation("Directory REST Service")
public class DirectoryRESTService
{
	@Context
	private ResourceInfo resourceInfo;

	@Context
	private SessionContext sessionContext;

	@GET
	@Path("/description")
	@Documentation("Gets service description")
	@Consumes({ MediaType.TEXT_PLAIN, MediaType.APPLICATION_JSON })
	@Produces({ MediaType.TEXT_PLAIN, MediaType.APPLICATION_JSON })
	@AnonymousAccessEnabled
	// TODO: Should this be an anonymous service?
	public String handleServiceDescription()
	{
		// TODO: Not sure why we're doing this
		return this.resourceInfo.getResourceMethod().getAnnotation(Documentation.class).value();
	}

	/**
	 * Selects users in the given built-in role (administrator, everyone, owner, read-only).
	 * <pre>
	 * {@code 
	 * 		Sample REST URL to access the service: 
	 * 		http[s]://<host>:<port>/<moduleName>/rest/v1/ps/directory/directory/usersInBuiltInRole/<roleName>
	 * 		http://localhost:8494/sce-mdm/rest/v1/ps/directory/directory/usersInBuiltInRole/administrator
	 * }
	 * </pre>
	 * @param roleName the built-in role name (administrator, everyone, owner, read-only).
	 * @return list of {@link UserDTO} with the userId and label.
	 */
	@GET
	@Path("/usersInBuiltInRole/{roleName}")
	@Documentation("Selects users in a built-in role (administrator, everyone, owner, read-only)")
	public Collection<UserDTO> handleGetUsersInBuiltInRole(@PathParam("roleName") String roleName)
	{
		Role role = Role.forBuiltInRole(roleName);
		return doGetUsersInRole(role);
	}

	/**
	 * Selects users in a specific role (not a built-in role).
	 * <pre>
	 * {@code 
	 * 		Sample REST URL to access the service: 
	 * 		http[s]://<host>:<port>/<moduleName>/rest/v1/ps/directory/directory/usersInSpecificRole/<roleName>
	 * 		http://localhost:8494/sce-mdm/rest/v1/ps/directory/directory/usersInSpecificRole/COMM
	 * }
	 * </pre>
	 * @param roleName the specific role name.
	 * @return list of {@link UserDTO} with the userId and label.
	 */
	@GET
	@Path("/usersInSpecificRole/{roleName}")
	@Documentation("Selects users in a specific role (not a built-in role)")
	public Collection<UserDTO> handleGetUsersInSpecificRole(@PathParam("roleName") String roleName)
	{
		Role role = Role.forSpecificRole(roleName);
		return doGetUsersInRole(role);
	}

	/**
	 * Get the users in the given role.
	 * @param role the given role.
	 * @return list of {@link UserDTO} with the userId and label.
	 */
	private Collection<UserDTO> doGetUsersInRole(Role role)
	{
		Session session = sessionContext.getSession();
		DirectoryHandler dirHandler = session.getDirectory();
		List<UserReference> userReferences = dirHandler.getUsersInRole(role);
		return createDTOs(
			userReferences,
			dirHandler.getDirectoryImplementation(),
			session.getLocale());
	}

	/**
	 * Create the {@link UserDTO} objects.
	 * @param userReferences userReferences of the users in the given role.
	 * @param directory the directory handler.
	 * @param locale locale.
	 * @return list of {@link UserDTO} with the userId and label.
	 */
	private static Collection<UserDTO> createDTOs(
		Collection<UserReference> userReferences,
		Directory directory,
		Locale locale)
	{
		Collection<UserDTO> dtos = new ArrayList<>();
		for (UserReference userReference : userReferences)
		{
			UserDTO dto = new UserDTO();
			dto.setUserId(userReference.getUserId());
			dto.setLabel(directory.displayUser(userReference, locale));
			dtos.add(dto);
		}
		return dtos;
	}
}