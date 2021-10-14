public class NumToWeekdayTransformationDefinition implements TransformationDefinition
{

	public String getCode()
	{
		return "numToweekday";
	}

	public UserMessage getLabel()
	{
		return UserMessage.createInfo("Num to Weekday transformation Function");
	}

	public UserMessage getDescription()
	{
		return UserMessage.createInfo(
			"On import a number in the source is converted to its corresponding day of the week.");
	}

	public List<InputDefinition> getInputDefinitions()
	{
		List<InputDefinition> inputDefinitions = new ArrayList<InputDefinition>();
		inputDefinitions.add(
			new InputDefinition(
				"String Input",
				UserMessage.createInfo("Input is a String"),
				SchemaTypeName.XS_STRING,
				false));
		return inputDefinitions;
	}

	public OutputDefinition getOutputDefinition()
	{
		return new OutputDefinition(
			UserMessage.createInfo("A day of the week"),
			SchemaTypeName.XS_STRING,
			false);
	}

	public List<ParameterDefinition> getParameterDefinitions()
	{
		return new ArrayList<ParameterDefinition>();
	}

	//You can use this transformation definition to automatically detect the file type. Based on the type, it can return a different transformation.
	public Transformation getTransformation(ServiceType serviceType)
	{
		switch (serviceType)
		{
		case SPREADSHEET_IMPORT:
			return new ConvertNumToWeekday();
		case CSV_IMPORT:
			//Add your own transformation for CSV or other formats.
		default:
			return null;
		}
	}

	public boolean isBidirectional()
	{
		return false;
	}

	public boolean isAggregation()
	{
		return false;
	}

}