class SourcePictureRenderer implements NodeValueRenderer
{
	@Override
	public String getValue(NodeTemplateContext context)
	{
		String countryCode = (String) context.getNodeContext()
		.getNode()
		.getRecord()
		.get(Path.parse("/country_code"));
		if(StringUtils.isEmpty(countryCode))
		{
			return "";
		}
		switch (countryCode)
		{
			case "fr":
				return "/common/icons/french_flag.png"
			case "vn":
				return "/common/icons/vietnam_flag.png"
			case "us"
				return "/common/icons/usa_flag.png"
			default:
				return "";
		}
	}
}