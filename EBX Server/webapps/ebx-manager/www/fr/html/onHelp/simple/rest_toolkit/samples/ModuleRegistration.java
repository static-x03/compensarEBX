import javax.servlet.annotation.*;

import com.orchestranetworks.module.*;

@WebListener
public final class RegistrationModule extends ModuleRegistrationListener
{
	@Override
	public void handleContextInitialized(final ModuleInitializedContext aContext)
	{
		// Registers dynamically a REST Toolkit application.
		aContext.registerRESTApplication(RESTApplication.class);
	}
}
