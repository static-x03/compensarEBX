import javax.ws.rs.*;

import com.orchestranetworks.rest.annotation.*;

/**
 * The REST Toolkit service v1.
 */
@Path("/service/v1")
@Documentation("Service")
public final class Service
{
	...

	/**
	 * Gets service description
	 */
	@GET
	@AnonymousAccessEnabled
	public String handleServiceDescription()
	{
		...
	}

	/**
	 * Gets restricted service
	 */
	@GET
	@Authorization(IsUserAuthorized.class)
	public RestrictedServiceDTO handleRestrictedService()
	{
		...
	}
}