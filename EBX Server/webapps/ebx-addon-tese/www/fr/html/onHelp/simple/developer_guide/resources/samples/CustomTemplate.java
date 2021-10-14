/**
 */
public class MyCustomTemplate implements SearchTemplate
{

	//The key must begin with the name of the custom module where you want to register this template followed by '@' and any value.
	private final static SearchTemplateKey KEY = SearchTemplateKey
		.parse("ebx-addon-docs@docsSearchTemplateExample");

	@Override
	public SearchTemplateKey getTemplateKey()
	{
		return KEY;
	}

	//Sets the label that identifies this template. This label displays in the menu that allows you to choose a search template.
	@Override
	public UserMessage getUserLabel()
	{
		return UserMessage.createInfo("My Custom Template");
	}

	@Override
	public UserMessage getUserDescription()
	{
		return UserMessage.createInfo("Template used for synonyms and stopwords demo.");
	}

}
