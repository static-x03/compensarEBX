public class StoreMainPane implements UIFormPane
{
	public static final String STORE_NAME_STYLE = "font-weight: bold; padding-top:20px; padding-bottom:20px";

	@Override
	public void writePane(final UIFormPaneWriter writer, final UIFormContext context)
	{

		String storeName = (String) context.getValueContext().getValue(Paths._Store._Name);

		writer.add("<div").addSafeAttribute("style", STORE_NAME_STYLE).add(">");
		writer.add("Data stored for " + StringEscapeUtils.escapeHtml(storeName));
		writer.add("</div>");

		// ...
	}
}