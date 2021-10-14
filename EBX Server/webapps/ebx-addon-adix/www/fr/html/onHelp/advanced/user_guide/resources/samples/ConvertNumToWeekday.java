public class ConvertNumToWeekday implements Transformation<ImportTransformationExecutionContext>
{
	private Locale locale;
	public void setup(TransformationConfigurationContext configurationContext)
		throws DataExchangeException
	{
		if (configurationContext == null)
		{
			throw new DataExchangeException(UserMessage.createError("Context is not initialized."));
		}
		this.locale = configurationContext.getSession().getLocale();
	}

	//This method gets the input data to transform and defines the transformation logic.
	public Object execute(ImportTransformationExecutionContext executionContext)
		throws DataExchangeException
	{
		if (executionContext == null)
		{
			throw new DataExchangeException(UserMessage.createError("Context is not initialized."));
		}

		//Obtain the value to import from the source application.
		Object inputValue = executionContext.getInputValue();
		if (inputValue == null)
		{
			return null;
		}

		//Performs a check on the target location.
		SchemaNode schemaNode = null;
		if (EBXField.class.isInstance(executionContext.getTargetField()))
		{
			EBXField ebxField = (EBXField) executionContext.getTargetField();
			schemaNode = ebxField.getSchemaNode();

			if (schemaNode.isComplex())
			{
				throw new DataExchangeException(
					UserMessage.createError(
						schemaNode.getLabel(this.locale)
							+ " is a complex type node. The transformation function 'Convert an integer to a string and vice versa' only supports simple type node."));
			}
		}

		//Sets how the data is transformed. In this case it is from one value to another. You could also specify that data types be transformed, values concatenated, etc.
		try
		{
			switch (schemaNode.formatToXsString(inputValue))
			{

			case "1":
				return "Monday";
			case "2":
				return "Tuesday";
			case "3":
				return "Wednesday";
			case "4":
				return "Thursday";
			case "5":
				return "Friday";
			case "6":
				return "Saturday";
			case "7":
				return "Sunday";
			}

			throw new DataExchangeException(UserMessage.createError("Invalid input data."));
		}
		catch (ClassCastException ex)
		{
			throw new DataExchangeException(ex);
		}
		catch (ConversionException ex)
		{
			throw new DataExchangeException(ex);
		}
		catch (Exception ex)
		{
			throw new DataExchangeException(ex);
		}
	}
}