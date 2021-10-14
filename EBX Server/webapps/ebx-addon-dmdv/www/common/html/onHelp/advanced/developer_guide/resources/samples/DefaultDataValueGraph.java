public class DefaultDataValueGraph implements UserService<RecordEntitySelection>
{

	@Override
	public void setupObjectContext(
		UserServiceSetupObjectContext<RecordEntitySelection> context,
		UserServiceObjectContextBuilder builder)
	{
	}

	@Override
	public void setupDisplay(
		UserServiceSetupDisplayContext<RecordEntitySelection> context,
		UserServiceDisplayConfigurator config)

	{

		final Adaptation record = context.getEntitySelection().getRecord();

		if (record != null)
		{
			UIButtonSpecNavigation close = config.newCloseButton();
			close.setDefaultButton(true);

			config.setContent(new UserServicePane()
			{
				@Override
				public void writePane(UserServicePaneContext context, UserServicePaneWriter writer)
				{

					//Disable display of the Overview box
					GraphDataSpec spec = new GraphDataSpec();
					spec.setOverviewDisplay(OverviewDisplayOptions.DISABLE);
					
					//Prevent users from accessing a detailed view of records
					spec.disableFeatures(GraphDataFeatures.RECORD_DETAILS);

					UIHttpManagerComponent comp = GraphDataHttpManagerComponentUtils
						.getComponentForGraphDataService(writer, record, spec);

					writer.add("<div id='incrementalDataContainerTab' style='height: 100%;'>");
					writer.add("<iframe id='incrementalDataTabIframe' width='100%' height='100%'");

					String url = comp.getURIWithParameters();
					writer.add(
						" frameBorder='0' style='border-width: 0px; ' src='" + url + "'></iframe>");
					writer.add("</div>");
					writer.addJS_cr(
						"var incrementalDataContainerTabElement = document.getElementById('incrementalDataContainerTab');");

					writer.addJS_cr("function resizeIncrementalDataTab(size){");
					{
						writer.addJS_cr(
							"incrementalDataContainerTabElement.style.width = size.w + 'px';");
						writer.addJS_cr(
							"incrementalDataContainerTabElement.style.height = size.h + 'px';");
					}
					writer.addJS_cr("}");
					writer.addJS_addResizeWorkspaceListener("resizeIncrementalDataTab");
				}
			});
		}
	}

	@Override
	public void validate(UserServiceValidateContext<RecordEntitySelection> context)
	{
	}

	@Override
	public UserServiceEventOutcome processEventOutcome(
		UserServiceProcessEventOutcomeContext<RecordEntitySelection> context,
		UserServiceEventOutcome eventOutcome)
	{
		return null;
	}
}